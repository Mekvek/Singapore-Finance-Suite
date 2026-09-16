import { monthlyPayment, buildAmortization, buildYearlyAmort } from '../utils/math'

// ── BSD (Buyer's Stamp Duty) ──────────────────────────────────────────────────

export function calcBSD(price: number): number {
  const slabs = [
    { limit: 180000, rate: 0.01 },
    { limit: 180000, rate: 0.02 },
    { limit: 640000, rate: 0.03 },
    { limit: 500000, rate: 0.04 },
    { limit: 1500000, rate: 0.05 },
    { limit: Infinity, rate: 0.06 },
  ]
  let remaining = price
  let bsd = 0
  for (const slab of slabs) {
    if (remaining <= 0) break
    const chunk = Math.min(remaining, slab.limit)
    bsd += chunk * slab.rate
    remaining -= chunk
  }
  return bsd
}

// ── ABSD (Additional Buyer's Stamp Duty) ─────────────────────────────────────

export function calcABSD(price: number, citizenship: string, existingProps: number): number {
  const rates: Record<string, number[]> = {
    SC: [0, 0.2, 0.3],
    PR: [0.05, 0.3, 0.35],
    FG: [0.6, 0.6, 0.6],
    ENTITY: [0.65, 0.65, 0.65],
  }
  const cit = citizenship.toUpperCase()
  const table = rates[cit] ?? rates['FG']
  const idx = Math.min(existingProps, 2)
  return price * table[idx]
}

// ── EHG Grant Table ──────────────────────────────────────────────────────────

const EHG_TABLE = [
  { maxIncome: 1500, couples: 80000, singles: 40000 },
  { maxIncome: 2000, couples: 75000, singles: 37500 },
  { maxIncome: 2500, couples: 70000, singles: 35000 },
  { maxIncome: 3000, couples: 65000, singles: 32500 },
  { maxIncome: 3500, couples: 60000, singles: 30000 },
  { maxIncome: 4000, couples: 55000, singles: 27500 },
  { maxIncome: 4500, couples: 50000, singles: 25000 },
  { maxIncome: 5000, couples: 45000, singles: 22500 },
  { maxIncome: 5500, couples: 40000, singles: 20000 },
  { maxIncome: 6000, couples: 35000, singles: 17500 },
  { maxIncome: 6500, couples: 30000, singles: 15000 },
  { maxIncome: 7000, couples: 25000, singles: 12500 },
  { maxIncome: 7500, couples: 20000, singles: 10000 },
  { maxIncome: 8000, couples: 15000, singles: 7500 },
  { maxIncome: 8500, couples: 10000, singles: 5000 },
  { maxIncome: 9000, couples: 5000, singles: 2500 },
]

export interface GrantResult {
  ehg: number
  family: number
  phg: number
  singles: number
  total: number
  notes: string[]
}

