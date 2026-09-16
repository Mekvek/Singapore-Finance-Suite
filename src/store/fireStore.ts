import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface FIREState {
  bondPrincipal: number
  bondRate: number
  stocksValue: number
  stocksDCA: number
  stocksReturn: number
  inflation: number
  swr: number
  includeCPF: boolean
  adjustInflation: boolean
  set: (partial: Partial<Omit<FIREState, 'set'>>) => void
}

export const useFIREStore = create<FIREState>()(
  persist(
    (set) => ({
      bondPrincipal: 20000,
      bondRate: 3.0,
      stocksValue: 80000,
      stocksDCA: 12000,
      stocksReturn: 7.5,
      inflation: 2.5,
      swr: 4,
      includeCPF: true,
      adjustInflation: true,
      set: (partial) => set(partial),
    }),
    { name: 'sgfinance-fire' }
  )
)
