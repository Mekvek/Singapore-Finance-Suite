import { HashRouter, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import Dashboard from '../pages/Dashboard'
import CPFProjection from '../pages/CPFProjection'
import FIRECalculator from '../pages/FIRECalculator'
import PropertyCalc from '../pages/PropertyCalc'
import Settings from '../pages/Settings'
import About from '../pages/About'
import IncomeTax from '../pages/IncomeTax'
import InsuranceAnalysis from '../pages/InsuranceAnalysis'
import { useThemeStore } from '../store/themeStore'

export default function App() {
  const { theme } = useThemeStore()
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  // Watch system preference changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Apply theme to <html>: named themes use data-theme attribute, system uses .dark class
  useEffect(() => {
    const el = document.documentElement
    if (theme === 'system') {
      el.removeAttribute('data-theme')
      el.classList.toggle('dark', systemDark)
    } else {
      el.classList.remove('dark')
      el.setAttribute('data-theme', theme)
    }
  }, [theme, systemDark])

  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="cpf" element={<CPFProjection />} />
          <Route path="fire" element={<FIRECalculator />} />
          <Route path="property" element={<PropertyCalc />} />
          <Route path="tax" element={<IncomeTax />} />
          <Route path="insurance" element={<InsuranceAnalysis />} />
          <Route path="settings" element={<Settings />} />
          <Route path="about" element={<About />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