export function calcGrants(
  income: number,
  citizenship: string,
  marital: string,
  firstTimer: string,
  flatType: string,
  phg: boolean,
  isBTO: boolean,
  estate: string
): GrantResult {
  const cit = citizenship.toUpperCase()
  const isSC = cit === 'SC'
  const isSingle = marital === 'single'
  const isFirst = firstTimer === 'yes'
  const notes: string[] = []

  let ehg = 0
  let family = 0
  let phgGrant = 0
  let singles = 0

  // EHG: SC first-timers only, buying BTO or resale
  if (isSC && isFirst) {
    const row = EHG_TABLE.find((r) => income <= r.maxIncome)
    if (row) {
      ehg = isSingle ? row.singles : row.couples
      notes.push(`EHG: S$${(ehg / 1000).toFixed(0)}K (income S$${income.toLocaleString()}/mth)`)
    } else {
      notes.push('Income exceeds EHG ceiling (>S$9,000/mth)')
    }
  }

  // Family Grant: SC/PR buying resale only
  if (!isBTO && !isSingle && isFirst) {
    const is5Room = flatType === '5room' || flatType === 'ea'
    if (cit === 'SC') {
      family = is5Room ? 40000 : 50000
      notes.push(`Family Grant: S$${(family / 1000).toFixed(0)}K (SC couple, resale)`)
    } else if (cit === 'PR') {
      family = is5Room ? 30000 : 40000
      notes.push(`Family Grant: S$${(family / 1000).toFixed(0)}K (SC-PR couple, resale)`)
    }
    if (income > 14000) {
      family = 0
      notes.push('Family Grant: Not eligible (income >S$14,000/mth)')
    }
  }

  // PHG: SC/PR buying resale, living within 4km of parents
  if (!isBTO && phg) {
    if (isSC) {
      phgGrant = 30000
      notes.push('PHG: S$30K (SC, living near parents)')
    } else if (cit === 'PR') {
      phgGrant = 20000
      notes.push('PHG: S$20K (PR, living near parents)')
    }
  }

  // Singles Grant: SC singles aged ≥35 buying resale
  if (!isBTO && isSingle && isSC && isFirst) {
    const flatRank = ['2room', '3room', '4room', '5room', 'ea'].indexOf(flatType)
    const sgAmounts = [25000, 20000, 15000, 10000, 10000]
    singles = sgAmounts[Math.max(0, Math.min(flatRank, sgAmounts.length - 1))]
    if (income > 7000) {
      singles = 0
      notes.push('Singles Grant: Not eligible (income >S$7,000/mth)')
    } else {
      notes.push(`Singles Grant: S$${(singles / 1000).toFixed(0)}K`)
    }
  }

  // BTO-only: no Family Grant, no PHG
  if (isBTO) {
    if (estate === 'nonmature' && !isSingle) {
      notes.push('Non-mature estate: BTO grants maximised')
    }
  }

  return { ehg, family, phg: phgGrant, singles, total: ehg + family + phgGrant + singles, notes }
}

// ── Max Loan ─────────────────────────────────────────────────────────────────

export interface MaxLoanResult {
  maxMSR: number
  maxTDSR: number
  maxHdbLoan: number
  maxBankLoan: number
}

export function calcMaxLoan(
  income: number,
  existingLoans: number,
  msrPct = 30,
  tdsrPct = 55,
  _hdbLtv = 80,
  _bankLtv = 75,
  rate = 3.5,
  tenure = 25
): MaxLoanResult {
  const msrPayment = income * (msrPct / 100)
  const tdsrPayment = Math.max(0, income * (tdsrPct / 100) - existingLoans)

  const pmtToLoan = (pmt: number) => {
    const r = rate / 100 / 12
    const n = tenure * 12
    if (r === 0) return pmt * n
    return (pmt * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n))
  }

  const maxHdbLoan = pmtToLoan(Math.min(msrPayment, tdsrPayment))
  const maxBankLoan = pmtToLoan(tdsrPayment)

  return {
    maxMSR: msrPayment,
    maxTDSR: tdsrPayment,
    maxHdbLoan,
    maxBankLoan,
  }
}

// ── Affordability classifier ──────────────────────────────────────────────────

export function affordClass(pct: number): { label: string; color: string } {
  if (pct <= 25) return { label: 'Comfortable', color: 'var(--color-green)' }
  if (pct <= 35) return { label: 'Manageable', color: 'var(--color-accent-teal)' }
  if (pct <= 45) return { label: 'Stretch', color: 'var(--color-accent-amber)' }
  return { label: 'Risky', color: 'var(--color-red)' }
}

// ── Shared profile type ───────────────────────────────────────────────────────

export interface PropertyProfile {
  age: number
  income: number
  cpfOA: number
  cash: number
  citizenship: string
  marital: string
  firstTimer: string
  existingLoans: number
  expenses: number
  msrPct?: number
  tdsrPct?: number
  hdbLtv?: number
  bankLtv?: number
}

// ── BTO Calculator ────────────────────────────────────────────────────────────

export interface BTOInputs {
  flatType: string
  estate: string
  price: number
  tenure: number
  rate: number
  phg: boolean
}

export interface BTOResult {
  grants: GrantResult
  effectivePrice: number
  loan: number
  downpayment: number
  cpfUsed: number
  cashNeeded: number
  monthlyMortgage: number
  totalInterest: number
  msrPct: number
  eligible: boolean
  eligibilityNotes: string[]
  progressivePayments: Array<{ stage: string; pct: number; amount: number }>
}

