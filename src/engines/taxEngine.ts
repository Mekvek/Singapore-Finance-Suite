import { getCpfRates, CPF_WAGE_CEILING_MONTHLY, CPF_WAGE_CEILING_ADDITIONAL } from '../utils/cpf'

export const TAX_BRACKETS: ReadonlyArray<{ min: number; max: number; rate: number }> = [
  { min: 0, max: 20000, rate: 0.0 },
  { min: 20000, max: 30000, rate: 0.02 },
  { min: 30000, max: 40000, rate: 0.035 },
  { min: 40000, max: 80000, rate: 0.07 },
  { min: 80000, max: 120000, rate: 0.115 },
  { min: 120000, max: 160000, rate: 0.15 },
  { min: 160000, max: 200000, rate: 0.18 },
  { min: 200000, max: 240000, rate: 0.19 },
  { min: 240000, max: 280000, rate: 0.195 },
  { min: 280000, max: 320000, rate: 0.2 },
  { min: 320000, max: 500000, rate: 0.22 },
  { min: 500000, max: 1000000, rate: 0.23 },
  { min: 1000000, max: Infinity, rate: 0.24 },
]

export const RELIEF_CAP = 80000

export interface TaxBracketRow {
  index: number
  min: number
  max: number
  rate: number
  incomeInBracket: number
  taxInBracket: number
  runningTotal: number
  active: boolean
}

export interface ParentDependant {
  stay: boolean
  handicapped: boolean
}

export interface TaxReliefInputs {
  nsman: number
  nsmanWife: boolean
  nsmanParent: boolean
  spouse: boolean
  spouseHandicapped: boolean
  qcr: number
  hcr: number
  wmcr: number
  parents: ParentDependant[]
  courseFees: number
  cpfTopUpSelf: number
  cpfTopUpFamily: number
  srs: number
  lifeInsurance: number
  maidLevy: number
  donations: number
}

export interface TaxReliefItem {
  label: string
  value: number
}

export interface TaxReliefResult {
  items: TaxReliefItem[]
  cpfEmployee: number
  cpfEmployer: number
  subtotalBeforeCap: number
  cappedTotal: number
  capApplied: boolean
  donationDeduction: number
  total: number
}

export interface TaxResult {
  tax: number
  breakdown: TaxBracketRow[]
  marginalRate: number
  activeIndex: number
}

export interface TaxCalcResult {
  grossEmployment: number
  grossOther: number
  grossIncome: number
  earnedIncome: number
  reliefResult: TaxReliefResult
  chargeableIncome: number
  taxResult: TaxResult
  effectiveRate: number
  averageRate: number
  savings: number
  incomeAfterTax: number
  monthlyTakeHome: number
}

export interface TaxParams {
  annualSalary: number
  annualBonus: number
  age: number
  directorFee: number
  commission: number
  otherEmployment: number
  business: number
  rental: number
  investment: number
  other: number
  cpfMode: 'auto' | 'manual'
  cpfEmployeeManual: number
  cpfEmployerManual: number
  srsCap: number
  reliefs: TaxReliefInputs
}

export interface TaxInsight {
  type: 'positive' | 'warning'
  text: string
}

export function computeCpfForTax(
  annualSalary: number,
  annualBonus: number,
  age: number
): { employee: number; employer: number } {
  const band = getCpfRates(age)
  const monthlyOW = annualSalary / 12
  const owSubjectMonthly = Math.min(monthlyOW, CPF_WAGE_CEILING_MONTHLY)
  const owSubjectAnnual = owSubjectMonthly * 12
  const awCeiling = Math.max(0, CPF_WAGE_CEILING_ADDITIONAL - owSubjectAnnual)
  const awSubject = Math.min(annualBonus, awCeiling)
  const total = owSubjectAnnual + awSubject
  return {
    employee: Math.round(total * band.emp),
    employer: Math.round(total * band.er),
  }
}

function computeEarnedIncomeRelief(earnedIncome: number, age: number): number {
  if (earnedIncome <= 0) return 0
  if (age < 55) return Math.min(earnedIncome * 0.01, 1000)
  if (age < 60) return Math.min(earnedIncome * 0.08, 6000)
  return Math.min(earnedIncome * 0.11, 8000)
}

export function computeParentRelief(parents: ParentDependant[]): number {
  return (parents ?? []).reduce((sum, p) => {
    if (p.handicapped) return sum + (p.stay ? 14000 : 10000)
    return sum + (p.stay ? 9000 : 5500)
  }, 0)
}

export function computeWMCR(count: number): number {
  let total = 0
  for (let i = 1; i <= count; i++) {
    total += i === 1 ? 8000 : i === 2 ? 10000 : 12000
  }
  return total
}

