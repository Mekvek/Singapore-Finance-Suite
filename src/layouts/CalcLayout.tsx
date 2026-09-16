import type { ReactNode } from 'react'

interface CalcLayoutProps {
  inputPanel: ReactNode
  children: ReactNode
}

export default function CalcLayout({ inputPanel, children }: CalcLayoutProps) {
  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Input panel */}
      <div
        style={{
          width: 300,
          flexShrink: 0,
          borderRight: '1px solid var(--color-border)',
          overflowY: 'auto',
          background: 'var(--color-sidebar)',
        }}
      >
        {inputPanel}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--color-bg)' }}>{children}</div>
    </div>
  )
}