const BTO_PROGRESSIVE_STAGES = [
  { stage: 'Booking', pct: 5 },
  { stage: 'Foundation', pct: 10 },
  { stage: 'RC Framework (Lower)', pct: 10 },
  { stage: 'RC Framework (Upper)', pct: 5 },
  { stage: 'Roof', pct: 5 },
  { stage: 'Brick walls', pct: 5 },
  { stage: 'Windows & Doors', pct: 5 },
  { stage: 'Drains, Roads & Car Parks', pct: 5 },
  { stage: 'TOP (Vacant Possession)', pct: 25 },
  { stage: 'Legal Completion', pct: 25 },
]

export function calcBTO(profile: PropertyProfile, bto: BTOInputs): BTOResult {
  const hdbLtv = profile.hdbLtv ?? 80
  const msrLimit = profile.msrPct ?? 30
  const grants = calcGrants(
    profile.income,
    profile.citizenship,
    profile.marital,
    profile.firstTimer,
    bto.flatType,
    bto.phg,
    true,
    bto.estate
  )

  const effectivePrice = Math.max(0, bto.price - grants.total)
  const loan = effectivePrice * (hdbLtv / 100)
  const downpayment = effectivePrice - loan
  const cpfUsed = Math.min(profile.cpfOA, downpayment)
  const cashNeeded = Math.max(0, downpayment - cpfUsed)
  const mp = monthlyPayment(loan, bto.rate, bto.tenure)
  const totalInt = mp * bto.tenure * 12 - loan

  const msrPct = profile.income > 0 ? (mp / profile.income) * 100 : 999
  const eligibilityNotes: string[] = []

  // Income ceiling checks
  const incomeCeilings: Record<string, number> = {
    '2room': 7000,
    '3room': 7000,
    '4room': 10000,
    '5room': 10000,
    ec: 16000,
  }
  const ceiling = incomeCeilings[bto.flatType] ?? 10000
  if (profile.income > ceiling) {
    eligibilityNotes.push(
      `Income S$${profile.income.toLocaleString()} exceeds ceiling S$${ceiling.toLocaleString()} for ${bto.flatType}`
    )
  }
  if (profile.citizenship !== 'SC' && profile.citizenship !== 'PR') {
    eligibilityNotes.push('Foreigners are not eligible for HDB BTO')
  }
  if (msrPct > msrLimit) {
    eligibilityNotes.push(
      `MSR ${msrPct.toFixed(1)}% exceeds ${msrLimit}% limit — loan may be reduced`
    )
  }
  if (cashNeeded > profile.cash) {
    eligibilityNotes.push(
      `Cash shortfall: need S$${cashNeeded.toLocaleString()}, have S$${profile.cash.toLocaleString()}`
    )
  }

  const progressivePayments = BTO_PROGRESSIVE_STAGES.map((s) => ({
    ...s,
    amount: (bto.price * s.pct) / 100,
  }))

  return {
    grants,
    effectivePrice,
    loan,
    downpayment,
    cpfUsed,
    cashNeeded,
    monthlyMortgage: mp,
    totalInterest: totalInt,
    msrPct,
    eligible: eligibilityNotes.length === 0,
    eligibilityNotes,
    progressivePayments,
  }
}

// ── Resale Calculator ─────────────────────────────────────────────────────────

export interface ResaleInputs {
  price: number
  valuation: number
  lease: number
  flatType: string
  tenure: number
  rate: number
  phg: boolean
}

export interface ResaleResult {
  grants: GrantResult
  cov: number
  loan: number
  downpayment: number
  cpfUsed: number
  cashNeeded: number
  bsd: number
  monthlyMortgage: number
  totalInterest: number
  msrPct: number
  leaseRisk: {
    remaining: number
    ageAtExpiry: number
    cpfRestriction: boolean
    riskLevel: 'low' | 'medium' | 'high'
  }
  eligibilityNotes: string[]
}

