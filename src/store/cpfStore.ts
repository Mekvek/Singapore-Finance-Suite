import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CPFScenario {
  id: string
  name: string
  params: Record<string, unknown>
}

export interface CPFState {
  vcma: number
  togGrowth: boolean
  togInflation: boolean
  togExtra: boolean
  activeTab: string
  savedScenarios: CPFScenario[]
  set: (partial: Partial<Omit<CPFState, 'set' | 'saveScenario' | 'deleteScenario'>>) => void
  saveScenario: (name: string, params: Record<string, unknown>) => void
  deleteScenario: (id: string) => void
}

export const useCPFStore = create<CPFState>()(
  persist(
    (set) => ({
      vcma: 0,
      togGrowth: true,
      togInflation: true,
      togExtra: true,
      activeTab: 'balance',
      savedScenarios: [],
      set: (partial) => set(partial),
      saveScenario: (name, params) =>
        set((s) => ({
          savedScenarios: [...s.savedScenarios, { id: String(Date.now()), name, params }],
        })),
      deleteScenario: (id) =>
        set((s) => ({ savedScenarios: s.savedScenarios.filter((sc) => sc.id !== id) })),
    }),
    { name: 'sgfinance-cpf' }
  )
)