function computeReliefs(params: TaxParams, earnedIncome: number): TaxReliefResult {
  const r = params.reliefs
  let cpfEmployee: number
  let cpfEmployer: number

  if (params.cpfMode === 'manual') {
    cpfEmployee = Math.max(0, params.cpfEmployeeManual)
    cpfEmployer = Math.max(0, params.cpfEmployerManual)
  } else {
    const cpf = computeCpfForTax(params.annualSalary, params.annualBonus, params.age)
    cpfEmployee = cpf.employee
    cpfEmployer = cpf.employer
  }

  const items: TaxReliefItem[] = []
  const push = (label: string, val: number) => {
    if (val > 0) items.push({ label, value: val })
  }

  push('Earned Income Relief', computeEarnedIncomeRelief(earnedIncome, params.age))
  push('CPF Relief', cpfEmployee)
  push('NSman Relief', r.nsman)
  if (r.nsmanWife) push('NSman (Wife) Relief', 750)
  if (r.nsmanParent) push('NSman (Parent) Relief', 750)
  if (r.spouseHandicapped) push('Handicapped Spouse Relief', 5500)
  else if (r.spouse) push('Spouse Relief', 2000)
  push('Qualifying Child Relief', r.qcr * 4000)
  push('Handicapped Child Relief', r.hcr * 7500)
  push("Working Mother's Child Relief", computeWMCR(r.wmcr))
  push('Parent Relief', computeParentRelief(r.parents))
  push('Course Fees Relief', Math.min(r.courseFees, 5500))
  push('CPF Cash Top-up Relief (self)', Math.min(r.cpfTopUpSelf, 8000))
  push('CPF Cash Top-up Relief (family)', Math.min(r.cpfTopUpFamily, 8000))
  push('SRS Relief', Math.min(r.srs, params.srsCap))
  push('Life Insurance Relief', Math.min(r.lifeInsurance, Math.max(0, 5000 - cpfEmployee)))
  push('FDWL Relief', r.maidLevy * 2)

  const subtotal = items.reduce((a, b) => a + b.value, 0)
  let cappedTotal = subtotal
  let capApplied = false
  if (subtotal > RELIEF_CAP) {
    cappedTotal = RELIEF_CAP
    capApplied = true
  }

  const donationDeduction = r.donations * 2.5

  return {
    items,
    cpfEmployee,
    cpfEmployer,
    subtotalBeforeCap: subtotal,
    cappedTotal,
    capApplied,
    donationDeduction,
    total: cappedTotal + donationDeduction,
  }
}

export function computeTax(chargeableIncome: number): TaxResult {
  const ci = Math.max(0, chargeableIncome)
  let runningTax = 0
  let marginalRate = 0
  let activeIndex = 0

  const breakdown: TaxBracketRow[] = TAX_BRACKETS.map((b, i) => {
    const cap = b.max === Infinity ? ci : b.max
    const incomeInBracket = ci > b.min ? Math.min(ci, cap) - b.min : 0
    const taxInBracket = incomeInBracket * b.rate
    runningTax += taxInBracket
    if (incomeInBracket > 0) {
      marginalRate = b.rate
      activeIndex = i
    }
    return {
      index: i,
      min: b.min,
      max: b.max,
      rate: b.rate,
      incomeInBracket,
      taxInBracket,
      runningTotal: runningTax,
      active: false,
    }
  })

  breakdown.forEach((row, i) => {
    row.active = i === activeIndex
  })

  return { tax: runningTax, breakdown, marginalRate, activeIndex }
}

export function calculateTax(params: TaxParams): TaxCalcResult {
  const grossEmployment =
    params.annualSalary +
    params.annualBonus +
    params.directorFee +
    params.commission +
    params.otherEmployment
  const grossOther = params.business + params.rental + params.investment + params.other
  const grossIncome = grossEmployment + grossOther
  const earnedIncome = grossEmployment + params.business

  const reliefResult = computeReliefs(params, earnedIncome)
  const chargeableIncome = Math.max(0, grossIncome - reliefResult.total)
  const taxResult = computeTax(chargeableIncome)
  const noReliefTax = computeTax(grossIncome).tax
  const effectiveRate = grossIncome > 0 ? taxResult.tax / grossIncome : 0
  const averageRate = chargeableIncome > 0 ? taxResult.tax / chargeableIncome : 0
  const savings = noReliefTax - taxResult.tax
  const incomeAfterTax = grossIncome - taxResult.tax - reliefResult.cpfEmployee

  return {
    grossEmployment,
    grossOther,
    grossIncome,
    earnedIncome,
    reliefResult,
    chargeableIncome,
    taxResult,
    effectiveRate,
    averageRate,
    savings,
    incomeAfterTax,
    monthlyTakeHome: incomeAfterTax / 12,
  }
}