export function calcResale(profile: PropertyProfile, rs: ResaleInputs): ResaleResult {
  const hdbLtv = profile.hdbLtv ?? 80
  const grants = calcGrants(
    profile.income,
    profile.citizenship,
    profile.marital,
    profile.firstTimer,
    rs.flatType,
    rs.phg,
    false,
    'resale'
  )

  const cov = Math.max(0, rs.price - rs.valuation)
  const loanBase = rs.valuation * (hdbLtv / 100)
  const loan = Math.min(loanBase, rs.price - grants.total - cov)
  const effectivePrice = rs.price - grants.total
  const downpayment = effectivePrice - loan
  const cpfUsed = Math.min(profile.cpfOA, downpayment - cov)
  const cashNeeded = Math.max(0, downpayment - Math.max(0, cpfUsed) + cov)
  const bsd = calcBSD(rs.price)
  const mp = monthlyPayment(Math.max(0, loan), rs.rate, rs.tenure)
  const totalInt = mp * rs.tenure * 12 - Math.max(0, loan)
  const msrPct = profile.income > 0 ? (mp / profile.income) * 100 : 999

  const ageAtExpiry = profile.age + rs.lease
  const cpfRestriction = rs.lease < 30
  let riskLevel: 'low' | 'medium' | 'high' = 'low'
  if (ageAtExpiry < 80) riskLevel = 'high'
  else if (ageAtExpiry < 95) riskLevel = 'medium'

  const eligibilityNotes: string[] = []
  if (cashNeeded > profile.cash) {
    eligibilityNotes.push(
      `Cash required: S$${cashNeeded.toLocaleString()} (have S$${profile.cash.toLocaleString()})`
    )
  }
  if (riskLevel === 'high') {
    eligibilityNotes.push(`Lease expires when you're ${ageAtExpiry} — significant lease risk`)
  }

  return {
    grants,
    cov,
    loan: Math.max(0, loan),
    downpayment,
    cpfUsed: Math.max(0, cpfUsed),
    cashNeeded,
    bsd,
    monthlyMortgage: mp,
    totalInterest: totalInt,
    msrPct,
    leaseRisk: { remaining: rs.lease, ageAtExpiry, cpfRestriction, riskLevel },
    eligibilityNotes,
  }
}

// ── Private Calculator ────────────────────────────────────────────────────────

export interface PrivateInputs {
  type: string
  price: number
  tenure: number
  rate: number
  existingProps: number
  rvbRent: number
  rvbAppreciation: number
  rvbYears: number
}

export interface StressTestRow {
  rateIncrease: string
  rate: number
  monthlyPayment: number
  tdsrPct: number
}

export interface PrivateResult {
  loan: number
  downpayment: number
  cpfUsed: number
  cashNeeded: number
  bsd: number
  absd: number
  legalFees: number
  agentFees: number
  totalUpfront: number
  monthlyMortgage: number
  totalInterest: number
  tdsrPct: number
  stressTest: StressTestRow[]
  rvb: {
    totalRent: number
    futureValue: number
    capitalGain: number
    verdict: 'Buy' | 'Rent' | 'Neutral'
  }
  yearlyAmort: ReturnType<typeof buildYearlyAmort>
  eligibilityNotes: string[]
}

export function calcPrivate(profile: PropertyProfile, pv: PrivateInputs): PrivateResult {
  const ltv = pv.existingProps >= 1 ? 45 : (profile.bankLtv ?? 75)
  const loan = pv.price * (ltv / 100)
  const downpayment = pv.price - loan
  const cpfUsed = Math.min(profile.cpfOA, downpayment)
  const bsd = calcBSD(pv.price)
  const absd = calcABSD(
    pv.price,
    pv.type === 'entity' ? 'ENTITY' : profile.citizenship,
    pv.existingProps
  )
  const legalFees = Math.max(2500, pv.price * 0.004)
  const agentFees = pv.type === 'resale_condo' ? pv.price * 0.01 : 0
  const cashNeeded = Math.max(0, downpayment - cpfUsed + bsd + absd + legalFees + agentFees)

  const mp = monthlyPayment(loan, pv.rate, pv.tenure)
  const totalInt = mp * pv.tenure * 12 - loan
  const tdsrPct = profile.income > 0 ? ((mp + profile.existingLoans) / profile.income) * 100 : 999

  const stressTest: StressTestRow[] = [1, 2, 3].map((inc) => {
    const r = pv.rate + inc
    const p2 = monthlyPayment(loan, r, pv.tenure)
    return {
      rateIncrease: `+${inc}%`,
      rate: r,
      monthlyPayment: p2,
      tdsrPct: profile.income > 0 ? ((p2 + profile.existingLoans) / profile.income) * 100 : 999,
    }
  })

  const totalRent = pv.rvbRent * 12 * pv.rvbYears
  const futureValue = pv.price * Math.pow(1 + pv.rvbAppreciation / 100, pv.rvbYears)
  const capitalGain = futureValue - pv.price
  const totalMortgagePaid = mp * 12 * pv.rvbYears
  let verdict: 'Buy' | 'Rent' | 'Neutral' = 'Neutral'
  if (capitalGain > totalRent) verdict = 'Buy'
  else if (totalRent < totalMortgagePaid * 0.6) verdict = 'Rent'

  const monthly = buildAmortization(loan, pv.rate, pv.tenure)
  const yearlyAmort = buildYearlyAmort(monthly)

  const eligibilityNotes: string[] = []
  if (tdsrPct > 55) eligibilityNotes.push(`TDSR ${tdsrPct.toFixed(1)}% exceeds 55% limit`)
  if (absd > 0) eligibilityNotes.push(`ABSD S$${absd.toLocaleString()} applies`)
  if (cashNeeded > profile.cash)
    eligibilityNotes.push(`Cash shortfall: S$${(cashNeeded - profile.cash).toLocaleString()}`)

  return {
    loan,
    downpayment,
    cpfUsed,
    cashNeeded,
    bsd,
    absd,
    legalFees,
    agentFees,
    totalUpfront: downpayment + bsd + absd + legalFees + agentFees,
    monthlyMortgage: mp,
    totalInterest: totalInt,
    tdsrPct,
    stressTest,
    rvb: { totalRent, futureValue, capitalGain, verdict },
    yearlyAmort,
    eligibilityNotes,
  }
}

