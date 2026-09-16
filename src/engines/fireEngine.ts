import {
  getCpfEmployeeRate,
  getCpfEmployerRate,
  getCpfOAAlloc,
  getCpfSAAlloc,
  calcCpfInterest,
  CPF_WAGE_CEILING_MONTHLY,
  CPF_FRS_BASE,
} from '../utils/cpf'

export interface FIREParams {
  age: number
  retireAge: number
  salary: number
  salaryGrowth: number
  expenses: number
  cpfOA: number
  cpfSA: number
  cpfMA: number
  cash: number
  investments: number
  bondPrincipal: number
  bondRate: number
  stocksValue: number
  stocksDCA: number
  stocksReturn: number
  inflation: number
  swr: number
  includeCPF: boolean
  adjustInflation: boolean
  ownedPropertyValue?: number
  ownedPropertyAppreciation?: number
  ownedPropertyRentalIncome?: number
}

export interface FIREYearRow {
  age: number
  year: number
  cash: number
  bonds: number
  stocks: number
  invest: number
  etf: number
  cpfOA: number
  cpfSA: number
  cpfMA: number
  cpfTotal: number
  cashInvest: number
  netWorth: number
  propertyValue: number
  annualSavings: number
  isRetired: boolean
}

export interface FIREResult {
  rows: FIREYearRow[]
  fireNumber: number
  currentNetWorth: number
  fireProgressPct: number
  fireAge: number | null
  retirementRow: FIREYearRow | null
  monthlyPassiveIncome: number
}

const CURRENT_YEAR = 2025

