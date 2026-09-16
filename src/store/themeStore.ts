import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeChoice =
  'system' | 'arctic-calm' | 'aurora-pulse' | 'retro-radar' | 'solar-flare' | 'tropical-breeze'

const DARK_NAMED: ReadonlySet<ThemeChoice> = new Set(['aurora-pulse', 'retro-radar', 'solar-flare'])

interface ThemeState {
  theme: ThemeChoice
  setTheme: (theme: ThemeChoice) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'sgfinance-theme' }
  )
)

/** Returns 'dark' for dark-base themes (including 3 dark named themes), 'light' otherwise. */
export function resolveTheme(choice: ThemeChoice, systemPrefersDark: boolean): 'light' | 'dark' {
  if (choice === 'system') return systemPrefersDark ? 'dark' : 'light'
  return DARK_NAMED.has(choice) ? 'dark' : 'light'
}