// ── Compare Calculator ────────────────────────────────────────────────────────

export interface CompareInputs {
  btoPrice: number
  btoTenure: number
  btoRate: number
  rsPrice: number
  rsTenure: number
  rsRate: number
  pvPrice: number
  pvTenure: number
  pvRate: number
}

export interface CompareScenario {
  name: string
  price: number
  grants: number
  effectivePrice: number
  downpayment: number
  loan: number
  monthlyMortgage: number
  totalInterest: number
  tdsrPct: number
  bsdAbsd: number
  cashNeeded: number
  affordability: { label: string; color: string }
  score: number
}

export function calcCompare(profile: PropertyProfile, cmp: CompareInputs): CompareScenario[] {
  const hdbLtv = profile.hdbLtv ?? 80
  const bankLtv = profile.bankLtv ?? 75

  const btoGrants = calcGrants(
    profile.income,
    profile.citizenship,
    profile.marital,
    profile.firstTimer,
    '4room',
    false,
    true,
    'mature'
  )
  const rsGrants = calcGrants(
    profile.income,
    profile.citizenship,
    profile.marital,
    profile.firstTimer,
    '4room',
    false,
    false,
    'resale'
  )

  const btoEffective = Math.max(0, cmp.btoPrice - btoGrants.total)
  const btoLoan = btoEffective * (hdbLtv / 100)
  const btoDp = btoEffective - btoLoan
  const btoCpf = Math.min(profile.cpfOA, btoDp)
  const btoMp = monthlyPayment(btoLoan, cmp.btoRate, cmp.btoTenure)
  const btoTdsr = profile.income > 0 ? (btoMp / profile.income) * 100 : 0

  const rsEffective = Math.max(0, cmp.rsPrice - rsGrants.total)
  const rsLoan = rsEffective * (hdbLtv / 100)
  const rsDp = rsEffective - rsLoan
  const rsCpf = Math.min(profile.cpfOA, rsDp)
  const rsMp = monthlyPayment(rsLoan, cmp.rsRate, cmp.rsTenure)
  const rsTdsr = profile.income > 0 ? (rsMp / profile.income) * 100 : 0

  const pvLoan = cmp.pvPrice * (bankLtv / 100)
  const pvDp = cmp.pvPrice - pvLoan
  const pvCpf = Math.min(profile.cpfOA, pvDp)
  const pvBsd = calcBSD(cmp.pvPrice)
  const pvAbsd = calcABSD(cmp.pvPrice, profile.citizenship, 0)
  const pvMp = monthlyPayment(pvLoan, cmp.pvRate, cmp.pvTenure)
  const pvTdsr = profile.income > 0 ? ((pvMp + profile.existingLoans) / profile.income) * 100 : 0

  const scoreScenario = (
    mp: number,
    dp: number,
    cpfUsed: number,
    grants: number,
    tdsr: number,
    stamps: number
  ): number => {
    let s = 100
    const affordPct = profile.income > 0 ? (mp / profile.income) * 100 : 100
    if (affordPct > 45) s -= 30
    else if (affordPct > 35) s -= 15
    else if (affordPct > 25) s -= 8
    if (tdsr > 55) s -= 25
    else if (tdsr > 45) s -= 15
    if (grants === 0) s -= 10
    const cashNeeded = Math.max(0, dp - cpfUsed + stamps)
    if (cashNeeded > profile.cash) s -= 20
    return Math.max(0, s)
  }

  return [
    {
      name: 'HDB BTO',
      price: cmp.btoPrice,
      grants: btoGrants.total,
      effectivePrice: btoEffective,
      downpayment: btoDp,
      loan: btoLoan,
      monthlyMortgage: btoMp,
      totalInterest: btoMp * cmp.btoTenure * 12 - btoLoan,
      tdsrPct: btoTdsr,
      bsdAbsd: calcBSD(cmp.btoPrice),
      cashNeeded: Math.max(0, btoDp - btoCpf),
      affordability: affordClass(btoTdsr),
      score: scoreScenario(btoMp, btoDp, btoCpf, btoGrants.total, btoTdsr, calcBSD(cmp.btoPrice)),
    },
    {
      name: 'HDB Resale',
      price: cmp.rsPrice,
      grants: rsGrants.total,
      effectivePrice: rsEffective,
      downpayment: rsDp,
      loan: rsLoan,
      monthlyMortgage: rsMp,
      totalInterest: rsMp * cmp.rsTenure * 12 - rsLoan,
      tdsrPct: rsTdsr,
      bsdAbsd: calcBSD(cmp.rsPrice),
      cashNeeded: Math.max(0, rsDp - rsCpf),
      affordability: affordClass(rsTdsr),
      score: scoreScenario(rsMp, rsDp, rsCpf, rsGrants.total, rsTdsr, calcBSD(cmp.rsPrice)),
    },
    {
      name: 'Private',
      price: cmp.pvPrice,
      grants: 0,
      effectivePrice: cmp.pvPrice,
      downpayment: pvDp,
      loan: pvLoan,
      monthlyMortgage: pvMp,
      totalInterest: pvMp * cmp.pvTenure * 12 - pvLoan,
      tdsrPct: pvTdsr,
      bsdAbsd: pvBsd + pvAbsd,
      cashNeeded: Math.max(0, pvDp - pvCpf + pvBsd + pvAbsd),
      affordability: affordClass(pvTdsr),
      score: scoreScenario(pvMp, pvDp, pvCpf, 0, pvTdsr, pvBsd + pvAbsd),
    },
  ]
}

