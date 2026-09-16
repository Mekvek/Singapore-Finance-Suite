import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TaxReliefInputs, ParentDependant } from '../engines/taxEngine'

export interface TaxState {
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
  reliefs: TaxReliefInputs
  whatif: {
    salary: number
    srs: number
    cpftopup: number
    donation: number
  }
  set: (partial: Partial<Omit<TaxState, 'set' | 'setReliefs' | 'setParents'>>) => void
  setReliefs: (partial: Partial<TaxReliefInputs>) => void
  setParents: (parents: ParentDependant[]) => void
}

const DEFAULT_RELIEFS: TaxReliefInputs = {
  nsman: 0,
  nsmanWife: false,
  nsmanParent: false,
  spouse: false,
  spouseHandicapped: false,
  qcr: 0,
  hcr: 0,
  wmcr: 0,
  parents: [],
  courseFees: 0,
  cpfTopUpSelf: 0,
  cpfTopUpFamily: 0,
  srs: 0,
  lifeInsurance: 0,
  maidLevy: 0,
  donations: 0,
}

export const useTaxStore = create<TaxState>()(
  persist(
    (set) => ({
      directorFee: 0,
      commission: 0,
      otherEmployment: 0,
      business: 0,
      rental: 0,
      investment: 0,
      other: 0,
      cpfMode: 'auto',
      cpfEmployeeManual: 0,
      cpfEmployerManual: 0,
      reliefs: DEFAULT_RELIEFS,
      whatif: { salary: 0, srs: 0, cpftopup: 0, donation: 0 },
      set: (partial) => set(partial),
      setReliefs: (partial) => set((state) => ({ reliefs: { ...state.reliefs, ...partial } })),
      setParents: (parents) => set((state) => ({ reliefs: { ...state.reliefs, parents } })),
    }),
    { name: 'sgfinance-tax' }
  )
)
