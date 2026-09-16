import { NavLink } from 'react-router-dom'
import { useThemeStore, resolveTheme, ThemeChoice } from '../store/themeStore'
import { useState, useEffect } from 'react'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', emoji: '⊞' },
  { to: '/cpf', label: 'CPF Projection', emoji: '📊' },
  { to: '/fire', label: 'FIRE Calculator', emoji: '🔥' },
  { to: '/property', label: 'Property', emoji: '🏠' },
  { to: '/tax', label: 'Income Tax', emoji: '🧾' },
  { to: '/insurance', label: 'Insurance Analysis', emoji: '🛡️' },
]

const BOTTOM_ITEMS = [
  { to: '/settings', label: 'Settings', emoji: '⚙' },
  { to: '/about', label: 'About', emoji: 'ℹ' },
]

const THEME_ORDER: ThemeChoice[] = [
  'system',
  'arctic-calm',
  'aurora-pulse',
  'retro-radar',
  'solar-flare',
  'tropical-breeze',
]

const THEME_ICONS: Record<ThemeChoice, string> = {
  system: '💻',
  'arctic-calm': '❄️',
  'aurora-pulse': '✨',
  'retro-radar': '📡',
  'solar-flare': '☀️',
  'tropical-breeze': '🌴',
}

const THEME_LABELS: Record<ThemeChoice, string> = {
  system: 'System',
  'arctic-calm': 'Arctic Calm',
  'aurora-pulse': 'Aurora Pulse',
  'retro-radar': 'Retro Radar',
  'solar-flare': 'Solar Flare',
  'tropical-breeze': 'Tropical Breeze',
}

export default function AppSidebar() {
  const { theme, setTheme } = useThemeStore()
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const h = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])

  const effectiveDark = resolveTheme(theme, systemDark) === 'dark'

  const cycleTheme = () => {
    const idx = THEME_ORDER.indexOf(theme)
    setTheme(THEME_ORDER[(idx + 1) % THEME_ORDER.length])
  }

  const themeIcon = THEME_ICONS[theme]
  const themeLabel = THEME_LABELS[theme]

  const sidebarStyle: React.CSSProperties = {
    width: 220,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--color-sidebar)',
    borderRight: '1px solid var(--color-border)',
    height: '100vh',
    overflowY: 'auto',
  }

  const linkBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '7px 12px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'background 0.15s, color 0.15s',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
  }

  return (
    <nav style={sidebarStyle}>
      {/* Logo */}
      <div
        style={{
          padding: '18px 16px 14px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text)' }}>
          SG Finance Suite
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
          Financial Planning Tools
        </div>
      </div>

      {/* Main nav */}
      <div
        style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              ...linkBase,
              background: isActive
                ? effectiveDark
                  ? 'rgba(249,115,22,0.18)'
                  : 'rgba(249,115,22,0.10)'
                : 'transparent',
              color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              fontWeight: isActive ? 600 : 500,
            })}
          >
            <span style={{ width: 20, textAlign: 'center', fontSize: 15 }}>{item.emoji}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Bottom nav */}
      <div
        style={{
          padding: '8px 8px 12px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {BOTTOM_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              ...linkBase,
              background: isActive
                ? effectiveDark
                  ? 'rgba(249,115,22,0.18)'
                  : 'rgba(249,115,22,0.10)'
                : 'transparent',
              color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            })}
          >
            <span style={{ width: 20, textAlign: 'center', fontSize: 15 }}>{item.emoji}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        {/* Theme cycle button */}
        <button
          onClick={cycleTheme}
          title={`Theme: ${themeLabel} (click to cycle)`}
          style={{
            ...linkBase,
            border: 'none',
            background: 'transparent',
            width: '100%',
            marginTop: 4,
          }}
        >
          <span style={{ width: 20, textAlign: 'center', fontSize: 15 }}>{themeIcon}</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {themeLabel}
          </span>
        </button>
      </div>
    </nav>
  )
}