// ── Financial Dashboard ───────────────────────────────────────────────────────

export interface DashboardInputs {
  propertyPrice: number
  propertyType: 'bto' | 'resale' | 'private'
  loan: number
  monthlyMortgage: number
  upPrice: number
  upLoan: number
  upCpfUsed: number
  upCpfYrs: number
  upSalePrice: number
}

export interface UpgradeResult {
  cpfAccruedInterest: number
  agentFees: number
  netProceeds: number
  capitalGain: number
}

export interface InsightCard {
  icon: string
  title: string
  text: string
  level: 'info' | 'warn' | 'good'
}

export interface DashboardResult {
  netWorthPostBuy: number
  cashAfter: number
  monthlyStressRatio: number
  riskScore: number
  riskFlags: string[]
  upgradeResult: UpgradeResult
  insights: InsightCard[]
}

export function calcDashboard(profile: PropertyProfile, dash: DashboardInputs): DashboardResult {
  const cpfAccruedInterest = dash.upCpfUsed * (Math.pow(1.025, dash.upCpfYrs) - 1)
  const agentFees = dash.upSalePrice * 0.02
  const netProceeds =
    dash.upSalePrice - dash.upLoan - dash.upCpfUsed - cpfAccruedInterest - agentFees
  const capitalGain = dash.upSalePrice - dash.upPrice

  const totalLiquid = profile.cpfOA + profile.cash
  const cashAfter = Math.max(0, profile.cash - Math.max(0, dash.propertyPrice - dash.loan))
  const netWorthPostBuy = totalLiquid - dash.propertyPrice + dash.loan
  const monthlyStressRatio = profile.income > 0 ? (dash.monthlyMortgage / profile.income) * 100 : 0
  const bufferMonths = profile.expenses > 0 ? cashAfter / profile.expenses : 0

  let riskScore = 0
  const riskFlags: string[] = []

  if (monthlyStressRatio > 55) {
    riskScore += 25
    riskFlags.push('Mortgage exceeds 55% of income')
  } else if (monthlyStressRatio > 45) {
    riskScore += 15
  } else if (monthlyStressRatio > 35) {
    riskScore += 8
  }

  if (bufferMonths < 3) {
    riskScore += 20
    riskFlags.push('Less than 3 months emergency fund after purchase')
  } else if (bufferMonths < 6) {
    riskScore += 10
    riskFlags.push('Less than 6 months emergency fund')
  }

  if (cashAfter < 0) {
    riskScore += 25
    riskFlags.push('Insufficient cash for purchase')
  } else if (cashAfter < 10000) {
    riskScore += 10
    riskFlags.push('Very low cash after purchase')
  }

  riskScore = Math.min(100, riskScore)

  const insights = generateInsights({
    profile,
    dash,
    monthlyStressRatio,
    bufferMonths,
    cashAfter,
    riskScore,
  })

  return {
    netWorthPostBuy,
    cashAfter,
    monthlyStressRatio,
    riskScore,
    riskFlags,
    upgradeResult: { cpfAccruedInterest, agentFees, netProceeds, capitalGain },
    insights,
  }
}