export function generateInsights(
  calc: TaxCalcResult,
  reliefs: TaxReliefInputs,
  srsCap: number
): TaxInsight[] {
  const list: TaxInsight[] = []
  const { taxResult, chargeableIncome, effectiveRate, reliefResult } = calc
  const marginalRate = taxResult.marginalRate

  const activeBracket = TAX_BRACKETS[taxResult.activeIndex]
  const nextBracket = TAX_BRACKETS[taxResult.activeIndex + 1]
  if (nextBracket && activeBracket.max !== Infinity) {
    const dist = activeBracket.max - chargeableIncome
    if (dist > 0 && dist <= activeBracket.max * 0.08) {
      list.push({
        type: 'warning',
        text: `You're S$${Math.round(dist).toLocaleString()} away from the ${(nextBracket.rate * 100).toFixed(1)}% bracket. Extra reliefs could keep more income at ${(activeBracket.rate * 100).toFixed(1)}%.`,
      })
    }
  }

  const srsUsed = Math.min(reliefs.srs, srsCap)
  if (srsUsed < srsCap) {
    const remaining = srsCap - srsUsed
    const saving = Math.round(remaining * marginalRate)
    list.push({
      type: 'positive',
      text: `Maximising SRS could save S$${saving.toLocaleString()} (S$${remaining.toLocaleString()} headroom at your ${(marginalRate * 100).toFixed(1)}% marginal rate).`,
    })
  } else {
    list.push({
      type: 'positive',
      text: `SRS contribution has reached the S$${srsCap.toLocaleString()} annual cap. Well optimised.`,
    })
  }

  const topUpTotal = Math.min(reliefs.cpfTopUpSelf, 8000) + Math.min(reliefs.cpfTopUpFamily, 8000)
  if (topUpTotal >= 16000) {
    list.push({
      type: 'positive',
      text: `CPF cash top-up relief has reached the combined S$16,000 cap (self + family).`,
    })
  } else {
    list.push({
      type: 'warning',
      text: `S$${(16000 - topUpTotal).toLocaleString()} of CPF cash top-up relief headroom remains unused across self and family accounts.`,
    })
  }

  if (reliefs.donations === 0) {
    list.push({
      type: 'warning',
      text: `Approved IPC donations are deductible at 250% — every S$1 donated reduces chargeable income by S$2.50.`,
    })
  } else {
    list.push({
      type: 'positive',
      text: `Donations of S$${reliefs.donations.toLocaleString()} generated a S$${Math.round(reliefs.donations * 2.5).toLocaleString()} deduction at the 250% rate.`,
    })
  }

  if (reliefResult.capApplied) {
    list.push({
      type: 'warning',
      text: `Your itemised reliefs exceed the S$80,000 personal income tax relief cap — the excess is not reducing your chargeable income.`,
    })
  }

  list.push({
    type: 'positive',
    text: `Effective tax rate is ${(effectiveRate * 100).toFixed(2)}% of gross income — Singapore's progressive system keeps this well below headline rates.`,
  })

  if (marginalRate >= 0.2) {
    list.push({
      type: 'warning',
      text: `You're in the ${(marginalRate * 100).toFixed(1)}% marginal bracket. Reliefs like SRS and CPF top-ups are especially valuable — each S$1 saves ${(marginalRate * 100).toFixed(1)} cents in tax.`,
    })
  }

  if (reliefs.lifeInsurance > 0 && reliefResult.cpfEmployee >= 5000) {
    list.push({
      type: 'warning',
      text: `CPF contributions already exceed S$5,000, so Life Insurance Relief may not apply under current rules.`,
    })
  }

  if (reliefs.courseFees === 0) {
    list.push({
      type: 'warning',
      text: `If you paid for approved courses or certifications, Course Fees Relief (up to S$5,500) may be claimable.`,
    })
  }

  if (chargeableIncome <= 20000) {
    list.push({
      type: 'positive',
      text: `Chargeable income falls within the first S$20,000 tax-free tier — no tax is payable at this level.`,
    })
  }

  if (reliefs.qcr + reliefs.hcr > 0 && reliefs.wmcr === 0) {
    list.push({
      type: 'warning',
      text: `If you're a working mother, Working Mother's Child Relief could apply on top of your existing child relief.`,
    })
  }

  return list
}

export function computeOptimizationScore(reliefs: TaxReliefInputs, srsCap: number): number {
  const srsScore = Math.min(reliefs.srs, srsCap) / srsCap
  const topUpScore =
    (Math.min(reliefs.cpfTopUpSelf, 8000) + Math.min(reliefs.cpfTopUpFamily, 8000)) / 16000
  const donationScore = Math.min(reliefs.donations / 5000, 1)
  const courseScore = Math.min(reliefs.courseFees, 5500) / 5500
  return Math.round(((srsScore + topUpScore + donationScore + courseScore) / 4) * 100)
}
