/** Monthly mortgage payment (PMT formula) */
export function monthlyPayment(
  principal: number,
  annualRatePct: number,
  tenureYears: number
): number {
  if (principal <= 0) return 0
  const r = annualRatePct / 100 / 12
  const n = tenureYears * 12
  if (r === 0) return principal / n
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

/** Total interest paid over the life of a loan */
export function totalInterest(
  principal: number,
  annualRatePct: number,
  tenureYears: number
): number {
  const mp = monthlyPayment(principal, annualRatePct, tenureYears)
  return mp * tenureYears * 12 - principal
}

export interface AmortRow {
  month: number
  year: number
  payment: number
  principal: number
  interest: number
  balance: number
}

/** Full monthly amortization schedule */
export function buildAmortization(
  principal: number,
  annualRatePct: number,
  tenureYears: number
): AmortRow[] {
  const r = annualRatePct / 100 / 12
  const n = tenureYears * 12
  const mp = monthlyPayment(principal, annualRatePct, tenureYears)
  let balance = principal
  const schedule: AmortRow[] = []
  for (let i = 1; i <= n; i++) {
    const interest = balance * r
    const princ = mp - interest
    balance -= princ
    if (balance < 0) balance = 0
    schedule.push({
      month: i,
      year: Math.ceil(i / 12),
      payment: mp,
      principal: princ,
      interest,
      balance,
    })
  }
  return schedule
}

export interface YearlyAmortRow {
  year: number
  payment: number
  principal: number
  interest: number
  balance: number
}

/** Aggregate monthly schedule into yearly rows */
export function buildYearlyAmort(schedule: AmortRow[]): YearlyAmortRow[] {
  const years: Record<number, YearlyAmortRow> = {}
  for (const m of schedule) {
    if (!years[m.year]) {
      years[m.year] = { year: m.year, payment: 0, principal: 0, interest: 0, balance: 0 }
    }
    years[m.year].payment += m.payment
    years[m.year].principal += m.principal
    years[m.year].interest += m.interest
    years[m.year].balance = m.balance
  }
  return Object.values(years)
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