// ── Smart Insights ────────────────────────────────────────────────────────────

export function generateInsights(params: {
  profile: PropertyProfile
  dash: DashboardInputs
  monthlyStressRatio: number
  bufferMonths: number
  cashAfter: number
  riskScore: number
}): InsightCard[] {
  const { profile, dash, monthlyStressRatio, bufferMonths, riskScore } = params
  const insights: InsightCard[] = []

  if (monthlyStressRatio > 45) {
    insights.push({
      icon: '⚠️',
      title: 'High Mortgage Burden',
      text: `Mortgage takes up ${monthlyStressRatio.toFixed(0)}% of your income. Consider a lower-priced property or longer tenure.`,
      level: 'warn',
    })
  }

  if (bufferMonths < 6) {
    insights.push({
      icon: '🚨',
      title: 'Thin Emergency Buffer',
      text: `Only ${bufferMonths.toFixed(1)} months of expenses in cash after purchase. Aim for 6+ months.`,
      level: 'warn',
    })
  }

  if (profile.firstTimer === 'yes' && profile.citizenship === 'SC') {
    insights.push({
      icon: '🎁',
      title: 'First-Timer Advantage',
      text: 'You qualify for EHG and potentially Family/Singles grants. Make sure to apply before purchase.',
      level: 'good',
    })
  }

  const absd = calcABSD(dash.propertyPrice, profile.citizenship, 0)
  if (absd > 0) {
    insights.push({
      icon: '💸',
      title: 'ABSD Applies',
      text: `Additional Buyer's Stamp Duty of S$${absd.toLocaleString()} adds to your upfront costs. Ensure you have sufficient cash.`,
      level: 'warn',
    })
  }

  if (riskScore >= 50) {
    insights.push({
      icon: '📉',
      title: 'High Financial Risk',
      text: 'Multiple risk factors detected. Consider delaying purchase until income rises or debts are reduced.',
      level: 'warn',
    })
  } else if (riskScore <= 20) {
    insights.push({
      icon: '✅',
      title: 'Good Financial Position',
      text: 'Your finances look solid for this purchase. Ensure you maintain the emergency buffer post-purchase.',
      level: 'good',
    })
  }

  if (profile.income > 0 && dash.propertyPrice / (profile.income * 12) > 10) {
    insights.push({
      icon: '📊',
      title: 'Price-to-Income High',
      text: `Property is ${(dash.propertyPrice / (profile.income * 12)).toFixed(1)}× your annual income. Typical healthy range is 5-8×.`,
      level: 'warn',
    })
  }

  if (profile.age > 45) {
    const maxTenure = Math.min(30, 65 - profile.age)
    insights.push({
      icon: '⏱️',
      title: 'Age-Based Tenure Limit',
      text: `Maximum loan tenure is approximately ${maxTenure} years based on your age. This increases monthly payments.`,
      level: 'info',
    })
  }

  return insights.slice(0, 6)
}
