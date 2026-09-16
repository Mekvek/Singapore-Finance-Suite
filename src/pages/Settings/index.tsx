import { useThemeStore, ThemeChoice } from '../../store/themeStore'

const THEMES: { value: ThemeChoice; label: string }[] = [
  { value: 'system', label: 'System (OS default)' },
  { value: 'arctic-calm', label: 'Arctic Calm' },
  { value: 'aurora-pulse', label: 'Aurora Pulse' },
  { value: 'retro-radar', label: 'Retro Radar' },
  { value: 'solar-flare', label: 'Solar Flare' },
  { value: 'tropical-breeze', label: 'Tropical Breeze' },
]

export default function Settings() {
  const { theme, setTheme } = useThemeStore()

  const clearAll = () => {
    if (!confirm('Clear all saved data from all calculators? This cannot be undone.')) return
    const keys = [
      'cpf_scenarios',
      'sgfire_inputs_v1',
      'propsmartpro_v1',
      'sgfinance-theme',
      'sgfinance-profile',
      'sgfinance-fire',
      'sgfinance-cpf',
      'sgfinance-property',
    ]
    keys.forEach((k) => localStorage.removeItem(k))
    alert('All saved data cleared.')
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)', marginBottom: 28 }}>
        Settings
      </h1>

      {/* Theme */}
      <section style={{ marginBottom: 32 }}>
        <h2
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 14,
          }}
        >
          Appearance
        </h2>
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 10,
            padding: '16px 20px',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 13,
              color: 'var(--color-text-secondary)',
            }}
          >
            <span style={{ fontWeight: 500, color: 'var(--color-text)', minWidth: 48 }}>Theme</span>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as ThemeChoice)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                color: 'var(--color-text)',
                fontSize: 13,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {THEMES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* Data management */}
      <section>
        <h2
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 14,
          }}
        >
          Data
        </h2>
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 10,
            padding: '16px 20px',
          }}
        >
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
            All calculator inputs and saved scenarios are stored locally in your browser&apos;s
            localStorage. No data is sent anywhere.
          </p>
          <button
            onClick={clearAll}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-red)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Clear All Saved Data
          </button>
        </div>
      </section>
    </div>
  )
}
