import {
  getCpfRates,
  calcCpfInterest,
  CPF_WAGE_CEILING_MONTHLY,
  CPF_BHS_BASE,
  CPF_FRS_BASE,
  CPF_BHS_GROWTH,
  CPF_FRS_GROWTH,
} from '../utils/cpf'

export interface CPFParams {
  age: number
  retireAge: number
  salary: number
  salaryGrowth: number
  bonus: number
  vcma: number
  cpfOA: number
  cpfSA: number
  cpfMA: number
  togGrowth: boolean
  togInflation: boolean
  togExtra: boolean
}

export interface CPFYearRow {
  age: number
  year: number
  oa: number
  sa: number
  ma: number
  total: number
  annualContrib: number
  interestEarned: number
  cumContrib: number
  cumInterest: number
  milestone?: string
}

export interface CPFResult {
  rows: CPFYearRow[]
  milestones: { frsAge?: number; bhsAge?: number }
  totalContrib: number
  totalInterest: number
  retirementTotal: number
  balance55: number
}

const CURRENT_YEAR = 2025

export function projectCPF(p: CPFParams): CPFResult {
  let oa = Math.max(0, p.cpfOA)
  let sa = Math.max(0, p.cpfSA)
  let ma = Math.max(0, p.cpfMA)
  let salary = Math.max(0, p.salary)

  const rows: CPFYearRow[] = []
  let cumContrib = 0
  let cumInterest = 0
  const milestones: { frsAge?: number; bhsAge?: number } = {}

  for (let age = p.age; age < p.retireAge; age++) {
    const yearsElapsed = age - p.age

    // Apply salary growth (not for first year)
    if (p.togGrowth && yearsElapsed > 0) {
      salary *= 1 + p.salaryGrowth / 100
    }

    const cappedSalary = Math.min(salary, CPF_WAGE_CEILING_MONTHLY)
    const rates = getCpfRates(age)
    const totalRate = rates.emp + rates.er

    // Annual contributions (12 months salary + bonus months)
    const monthsContrib = 12 + p.bonus
    const annualAutoContrib = cappedSalary * totalRate * monthsContrib
    const annualVcma = p.vcma * 12

    // Allocate auto-contributions to accounts
    let oaAdd = annualAutoContrib * rates.oa
    let saAdd = annualAutoContrib * rates.sa
    let maAdd = annualAutoContrib * rates.ma + annualVcma

    // Current BHS and FRS (inflated if togInflation)
    const currentBhs = p.togInflation
      ? CPF_BHS_BASE * Math.pow(1 + CPF_BHS_GROWTH, yearsElapsed)
      : CPF_BHS_BASE
    const currentFrs = p.togInflation
      ? CPF_FRS_BASE * Math.pow(1 + CPF_FRS_GROWTH, yearsElapsed)
      : CPF_FRS_BASE

    // Enforce MA cap (BHS) — overflow to SA
    const maSpace = Math.max(0, currentBhs - ma)
    if (maAdd > maSpace) {
      saAdd += maAdd - maSpace
      maAdd = maSpace
    }

    // Enforce SA cap (FRS) — overflow to OA
    const saSpace = Math.max(0, currentFrs - sa)
    if (saAdd > saSpace) {
      oaAdd += saAdd - saSpace
      saAdd = saSpace
    }

    oa += oaAdd
    sa += saAdd
    ma += maAdd

    // Compute interest
    let interestResult: { oa: number; sa: number; ma: number }
    if (p.togExtra) {
      interestResult = calcCpfInterest(oa, sa, ma)
    } else {
      interestResult = { oa: oa * 0.025, sa: sa * 0.04, ma: ma * 0.04 }
    }
    const totalInterestYear = interestResult.oa + interestResult.sa + interestResult.ma

    oa += interestResult.oa
    sa += interestResult.sa
    ma += interestResult.ma

    // Enforce caps again after interest
    if (ma > currentBhs) {
      sa += ma - currentBhs
      ma = currentBhs
    }
    if (sa > currentFrs) {
      oa += sa - currentFrs
      sa = currentFrs
    }

    const annualContrib = annualAutoContrib + annualVcma
    cumContrib += annualContrib
    cumInterest += totalInterestYear

    // Milestone detection
    let milestone: string | undefined
    if (!milestones.frsAge && sa >= currentFrs) {
      milestones.frsAge = age
      milestone = 'FRS reached'
    }
    if (!milestones.bhsAge && ma >= currentBhs) {
      milestones.bhsAge = age
      milestone = milestone ? milestone + ', BHS reached' : 'BHS reached'
    }
    if (age === 55) milestone = milestone ? milestone + ', Age 55' : 'Age 55'

    rows.push({
      age,
      year: CURRENT_YEAR + yearsElapsed,
      oa,
      sa,
      ma,
      total: oa + sa + ma,
      annualContrib,
      interestEarned: totalInterestYear,
      cumContrib,
      cumInterest,
      milestone,
    })
  }

  const retirementRow = rows[rows.length - 1]
  const row55 = rows.find((r) => r.age === 55)
  const fallback55 =
    !row55 && p.retireAge < 56
      ? projectCPF({ ...p, retireAge: 56 }).rows.find((r) => r.age === 55)?.total
      : undefined

  return {
    rows,
    milestones,
    totalContrib: cumContrib,
    totalInterest: cumInterest,
    retirementTotal: retirementRow ? retirementRow.total : p.cpfOA + p.cpfSA + p.cpfMA,
    balance55: row55?.total ?? fallback55 ?? (p.age >= 55 ? p.cpfOA + p.cpfSA + p.cpfMA : 0),
  }
}
