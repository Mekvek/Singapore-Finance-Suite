interface MetricCardProps {
  label: string
  value: string
  subvalue?: string
  accent?: string
  className?: string
}

export default function MetricCard({ label, value, subvalue, accent, className }: MetricCardProps) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        padding: '14px 18px',
        boxShadow: 'var(--shadow-sm)',
        borderTop: accent ? `3px solid ${accent}` : undefined,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: accent ?? 'var(--color-text)',
          letterSpacing: -0.5,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {subvalue && (
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
          {subvalue}
        </div>
      )}
    </div>
  )
}
