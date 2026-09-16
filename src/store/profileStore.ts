import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ProfileState {
  age: number
  gender: 'male' | 'female'
  retireAge: number
  salary: number
  salaryGrowth: number
  bonus: number
  expenses: number
  cpfOA: number
  cpfSA: number
  cpfMA: number
  cash: number
  investments: number
  citizenship: string
  marital: string
  firstTimer: string
  dependants: number
  children: number
  housingType: 'hdb' | 'condo' | 'landed'
  mortgageBalance: number
  otherLoans: number
  lifeCoverage: number
  hospCoverage: number
  ciCoverage: number
  eciCoverage: number
  diMonthlyCoverage: number
  mortgageCoverage: number
  set: (partial: Partial<Omit<ProfileState, 'set'>>) => void
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      age: 30,
      gender: 'male',
      retireAge: 55,
      salary: 8000,
      salaryGrowth: 3,
      bonus: 1,
      expenses: 3500,
      cpfOA: 60000,
      cpfSA: 40000,
      cpfMA: 25000,
      cash: 50000,
      investments: 100000,
      citizenship: 'SC',
      marital: 'married',
      firstTimer: 'yes',
      dependants: 2,
      children: 1,
      housingType: 'hdb',
      mortgageBalance: 250000,
      otherLoans: 20000,
      lifeCoverage: 300000,
      hospCoverage: 500000,
      ciCoverage: 100000,
      eciCoverage: 0,
      diMonthlyCoverage: 0,
      mortgageCoverage: 0,
      set: (partial) => set(partial),
    }),
    { name: 'sgfinance-profile' }
  )
)
