// Shared CPF constants and calculation utilities
// Single source of truth — used by both CPF Projection and FIRE Calculator pages

export const CPF_OA_RATE = 0.025
export const CPF_SA_RATE = 0.04
export const CPF_MA_RATE = 0.04
export const CPF_EXTRA_RATE = 0.01
export const CPF_EXTRA_COMBINED_CAP = 60000
export const CPF_EXTRA_OA_CAP = 20000
export const CPF_WAGE_CEILING_MONTHLY = 6800
export const CPF_WAGE_CEILING_ADDITIONAL = 102000
export const CPF_BHS_BASE = 71500
export const CPF_FRS_BASE = 205800
export const CPF_BHS_GROWTH = 0.05
export const CPF_FRS_GROWTH = 0.035

// Combined rate table (used by CPF Projection — more accurate allocation)
export interface CpfRateBand {
  min: number
  max: number
  emp: number // employee rate
  er: number // employer rate
  oa: number // OA allocation fraction of total
  sa: number // SA allocation fraction of total
  ma: number // MA allocation fraction of total
}

export const CPF_CONTRIB_RATES: CpfRateBand[] = [
  { min: 0, max: 35, emp: 0.2, er: 0.17, oa: 0.6217, sa: 0.1621, ma: 0.2162 },
  { min: 35, max: 45, emp: 0.2, er: 0.17, oa: 0.5677, sa: 0.1891, ma: 0.2432 },
  { min: 45, max: 50, emp: 0.2, er: 0.17, oa: 0.5136, sa: 0.2162, ma: 0.2703 },
  { min: 50, max: 55, emp: 0.2, er: 0.17, oa: 0.4595, sa: 0.2432, ma: 0.2973 },
  { min: 55, max: 60, emp: 0.13, er: 0.145, oa: 0.3085, sa: 0.3693, ma: 0.3222 },
  { min: 60, max: 65, emp: 0.075, er: 0.09, oa: 0.1346, sa: 0.4231, ma: 0.4423 },
  { min: 65, max: 70, emp: 0.05, er: 0.075, oa: 0.1, sa: 0.25, ma: 0.65 },
  { min: 70, max: 999, emp: 0.05, er: 0.05, oa: 0.08, sa: 0.22, ma: 0.7 },
]

/** Returns CPF rate band for a given age (combined table) */
export function getCpfRates(age: number): CpfRateBand {
  return (
    CPF_CONTRIB_RATES.find((r) => age >= r.min && age < r.max) ??
    CPF_CONTRIB_RATES[CPF_CONTRIB_RATES.length - 1]
  )
}

// Separate employee/employer rate lookups (used by FIRE Calculator)
interface RateBand {
  maxAge: number
  rate: number
}

const CPF_EMPLOYEE_RATES: RateBand[] = [
  { maxAge: 35, rate: 0.2 },
  { maxAge: 45, rate: 0.19 },
  { maxAge: 50, rate: 0.18 },
  { maxAge: 55, rate: 0.15 },
  { maxAge: 60, rate: 0.115 },
  { maxAge: 65, rate: 0.085 },
  { maxAge: Infinity, rate: 0.05 },
]

const CPF_EMPLOYER_RATES: RateBand[] = [
  { maxAge: 35, rate: 0.17 },
  { maxAge: 45, rate: 0.17 },
  { maxAge: 50, rate: 0.17 },
  { maxAge: 55, rate: 0.145 },
  { maxAge: 60, rate: 0.11 },
  { maxAge: 65, rate: 0.085 },
  { maxAge: Infinity, rate: 0.075 },
]

const CPF_OA_ALLOC: RateBand[] = [
  { maxAge: 35, rate: 0.6217 },
  { maxAge: 45, rate: 0.5677 },
  { maxAge: 50, rate: 0.5136 },
  { maxAge: 55, rate: 0.4055 },
  { maxAge: 60, rate: 0.3872 },
  { maxAge: 65, rate: 0.2727 },
  { maxAge: Infinity, rate: 0.0 },
]

const CPF_SA_ALLOC: RateBand[] = [
  { maxAge: 35, rate: 0.1621 },
  { maxAge: 45, rate: 0.1891 },
  { maxAge: 50, rate: 0.2162 },
  { maxAge: 55, rate: 0.3108 },
  { maxAge: 60, rate: 0.206 },
  { maxAge: 65, rate: 0.1364 },
  { maxAge: Infinity, rate: 0.0 },
]

function findRate(bands: RateBand[], age: number): number {
  for (const b of bands) {
    if (age <= b.maxAge) return b.rate
  }
  return bands[bands.length - 1].rate
}

export function getCpfEmployeeRate(age: number): number {
  return findRate(CPF_EMPLOYEE_RATES, age)
}

export function getCpfEmployerRate(age: number): number {
  return findRate(CPF_EMPLOYER_RATES, age)
}

export function getCpfOAAlloc(age: number): number {
  return findRate(CPF_OA_ALLOC, age)
}

export function getCpfSAAlloc(age: number): number {
  return findRate(CPF_SA_ALLOC, age)
}

/** Calculate annual CPF interest on OA/SA/MA balances including extra +1% */
export function calcCpfInterest(
  oa: number,
  sa: number,
  ma: number
): { oa: number; sa: number; ma: number } {
  const combined = oa + sa + ma
  const extraBase = Math.min(combined, CPF_EXTRA_COMBINED_CAP)
  const extraFromOA = Math.min(oa, CPF_EXTRA_OA_CAP)
  const extraFromSAMA = Math.min(extraBase - extraFromOA, sa + ma)

  const oaInterest = oa * CPF_OA_RATE + Math.min(extraFromOA, extraBase) * CPF_EXTRA_RATE
  const saMaExtra = Math.max(0, extraFromSAMA)
  const saInterest = sa * CPF_SA_RATE + (sa / (sa + ma || 1)) * saMaExtra * CPF_EXTRA_RATE
  const maInterest = ma * CPF_MA_RATE + (ma / (sa + ma || 1)) * saMaExtra * CPF_EXTRA_RATE

  return { oa: oaInterest, sa: saInterest, ma: maInterest }
}