export function projectFIRE(p: FIREParams): FIREResult {
  let cash = Math.max(0, p.cash)
  let bonds = Math.max(0, p.bondPrincipal)
  let stocks = Math.max(0, p.stocksValue)
  let cpfOA = Math.max(0, p.cpfOA)
  let cpfSA = Math.max(0, p.cpfSA)
  let cpfMA = Math.max(0, p.cpfMA)
  let salary = Math.max(0, p.salary)

  // Inflation-adjusted annual expenses at retirement
  const yearsToRetire = Math.max(0, p.retireAge - p.age)
  const inflationFactor = p.adjustInflation ? Math.pow(1 + p.inflation / 100, yearsToRetire) : 1
  const retireAnnualExpenses = p.expenses * 12 * inflationFactor
  const fireNumber = retireAnnualExpenses / (p.swr / 100)

  const endAge = Math.max(p.retireAge + 30, 85)
  const rows: FIREYearRow[] = []
  let fireAge: number | null = null
  let cpfWithdrawn = false
  const currentPortfolio = bonds + stocks

  // Current net worth (before simulation starts)
  const currentCpf = cpfOA + cpfSA + cpfMA
  const initPropertyValue = Math.max(0, p.ownedPropertyValue ?? 0)
  const currentNetWorth =
    cash + currentPortfolio + (p.includeCPF ? currentCpf : 0) + initPropertyValue

  let propertyValue = initPropertyValue
  const propertyAppreciation = (p.ownedPropertyAppreciation ?? 0) / 100
  const annualRentalIncome = (p.ownedPropertyRentalIncome ?? 0) * 12

  for (let age = p.age; age <= endAge; age++) {
    const yearsElapsed = age - p.age
    const isRetired = age >= p.retireAge

    if (!isRetired) {
      // Apply salary growth (not for first year)
      if (yearsElapsed > 0) {
        salary *= 1 + p.salaryGrowth / 100
      }

      const cappedSalary = Math.min(salary, CPF_WAGE_CEILING_MONTHLY)
      const empRate = getCpfEmployeeRate(age)
      const erRate = getCpfEmployerRate(age)
      const oaAlloc = getCpfOAAlloc(age)
      const saAlloc = getCpfSAAlloc(age)
      const maAlloc = 1 - oaAlloc - saAlloc

      const annualCpfEmp = cappedSalary * empRate * 12
      const annualCpfEr = cappedSalary * erRate * 12
      const totalCpfContrib = annualCpfEmp + annualCpfEr

      cpfOA += totalCpfContrib * oaAlloc
      cpfSA += totalCpfContrib * saAlloc
      cpfMA += totalCpfContrib * Math.max(0, maAlloc)

      // CPF interest
      const cpfInt = calcCpfInterest(cpfOA, cpfSA, cpfMA)
      cpfOA += cpfInt.oa
      cpfSA += cpfInt.sa
      cpfMA += cpfInt.ma

      // Take-home and savings
      const takeHome = salary * 12 - annualCpfEmp
      const annualSavings = takeHome - p.expenses * 12
      const savingsClamped = Math.max(0, annualSavings)

      cash += savingsClamped * 0.3
      stocks += savingsClamped * 0.7

      // Rental income flows into cash savings
      cash += annualRentalIncome

      // Bonds keep principal fixed; annual interest is paid into cash savings.
      cash += bonds * (p.bondRate / 100)

      // Stocks grow on capital gains and continue receiving the annual DCA.
      stocks += p.stocksDCA
      cash -= p.stocksDCA
      if (cash < 0) cash = 0
      stocks *= 1 + p.stocksReturn / 100

      // Property appreciates each year
      propertyValue *= 1 + propertyAppreciation

      const cpfTotal = cpfOA + cpfSA + cpfMA
      const invest = bonds + stocks
      const cashInvest = cash + invest
      const netWorth = cashInvest + (p.includeCPF ? cpfTotal : 0) + propertyValue
      const rowSavings = annualSavings

      if (fireAge === null && netWorth >= fireNumber) {
        fireAge = age
      }

      rows.push({
        age,
        year: CURRENT_YEAR + yearsElapsed,
        cash,
        bonds,
        stocks,
        invest,
        etf: stocks,
        cpfOA,
        cpfSA,
        cpfMA,
        cpfTotal,
        cashInvest,
        netWorth,
        propertyValue,
        annualSavings: rowSavings,
        isRetired: false,
      })
    } else {
      // CPF withdrawal at age 55 (one-time)
      if (!cpfWithdrawn && age === 55) {
        cpfWithdrawn = true
        const excessCpf = Math.max(0, cpfOA + cpfSA - CPF_FRS_BASE)
        cash += excessCpf * 0.5
        stocks += excessCpf * 0.5
        if (cpfOA + cpfSA > CPF_FRS_BASE) {
          const reduction = Math.min(cpfOA, excessCpf)
          cpfOA -= reduction
          const remaining = excessCpf - reduction
          cpfSA -= remaining
        }
      }

      // CPF interest still accrues in retirement
      const cpfInt = calcCpfInterest(cpfOA, cpfSA, cpfMA)
      cpfOA += cpfInt.oa
      cpfSA += cpfInt.sa
      cpfMA += cpfInt.ma

      // Bonds continue paying interest into cash savings.
      cash += bonds * (p.bondRate / 100)

      // Rental income continues in retirement
      cash += annualRentalIncome

      // Property appreciates each year
      propertyValue *= 1 + propertyAppreciation

      // Annual expenses (inflation-adjusted from retire year)
      const yearsRetired = age - p.retireAge
      const currentExpenses = retireAnnualExpenses * Math.pow(1 + p.inflation / 100, yearsRetired)

      // Drawdown: cash first, then stocks, then bonds.
      let remaining = currentExpenses
      if (cash >= remaining) {
        cash -= remaining
        remaining = 0
      } else {
        remaining -= cash
        cash = 0
        if (stocks >= remaining) {
          stocks -= remaining
          remaining = 0
        } else {
          remaining -= stocks
          stocks = 0
          bonds -= remaining
          if (bonds < 0) bonds = 0
        }
      }

      // Stocks continue compounding in retirement.
      stocks *= 1 + p.stocksReturn / 100

      const cpfTotal = cpfOA + cpfSA + cpfMA
      const invest = Math.max(0, bonds + stocks)
      const cashInvest = Math.max(0, cash + invest)
      const netWorth = cashInvest + (p.includeCPF ? cpfTotal : 0) + propertyValue

      if (fireAge === null && netWorth >= fireNumber) {
        fireAge = age
      }

      rows.push({
        age,
        year: CURRENT_YEAR + yearsElapsed,
        cash: Math.max(0, cash),
        bonds,
        stocks,
        invest: Math.max(0, invest),
        etf: stocks,
        cpfOA,
        cpfSA,
        cpfMA,
        cpfTotal,
        cashInvest,
        netWorth,
        propertyValue,
        annualSavings: -currentExpenses,
        isRetired: true,
      })
    }
  }

  const retirementRow = rows.find((r) => r.age === p.retireAge) ?? null
  const retireNetWorth = retirementRow ? retirementRow.netWorth : 0
  const monthlyPassiveIncome = retireNetWorth > 0 ? (retireNetWorth * (p.swr / 100)) / 12 : 0

  return {
    rows,
    fireNumber,
    currentNetWorth,
    fireProgressPct: Math.min(100, (currentNetWorth / fireNumber) * 100),
    fireAge,
    retirementRow,
    monthlyPassiveIncome,
  }
}
