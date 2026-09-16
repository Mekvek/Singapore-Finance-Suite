export interface InsuranceInputs {
  age: number
  retireAge: number
  salary: number
  expenses: number
  dependants: number
  children: number
  housingType: 'hdb' | 'condo' | 'landed'
  mortgageBalance: number
  otherLoans: number
  cash: number
  investments: number
  lifeCoverage: number
  hospCoverage: number
  ciCoverage: number
  eciCoverage: number
  diMonthlyCoverage: number
  mortgageCoverage: number
}

export interface CoverageRow {
  id: 'life' | 'hosp' | 'ci' | 'eci' | 'di' | 'mortgage' | 'emergency'
  label: string
  need: number
  have: number
  gap: number
  pct: number
  priority: 'high' | 'medium' | 'low'
}

export interface InsuranceRecommendation {
  title: string
  detail: string
  priority: 'high' | 'medium' | 'low'
}

export interface InsuranceResult {
  lifeNeed: number
  lifeGap: number
  hospitalNeed: number
  hospitalGap: number
  ciNeed: number
  ciGap: number
  eciNeed: number
  eciGap: number
  diNeedMonthly: number
  diGapMonthly: number
  mortgageNeed: number
  mortgageGap: number
  emergencyNeed: number
  emergencyGap: number
  emergencyMonths: number
  incomeReplacementYears: number
  insuranceHealthScore: number
  riskScore: number
  riskBand: 'Low' | 'Moderate' | 'High'
  rows: CoverageRow[]
  recommendations: InsuranceRecommendation[]
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

function pct(have: number, need: number): number {
  if (need <= 0) return 100
  return clamp((have / need) * 100, 0, 999)
}

function priorityFromPct(v: number): 'high' | 'medium' | 'low' {
  if (v < 50) return 'high'
  if (v < 90) return 'medium'
  return 'low'
}

export function analyzeInsurance(input: InsuranceInputs): InsuranceResult {
  const annualIncome = Math.max(0, input.salary * 12)
  const monthlyExpenses = Math.max(0, input.expenses)
  const liquidAssets = Math.max(0, input.cash + input.investments)
  const yearsToRetirement = Math.max(1, input.retireAge - input.age)

  const dependantMultiplier =
    input.dependants > 0 ? 10 : input.children > 0 ? 8 : input.mortgageBalance > 0 ? 6 : 5

  const lifeNeed = Math.max(
    0,
    annualIncome * dependantMultiplier +
      input.mortgageBalance +
      input.otherLoans +
      input.children * 50000 -
      liquidAssets * 0.35
  )

  const hospitalNeed =
    annualIncome >= 120000 ? 1_500_000 : annualIncome >= 60000 ? 1_000_000 : 500_000
  const ciNeed = annualIncome * 4 + input.dependants * 25_000
  const eciNeed = annualIncome * 2
  const diNeedMonthly = Math.max(monthlyExpenses, input.salary * 0.75)
  const diNeedAnnual = diNeedMonthly * 12
  const mortgageNeed = Math.max(0, input.mortgageBalance)
  const emergencyNeed = monthlyExpenses * 6

  const lifeGap = Math.max(0, lifeNeed - input.lifeCoverage)
  const hospitalGap = Math.max(0, hospitalNeed - input.hospCoverage)
  const ciGap = Math.max(0, ciNeed - input.ciCoverage)
  const eciGap = Math.max(0, eciNeed - input.eciCoverage)
  const diGapMonthly = Math.max(0, diNeedMonthly - input.diMonthlyCoverage)
  const diGap = diGapMonthly * 12
  const mortgageGap = Math.max(0, mortgageNeed - input.mortgageCoverage)
  const emergencyGap = Math.max(0, emergencyNeed - input.cash)

  const rows: CoverageRow[] = [
    {
      id: 'life',
      label: 'Life Insurance',
      need: lifeNeed,
      have: input.lifeCoverage,
      gap: lifeGap,
      pct: pct(input.lifeCoverage, lifeNeed),
      priority: priorityFromPct(pct(input.lifeCoverage, lifeNeed)),
    },
    {
      id: 'hosp',
      label: 'Hospitalisation',
      need: hospitalNeed,
      have: input.hospCoverage,
      gap: hospitalGap,
      pct: pct(input.hospCoverage, hospitalNeed),
      priority: priorityFromPct(pct(input.hospCoverage, hospitalNeed)),
    },
    {
      id: 'ci',
      label: 'Critical Illness',
      need: ciNeed,
      have: input.ciCoverage,
      gap: ciGap,
      pct: pct(input.ciCoverage, ciNeed),
      priority: priorityFromPct(pct(input.ciCoverage, ciNeed)),
    },
    {
      id: 'eci',
      label: 'Early Critical Illness',
      need: eciNeed,
      have: input.eciCoverage,
      gap: eciGap,
      pct: pct(input.eciCoverage, eciNeed),
      priority: priorityFromPct(pct(input.eciCoverage, eciNeed)),
    },
    {
      id: 'di',
      label: 'Disability Income',
      need: diNeedAnnual,
      have: input.diMonthlyCoverage * 12,
      gap: diGap,
      pct: pct(input.diMonthlyCoverage * 12, diNeedAnnual),
      priority: priorityFromPct(pct(input.diMonthlyCoverage * 12, diNeedAnnual)),
    },
    {
      id: 'mortgage',
      label: 'Mortgage Protection',
      need: mortgageNeed,
      have: input.mortgageCoverage,
      gap: mortgageGap,
      pct: pct(input.mortgageCoverage, mortgageNeed),
      priority: priorityFromPct(pct(input.mortgageCoverage, mortgageNeed)),
    },
    {
      id: 'emergency',
      label: 'Emergency Fund',
      need: emergencyNeed,
      have: input.cash,
      gap: emergencyGap,
      pct: pct(input.cash, emergencyNeed),
      priority: priorityFromPct(pct(input.cash, emergencyNeed)),
    },
  ]

  const weightedScore =
    rows.find((r) => r.id === 'life')!.pct * 0.24 +
    rows.find((r) => r.id === 'hosp')!.pct * 0.16 +
    rows.find((r) => r.id === 'ci')!.pct * 0.15 +
    rows.find((r) => r.id === 'eci')!.pct * 0.08 +
    rows.find((r) => r.id === 'di')!.pct * 0.18 +
    rows.find((r) => r.id === 'mortgage')!.pct * 0.1 +
    rows.find((r) => r.id === 'emergency')!.pct * 0.09

  const debtRatio = annualIncome > 0 ? (input.mortgageBalance + input.otherLoans) / annualIncome : 0
  const retirementBufferPenalty = yearsToRetirement <= 10 ? 8 : yearsToRetirement <= 20 ? 4 : 0
  const debtPenalty = debtRatio > 6 ? 12 : debtRatio > 4 ? 8 : debtRatio > 2 ? 4 : 0

  const insuranceHealthScore = Math.round(
    clamp(weightedScore - debtPenalty - retirementBufferPenalty, 0, 100)
  )
  const riskScore = Math.round(clamp(100 - insuranceHealthScore, 0, 100))
  const riskBand: 'Low' | 'Moderate' | 'High' =
    riskScore >= 67 ? 'High' : riskScore >= 34 ? 'Moderate' : 'Low'

  const sortedGaps = [...rows]
    .filter((r) => r.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 5)

  const recommendations: InsuranceRecommendation[] = sortedGaps.map((row) => {
    if (row.id === 'life') {
      return {
        title: 'Increase life cover for dependant protection',
        detail:
          'Target at least 8-10x annual income when you have dependants, plus liabilities such as mortgage and loans.',
        priority: row.priority,
      }
    }
    if (row.id === 'hosp') {
      return {
        title: 'Review Integrated Shield and rider limits',
        detail:
          'Ensure your hospitalisation cover aligns with your intended ward class and expected annual claim limits.',
        priority: row.priority,
      }
    }
    if (row.id === 'ci') {
      return {
        title: 'Strengthen critical illness protection',
        detail:
          'A common benchmark is around 4x annual income to support treatment costs and multi-year recovery.',
        priority: row.priority,
      }
    }
    if (row.id === 'eci') {
      return {
        title: 'Add early CI layer',
        detail:
          'Early-stage CI benefits can reduce financial stress before a condition progresses to late-stage definitions.',
        priority: row.priority,
      }
    }
    if (row.id === 'di') {
      return {
        title: 'Improve disability income replacement',
        detail: 'Target monthly benefit near 75% of salary or at least your essential expenses.',
        priority: row.priority,
      }
    }
    if (row.id === 'mortgage') {
      return {
        title: 'Close mortgage protection gap',
        detail:
          'Mortgage protection should generally cover outstanding home loan principal to reduce family housing risk.',
        priority: row.priority,
      }
    }
    return {
      title: 'Build emergency reserve',
      detail:
        'Build liquid cash reserves toward 6 months of expenses before adding discretionary coverage upgrades.',
      priority: row.priority,
    }
  })

  if (recommendations.length === 0) {
    recommendations.push({
      title: 'Maintain and review annually',
      detail:
        'Coverage appears broadly aligned with current benchmarks. Recheck annually or after major life events.',
      priority: 'low',
    })
  }

  const incomeReplacementYears = annualIncome > 0 ? input.lifeCoverage / annualIncome : 0

  return {
    lifeNeed,
    lifeGap,
    hospitalNeed,
    hospitalGap,
    ciNeed,
    ciGap,
    eciNeed,
    eciGap,
    diNeedMonthly,
    diGapMonthly,
    mortgageNeed,
    mortgageGap,
    emergencyNeed,
    emergencyGap,
    emergencyMonths: monthlyExpenses > 0 ? input.cash / monthlyExpenses : 0,
    incomeReplacementYears,
    insuranceHealthScore,
    riskScore,
    riskBand,
    rows,
    recommendations,
  }
}
