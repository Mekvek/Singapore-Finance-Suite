import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PropertyState {
  activeTab: string

  // BTO
  btoFlatType: string
  btoEstate: string
  btoPrice: number
  btoTenure: number
  btoRate: number
  btoPHG: string

  // Resale
  rsPrice: number
  rsVal: number
  rsLease: number
  rsFlatType: string
  rsTenure: number
  rsRate: number
  rsPHG: string

  // Private
  pvType: string
  pvPrice: number
  pvTenure: number
  pvRate: number
  pvExisting: number
  rvbRent: number
  rvbAppreciation: number
  rvbYears: number

  // Compare
  cmpBtoPrice: number
  cmpBtoTenure: number
  cmpBtoRate: number
  cmpRsPrice: number
  cmpRsTenure: number
  cmpRsRate: number
  cmpPvPrice: number
  cmpPvTenure: number
  cmpPvRate: number

  // Dashboard/Upgrade
  upPrice: number
  upLoan: number
  upCpfUsed: number
  upCpfYrs: number
  upSalePrice: number

  // Current property ownership
  ownsProperty: boolean
  ownedPropertyValue: number
  ownedPropertyAppreciation: number
  ownedPropertyRentalIncome: number

  // Settings overrides
  setHdbRate: number
  setMsr: number
  setTdsr: number
  setLtv: number
  setHdbLtv: number

  set: (partial: Partial<Omit<PropertyState, 'set'>>) => void
}

export const usePropertyStore = create<PropertyState>()(
  persist(
    (set) => ({
      activeTab: 'bto',

      btoFlatType: '4room',
      btoEstate: 'mature',
      btoPrice: 450000,
      btoTenure: 25,
      btoRate: 2.6,
      btoPHG: 'yes',

      rsPrice: 550000,
      rsVal: 520000,
      rsLease: 72,
      rsFlatType: '4room',
      rsTenure: 25,
      rsRate: 2.6,
      rsPHG: 'yes',

      pvType: 'resale_condo',
      pvPrice: 1200000,
      pvTenure: 30,
      pvRate: 3.5,
      pvExisting: 0,
      rvbRent: 4500,
      rvbAppreciation: 3,
      rvbYears: 10,

      cmpBtoPrice: 450000,
      cmpBtoTenure: 25,
      cmpBtoRate: 2.6,
      cmpRsPrice: 550000,
      cmpRsTenure: 25,
      cmpRsRate: 2.6,
      cmpPvPrice: 1200000,
      cmpPvTenure: 30,
      cmpPvRate: 3.5,

      upPrice: 450000,
      upLoan: 300000,
      upCpfUsed: 80000,
      upCpfYrs: 5,
      upSalePrice: 600000,

      ownsProperty: false,
      ownedPropertyValue: 500000,
      ownedPropertyAppreciation: 3,
      ownedPropertyRentalIncome: 0,

      setHdbRate: 2.6,
      setMsr: 30,
      setTdsr: 55,
      setLtv: 75,
      setHdbLtv: 80,

      set: (partial) => set(partial),
    }),
    { name: 'sgfinance-property' }
  )
)
