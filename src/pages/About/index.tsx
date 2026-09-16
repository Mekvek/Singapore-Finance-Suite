import { useState, useEffect } from 'react'

export default function About() {
  const [version, setVersion] = useState('1.0.0')

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI
        .getVersion()
        .then(setVersion)
        .catch(() => {})
    }
  }, [])

  return (
    <div style={{ padding: '32px 36px', maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
        About
      </h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 28 }}>
        SG Finance Suite v{version}
      </p>

      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 20,
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: 'var(--color-text)' }}>
          What is this?
        </h2>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
          SG Finance Suite bundles three Singapore-focused financial planning tools into a single
          desktop application. All calculations run entirely on your device — no accounts, no cloud,
          no tracking.
        </p>
      </div>

      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 20,
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: 'var(--color-text)' }}>
          Tech Stack
        </h2>
        {[
          ['Frontend', 'React 18 · TypeScript · Vite · TailwindCSS · Zustand'],
          ['Charts', 'Chart.js 4 · react-chartjs-2'],
          ['Shell', 'Electron 31 · Node.js'],
          ['Build', 'electron-builder · Portable EXE'],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              display: 'flex',
              gap: 12,
              padding: '8px 0',
              borderBottom: '1px solid var(--color-border)',
              fontSize: 13,
            }}
          >
            <span
              style={{
                width: 90,
                flexShrink: 0,
                color: 'var(--color-text-muted)',
                fontWeight: 500,
              }}
            >
              {label}
            </span>
            <span style={{ color: 'var(--color-text-secondary)' }}>{value}</span>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: '12px 16px',
          borderRadius: 8,
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          fontSize: 11,
          color: 'var(--color-text-muted)',
          lineHeight: 1.6,
        }}
      >
        All calculations are estimates based on publicly available CPF and Singapore government
        rules as of 2024–2025. This is not financial advice. CPF rules, grant amounts, and tax rates
        change — always verify with official sources before making financial decisions.
      </div>
    </div>
  )
}
