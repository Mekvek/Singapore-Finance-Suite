import { useMemo, useState } from 'react'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import CalcLayout from '../../layouts/CalcLayout'
import ProfilePanel from '../../components/ProfilePanel'
import MetricCard from '../../components/MetricCard'
import { useProfileStore } from '../../store/profileStore'
import { useTaxStore } from '../../store/taxStore'
import {
  calculateTax,
  computeTax,
  computeCpfForTax,
  computeWMCR,
  computeParentRelief,
  generateInsights,
  computeOptimizationScore,
  type TaxCalcResult,
} from '../../engines/taxEngine'
import { fmtSGD, fmtSGDCompact, fmtPct } from '../../utils/format'
import { useNumberInputState } from '../../hooks/useNumberInputState'

const TABS = ['Overview', 'Brackets', 'Rates', 'Insights'] as const
type Tab = (typeof TABS)[number]

// ── Helpers ──────────────────────────────────────────────────────────────────

function sectionStyle(open: boolean): React.CSSProperties {
  return { borderBottom: '1px solid var(--color-border)', ...(open ? {} : {}) }
}

function PanelSection({
  title,
  open,
  onToggle,
  children,
  badge,
}: {
  title: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
  badge?: string
}) {
  return (
    <div style={sectionStyle(open)}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 14px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {title}
          {badge && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 10,
                background: 'rgba(249,115,22,0.15)',
                color: 'var(--color-accent)',
              }}
            >
              {badge}
            </span>
          )}
        </span>
        <span style={{ fontSize: 12 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div style={{ padding: '0 14px 12px' }}>{children}</div>}
    </div>
  )
}

function NF({
  label,
  value,
  onChange,
  step = 100,
  hint,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
  hint?: string
}) {
  const { text, handleChange, handleBlur } = useNumberInputState(value, (n) =>
    onChange(Math.max(0, n))
  )
  return (
    <div style={{ marginBottom: 10 }}>
      <label
        style={{
          display: 'block',
          fontSize: 12,
          color: 'var(--color-text-secondary)',
          marginBottom: 3,
          fontWeight: 500,
        }}
      >
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>S$</span>
        <input
          type="number"
          min={0}
          step={step}
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          style={{
            flex: 1,
            padding: '5px 8px',
            borderRadius: 6,
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
            fontSize: 13,
          }}
        />
      </div>
      {hint && (
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{hint}</div>
      )}
    </div>
  )
}

function Stepper({
  value,
  onChange,
  max = 10,
}: {
  value: number
  onChange: (v: number) => void
  max?: number
}) {
  const btnStyle: React.CSSProperties = {
    width: 24,
    height: 24,
    borderRadius: 6,
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    fontSize: 14,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
      <button onClick={() => onChange(Math.max(0, value - 1))} style={btnStyle}>
        −
      </button>
      <span
        style={{
          minWidth: 20,
          textAlign: 'center',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--color-text)',
        }}
      >
        {value}
      </span>
      <button onClick={() => onChange(Math.min(max, value + 1))} style={btnStyle}>
        +
      </button>
    </div>
  )
}

function ReliefRow({
  title,
  enabled,
  amount,
  onToggle,
  children,
}: {
  title: string
  enabled: boolean
  amount: number
  onToggle: (v: boolean) => void
  children?: React.ReactNode
}) {
  return (
    <div
      style={{
        padding: '8px 0',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          style={{ width: 14, height: 14, cursor: 'pointer', flexShrink: 0 }}
        />
        <span
          style={{
            flex: 1,
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--color-text)',
            cursor: 'pointer',
          }}
          onClick={() => onToggle(!enabled)}
        >
          {title}
        </span>
        {amount > 0 && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--color-accent)',
              whiteSpace: 'nowrap',
            }}
          >
            −{fmtSGD(amount)}
          </span>
        )}
      </div>
      {enabled && children && <div style={{ paddingLeft: 22, paddingTop: 4 }}>{children}</div>}
    </div>
  )
}

function AmountField({
  value,
  onChange,
  cap,
  hint,
}: {
  value: number
  onChange: (v: number) => void
  cap?: number
  hint?: string
}) {
  const { text, handleChange, handleBlur } = useNumberInputState(value, (n) =>
    onChange(Math.max(0, n))
  )
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>S$</span>
        <input
          type="number"
          min={0}
          max={cap ? cap * 2 : undefined}
          step={100}
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          style={{
            width: 130,
            padding: '4px 8px',
            borderRadius: 6,
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
            fontSize: 12,
          }}
        />
        {cap != null && (
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
            cap S${cap.toLocaleString()}
          </span>
        )}
      </div>
      {hint && (
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{hint}</div>
      )}
    </div>
  )
}

// ── Export CSV ────────────────────────────────────────────────────────────────

function exportCSV(calc: TaxCalcResult) {
  const rows: (string | number)[][] = [
    ['Item', 'Amount (SGD)'],
    ['Gross Income', Math.round(calc.grossIncome)],
    ['Total Reliefs', Math.round(calc.reliefResult.total)],
    ['Chargeable Income', Math.round(calc.chargeableIncome)],
    ['Tax Payable', Math.round(calc.taxResult.tax)],
    ['Effective Tax Rate (%)', (calc.effectiveRate * 100).toFixed(2)],
    ['Marginal Tax Rate (%)', (calc.taxResult.marginalRate * 100).toFixed(2)],
    ['Average Tax Rate (%)', (calc.averageRate * 100).toFixed(2)],
    ['Income After Tax', Math.round(calc.incomeAfterTax)],
    ['Monthly Take-Home', Math.round(calc.monthlyTakeHome)],
    [],
    ['Relief', 'Amount'],
    ...calc.reliefResult.items.map((i) => [i.label, Math.round(i.value)]),
    [],
    ['Bracket', 'Rate (%)', 'Income Taxed', 'Tax Charged'],
    ...calc.taxResult.breakdown
      .filter((b) => b.incomeInBracket > 0)
      .map((b) => [
        `${b.min.toLocaleString()}–${b.max === Infinity ? '+' : b.max.toLocaleString()}`,
        (b.rate * 100).toFixed(1),
        Math.round(b.incomeInBracket),
        Math.round(b.taxInBracket),
      ]),
  ]
  const csv = rows.map((r) => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'sg-income-tax-estimate.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// ── Chart colours (hardcoded for Chart.js compatibility) ─────────────────────

const BRACKET_COLORS = [
  '#cbd5e1',
  '#a7d8cf',
  '#7fc6bb',
  '#57b4a6',
  '#2fa292',
  '#0f766e',
  '#0c645d',
  '#0891b2',
  '#0b7e9c',
  '#106b87',
  '#b9832e',
  '#9c6a22',
  '#7a5119',
]

// ── Main Component ────────────────────────────────────────────────────────────

export default function IncomeTax() {
  const p = useProfileStore()
  const t = useTaxStore()

  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const [openIncome, setOpenIncome] = useState(true)
  const [openCPF, setOpenCPF] = useState(false)
  const [openReliefs, setOpenReliefs] = useState(true)
  const [openWhatif, setOpenWhatif] = useState(false)

  const srsCap = p.citizenship === 'FG' ? 35700 : 15300

  const annualSalary = p.salary * 12
  const annualBonus = p.salary * p.bonus

  const baseParams = useMemo(
    () => ({
      annualSalary,
      annualBonus,
      age: p.age,
      directorFee: t.directorFee,
      commission: t.commission,
      otherEmployment: t.otherEmployment,
      business: t.business,
      rental: t.rental,
      investment: t.investment,
      other: t.other,
      cpfMode: t.cpfMode,
      cpfEmployeeManual: t.cpfEmployeeManual,
      cpfEmployerManual: t.cpfEmployerManual,
      srsCap,
      reliefs: t.reliefs,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [p, t, srsCap]
  )

  const calc = useMemo(() => calculateTax(baseParams), [baseParams])

  const anyWhatif = Object.values(t.whatif).some((v) => v > 0)
  const whatifCalc = useMemo(() => {
    if (!anyWhatif) return null
    return calculateTax({
      ...baseParams,
      annualSalary: annualSalary + t.whatif.salary,
      reliefs: {
        ...t.reliefs,
        srs: Math.min(srsCap, t.reliefs.srs + t.whatif.srs),
        cpfTopUpSelf: Math.min(8000, t.reliefs.cpfTopUpSelf + t.whatif.cpftopup),
        donations: t.reliefs.donations + t.whatif.donation,
      },
    })
  }, [baseParams, anyWhatif, t.whatif, t.reliefs, annualSalary, srsCap])

  const insights = useMemo(
    () => generateInsights(calc, t.reliefs, srsCap),
    [calc, t.reliefs, srsCap]
  )

  const score = useMemo(() => computeOptimizationScore(t.reliefs, srsCap), [t.reliefs, srsCap])

  const estimatedCPF = useMemo(
    () =>
      t.cpfMode === 'auto'
        ? computeCpfForTax(annualSalary, annualBonus, p.age)
        : { employee: t.cpfEmployeeManual, employer: t.cpfEmployerManual },
    [annualSalary, annualBonus, p.age, t.cpfMode, t.cpfEmployeeManual, t.cpfEmployerManual]
  )

  // ── Progression data (line chart) ─────────────────────────────────────────
  const progressionData = useMemo(() => {
    const maxIncome = Math.max(calc.chargeableIncome * 1.5, 200000)
    const steps = 40
    const labels: string[] = []
    const data: number[] = []
    for (let i = 0; i <= steps; i++) {
      const ci = (maxIncome / steps) * i
      labels.push(ci >= 1000 ? `$${(ci / 1000).toFixed(0)}K` : '$0')
      data.push(computeTax(ci).tax)
    }
    return { labels, data, maxIncome }
  }, [calc.chargeableIncome])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { usePointStyle: true, pointStyleWidth: 8, font: { size: 11 } },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        ticks: {
          callback: (v: number | string) => {
            const n = Number(v)
            if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
            if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
            return `$${n}`
          },
        },
      },
    },
  }

  // ── Input Panel ────────────────────────────────────────────────────────────

  const activeReliefCount = [
    t.reliefs.nsman > 0,
    t.reliefs.nsmanWife,
    t.reliefs.nsmanParent,
    t.reliefs.spouse || t.reliefs.spouseHandicapped,
    t.reliefs.qcr > 0,
    t.reliefs.hcr > 0,
    t.reliefs.wmcr > 0,
    t.reliefs.parents.length > 0,
    t.reliefs.courseFees > 0,
    t.reliefs.cpfTopUpSelf > 0,
    t.reliefs.cpfTopUpFamily > 0,
    t.reliefs.srs > 0,
    t.reliefs.lifeInsurance > 0,
    t.reliefs.maidLevy > 0,
    t.reliefs.donations > 0,
  ].filter(Boolean).length

  const inputPanel = (
    <div>
      {/* Header */}
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
          Income Tax Estimator
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
          YA 2025 · Singapore tax residents
        </div>
      </div>

      {/* Shared profile — salary / bonus / age auto-synced */}
      <ProfilePanel showAssets={false} collapsedSections={['cpf']} />

      {/* Additional Income */}
      <PanelSection
        title="Additional Income"
        open={openIncome}
        onToggle={() => setOpenIncome((v) => !v)}
      >
        <NF
          label="Director fees (annual S$)"
          value={t.directorFee}
          onChange={(v) => t.set({ directorFee: v })}
          hint="No CPF applies to director fees"
        />
        <NF
          label="Commission (annual S$)"
          value={t.commission}
          onChange={(v) => t.set({ commission: v })}
        />
        <NF
          label="Other employment income (S$)"
          value={t.otherEmployment}
          onChange={(v) => t.set({ otherEmployment: v })}
        />
        <NF
          label="Self-employed / business income (S$)"
          value={t.business}
          onChange={(v) => t.set({ business: v })}
          hint="Net trade income after allowable expenses"
        />
        <NF
          label="Rental income — net (S$)"
          value={t.rental}
          onChange={(v) => t.set({ rental: v })}
        />
        <NF
          label="Taxable investment income (S$)"
          value={t.investment}
          onChange={(v) => t.set({ investment: v })}
        />
        <NF
          label="Other taxable income (S$)"
          value={t.other}
          onChange={(v) => t.set({ other: v })}
        />
      </PanelSection>

      {/* CPF Contributions */}
      <PanelSection title="CPF Contributions" open={openCPF} onToggle={() => setOpenCPF((v) => !v)}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {(['auto', 'manual'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => t.set({ cpfMode: mode })}
              style={{
                flex: 1,
                padding: '5px 8px',
                borderRadius: 6,
                border: `1px solid ${t.cpfMode === mode ? 'var(--color-accent)' : 'var(--color-border)'}`,
                background: t.cpfMode === mode ? 'rgba(249,115,22,0.10)' : 'transparent',
                color: t.cpfMode === mode ? 'var(--color-accent)' : 'var(--color-text-muted)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {mode}
            </button>
          ))}
        </div>

        {t.cpfMode === 'auto' ? (
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 12,
              color: 'var(--color-text-secondary)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Employee CPF (relief)</span>
              <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                S${fmtSGD(estimatedCPF.employee)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Employer CPF</span>
              <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                S${fmtSGD(estimatedCPF.employer)}
              </span>
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--color-text-muted)',
                marginTop: 6,
                lineHeight: 1.4,
              }}
            >
              Estimated from salary + bonus, age band and CPF ceilings. Refer to CPF Board for exact
              figures.
            </div>
          </div>
        ) : (
          <>
            <NF
              label="Employee CPF contribution (S$)"
              value={t.cpfEmployeeManual}
              onChange={(v) => t.set({ cpfEmployeeManual: v })}
            />
            <NF
              label="Employer CPF contribution (S$)"
              value={t.cpfEmployerManual}
              onChange={(v) => t.set({ cpfEmployerManual: v })}
            />
          </>
        )}
      </PanelSection>

      {/* Tax Reliefs */}
      <PanelSection
        title="Tax Reliefs"
        open={openReliefs}
        onToggle={() => setOpenReliefs((v) => !v)}
        badge={activeReliefCount > 0 ? String(activeReliefCount) : undefined}
      >
        {/* NSman */}
        <ReliefRow
          title="NSman Relief"
          enabled={t.reliefs.nsman > 0}
          amount={t.reliefs.nsman}
          onToggle={(v) => t.setReliefs({ nsman: v ? 1500 : 0 })}
        >
          <div style={{ marginTop: 4 }}>
            <select
              value={t.reliefs.nsman}
              onChange={(e) => t.setReliefs({ nsman: Number(e.target.value) })}
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                color: 'var(--color-text)',
                fontSize: 12,
              }}
            >
              <option value={0}>Not applicable</option>
              <option value={1500}>General NSman (S$1,500)</option>
              <option value={3000}>Key appointment holder (S$3,000)</option>
            </select>
          </div>
        </ReliefRow>

        <ReliefRow
          title="NSman (Wife) Relief — S$750"
          enabled={t.reliefs.nsmanWife}
          amount={t.reliefs.nsmanWife ? 750 : 0}
          onToggle={(v) => t.setReliefs({ nsmanWife: v })}
        />

        <ReliefRow
          title="NSman (Parent) Relief — S$750"
          enabled={t.reliefs.nsmanParent}
          amount={t.reliefs.nsmanParent ? 750 : 0}
          onToggle={(v) => t.setReliefs({ nsmanParent: v })}
        />

        <ReliefRow
          title="Spouse Relief — S$2,000"
          enabled={t.reliefs.spouse && !t.reliefs.spouseHandicapped}
          amount={t.reliefs.spouse && !t.reliefs.spouseHandicapped ? 2000 : 0}
          onToggle={(v) => t.setReliefs({ spouse: v, spouseHandicapped: false })}
        />

        <ReliefRow
          title="Handicapped Spouse Relief — S$5,500"
          enabled={t.reliefs.spouseHandicapped}
          amount={t.reliefs.spouseHandicapped ? 5500 : 0}
          onToggle={(v) => t.setReliefs({ spouseHandicapped: v, spouse: false })}
        />

        {/* QCR */}
        <ReliefRow
          title="Qualifying Child Relief (S$4,000 each)"
          enabled={t.reliefs.qcr > 0}
          amount={t.reliefs.qcr * 4000}
          onToggle={(v) => t.setReliefs({ qcr: v ? 1 : 0 })}
        >
          <Stepper value={t.reliefs.qcr} onChange={(v) => t.setReliefs({ qcr: v })} />
        </ReliefRow>

        {/* HCR */}
        <ReliefRow
          title="Handicapped Child Relief (S$7,500 each)"
          enabled={t.reliefs.hcr > 0}
          amount={t.reliefs.hcr * 7500}
          onToggle={(v) => t.setReliefs({ hcr: v ? 1 : 0 })}
        >
          <Stepper value={t.reliefs.hcr} onChange={(v) => t.setReliefs({ hcr: v })} />
        </ReliefRow>

        {/* WMCR */}
        <ReliefRow
          title="Working Mother's Child Relief (tiered)"
          enabled={t.reliefs.wmcr > 0}
          amount={computeWMCR(t.reliefs.wmcr)}
          onToggle={(v) => t.setReliefs({ wmcr: v ? 1 : 0 })}
        >
          <Stepper value={t.reliefs.wmcr} onChange={(v) => t.setReliefs({ wmcr: v })} />
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 3 }}>
            S$8K / S$10K / S$12K for 1st / 2nd / 3rd+ child
          </div>
        </ReliefRow>

        {/* Parent Relief */}
        <ReliefRow
          title="Parent Relief (per dependant)"
          enabled={t.reliefs.parents.length > 0}
          amount={computeParentRelief(t.reliefs.parents)}
          onToggle={(v) => {
            if (v && t.reliefs.parents.length === 0) {
              t.setParents([{ stay: true, handicapped: false }])
            } else if (!v) {
              t.setParents([])
            }
          }}
        >
          <div style={{ marginTop: 4 }}>
            {t.reliefs.parents.map((dep, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  alignItems: 'center',
                  padding: '6px 0',
                  borderTop: '1px dashed var(--color-border)',
                  fontSize: 12,
                }}
              >
                <span style={{ color: 'var(--color-text-muted)', minWidth: 68 }}>
                  Dependant {idx + 1}
                </span>
                <label style={{ display: 'flex', gap: 4, alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={dep.stay}
                    onChange={(e) => {
                      const updated = t.reliefs.parents.map((d, i) =>
                        i === idx ? { ...d, stay: e.target.checked } : d
                      )
                      t.setParents(updated)
                    }}
                  />
                  Living with me
                </label>
                <label style={{ display: 'flex', gap: 4, alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={dep.handicapped}
                    onChange={(e) => {
                      const updated = t.reliefs.parents.map((d, i) =>
                        i === idx ? { ...d, handicapped: e.target.checked } : d
                      )
                      t.setParents(updated)
                    }}
                  />
                  Handicapped
                </label>
                <button
                  onClick={() => {
                    t.setParents(t.reliefs.parents.filter((_, i) => i !== idx))
                  }}
                  style={{
                    marginLeft: 'auto',
                    padding: '2px 8px',
                    borderRadius: 5,
                    border: '1px solid var(--color-border)',
                    background: 'transparent',
                    color: '#ef4444',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
            {t.reliefs.parents.length < 2 && (
              <button
                onClick={() =>
                  t.setParents([...t.reliefs.parents, { stay: true, handicapped: false }])
                }
                style={{
                  marginTop: 6,
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--color-border)',
                  background: 'transparent',
                  color: 'var(--color-text-muted)',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                + Add dependant (max 2)
              </button>
            )}
          </div>
        </ReliefRow>

        {/* Course Fees */}
        <ReliefRow
          title="Course Fees Relief (cap S$5,500)"
          enabled={t.reliefs.courseFees > 0}
          amount={Math.min(t.reliefs.courseFees, 5500)}
          onToggle={(v) => t.setReliefs({ courseFees: v ? 1000 : 0 })}
        >
          <AmountField
            value={t.reliefs.courseFees}
            onChange={(v) => t.setReliefs({ courseFees: v })}
            cap={5500}
          />
        </ReliefRow>

        {/* CPF top-up self */}
        <ReliefRow
          title="CPF Top-up Relief — self (cap S$8,000)"
          enabled={t.reliefs.cpfTopUpSelf > 0}
          amount={Math.min(t.reliefs.cpfTopUpSelf, 8000)}
          onToggle={(v) => t.setReliefs({ cpfTopUpSelf: v ? 4000 : 0 })}
        >
          <AmountField
            value={t.reliefs.cpfTopUpSelf}
            onChange={(v) => t.setReliefs({ cpfTopUpSelf: v })}
            cap={8000}
          />
        </ReliefRow>

        {/* CPF top-up family */}
        <ReliefRow
          title="CPF Top-up Relief — family (cap S$8,000)"
          enabled={t.reliefs.cpfTopUpFamily > 0}
          amount={Math.min(t.reliefs.cpfTopUpFamily, 8000)}
          onToggle={(v) => t.setReliefs({ cpfTopUpFamily: v ? 4000 : 0 })}
        >
          <AmountField
            value={t.reliefs.cpfTopUpFamily}
            onChange={(v) => t.setReliefs({ cpfTopUpFamily: v })}
            cap={8000}
          />
        </ReliefRow>

        {/* SRS */}
        <ReliefRow
          title={`SRS Contribution Relief (cap S$${srsCap.toLocaleString()})`}
          enabled={t.reliefs.srs > 0}
          amount={Math.min(t.reliefs.srs, srsCap)}
          onToggle={(v) => t.setReliefs({ srs: v ? 5000 : 0 })}
        >
          <AmountField
            value={t.reliefs.srs}
            onChange={(v) => t.setReliefs({ srs: v })}
            cap={srsCap}
          />
        </ReliefRow>

        {/* Life Insurance */}
        <ReliefRow
          title="Life Insurance Relief (cap S$5,000)"
          enabled={t.reliefs.lifeInsurance > 0}
          amount={Math.min(t.reliefs.lifeInsurance, Math.max(0, 5000 - estimatedCPF.employee))}
          onToggle={(v) => t.setReliefs({ lifeInsurance: v ? 1000 : 0 })}
        >
          <AmountField
            value={t.reliefs.lifeInsurance}
            onChange={(v) => t.setReliefs({ lifeInsurance: v })}
            cap={5000}
            hint="Only if employee CPF < S$5,000"
          />
        </ReliefRow>

        {/* Maid Levy */}
        <ReliefRow
          title="FDWL Relief (2× levy paid)"
          enabled={t.reliefs.maidLevy > 0}
          amount={t.reliefs.maidLevy * 2}
          onToggle={(v) => t.setReliefs({ maidLevy: v ? 3600 : 0 })}
        >
          <AmountField
            value={t.reliefs.maidLevy}
            onChange={(v) => t.setReliefs({ maidLevy: v })}
            hint="Enter total levy paid (deduction = 2×)"
          />
        </ReliefRow>

        {/* Donations */}
        <ReliefRow
          title="Donations — 250% deduction"
          enabled={t.reliefs.donations > 0}
          amount={t.reliefs.donations * 2.5}
          onToggle={(v) => t.setReliefs({ donations: v ? 500 : 0 })}
        >
          <AmountField
            value={t.reliefs.donations}
            onChange={(v) => t.setReliefs({ donations: v })}
            hint="Cash donations to approved IPCs"
          />
        </ReliefRow>

        {/* Cap warning */}
        {calc.reliefResult.capApplied && (
          <div
            style={{
              marginTop: 8,
              padding: '7px 10px',
              borderRadius: 6,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              fontSize: 11,
              color: '#ef4444',
            }}
          >
            Relief cap of S$80,000 reached — excess reliefs not deductible.
          </div>
        )}
      </PanelSection>

      {/* What-If */}
      <PanelSection title="What-If" open={openWhatif} onToggle={() => setOpenWhatif((v) => !v)}>
        {(
          [
            { key: 'salary' as const, label: 'Increase salary by', chips: [5000, 10000, 20000] },
            { key: 'srs' as const, label: 'Extra SRS contribution', chips: [2000, 5000, srsCap] },
            { key: 'cpftopup' as const, label: 'Extra CPF top-up', chips: [4000, 8000] },
            { key: 'donation' as const, label: 'Extra donation', chips: [500, 2000] },
          ] as const
        ).map(({ key, label, chips }) => (
          <div key={key} style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                marginBottom: 4,
              }}
            >
              {label}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {chips.map((amt) => {
                const active = t.whatif[key] === amt
                return (
                  <button
                    key={amt}
                    onClick={() => t.set({ whatif: { ...t.whatif, [key]: active ? 0 : amt } })}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 16,
                      border: `1.5px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      background: active ? 'var(--color-accent)' : 'transparent',
                      color: active ? '#fff' : 'var(--color-text-muted)',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    +S${amt.toLocaleString()}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {anyWhatif && whatifCalc && (
          <div
            style={{
              marginTop: 8,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 6,
              padding: '10px 12px',
              borderRadius: 8,
              background: 'rgba(16,185,129,0.07)',
              border: '1px solid rgba(16,185,129,0.25)',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
              >
                New tax
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
                S${fmtSGD(whatifCalc.taxResult.tax)}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
              >
                Change
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: whatifCalc.taxResult.tax <= calc.taxResult.tax ? '#10b981' : '#ef4444',
                }}
              >
                {whatifCalc.taxResult.tax <= calc.taxResult.tax ? '−' : '+'}S$
                {fmtSGD(Math.abs(whatifCalc.taxResult.tax - calc.taxResult.tax))}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
              >
                Savings
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>
                S${fmtSGD(Math.max(0, calc.taxResult.tax - whatifCalc.taxResult.tax))}
              </div>
            </div>
          </div>
        )}

        {anyWhatif && (
          <button
            onClick={() => t.set({ whatif: { salary: 0, srs: 0, cpftopup: 0, donation: 0 } })}
            style={{
              marginTop: 8,
              padding: '4px 12px',
              borderRadius: 6,
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            Clear what-if
          </button>
        )}
      </PanelSection>

      {/* Export */}
      <div style={{ padding: '10px 14px' }}>
        <button
          onClick={() => exportCSV(calc)}
          style={{
            width: '100%',
            padding: '5px 12px',
            borderRadius: 6,
            border: '1px solid var(--color-border)',
            background: 'transparent',
            color: 'var(--color-text-muted)',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Export CSV
        </button>
      </div>
    </div>
  )

  // ── Chart Datasets ─────────────────────────────────────────────────────────

  const donutData = {
    labels: ['Take-Home', 'Employee CPF', 'Income Tax'],
    datasets: [
      {
        data: [Math.max(0, calc.incomeAfterTax), calc.reliefResult.cpfEmployee, calc.taxResult.tax],
        backgroundColor: ['#0f766e', '#0891b2', '#f59e0b'],
        borderWidth: 0,
      },
    ],
  }

  const bracketChartData = {
    labels: calc.taxResult.breakdown.map((b) =>
      b.max === Infinity ? `>${(b.min / 1000).toFixed(0)}K` : `${(b.min / 1000).toFixed(0)}K`
    ),
    datasets: [
      {
        label: 'Tax per bracket (S$)',
        data: calc.taxResult.breakdown.map((b) => b.taxInBracket),
        backgroundColor: calc.taxResult.breakdown.map((b, i) =>
          b.active
            ? BRACKET_COLORS[i % BRACKET_COLORS.length]
            : BRACKET_COLORS[i % BRACKET_COLORS.length] + '70'
        ),
        borderRadius: 4,
      },
    ],
  }

  const ratesChartData = {
    labels: ['Effective rate', 'Average rate', 'Marginal rate'],
    datasets: [
      {
        label: 'Tax rate (%)',
        data: [
          parseFloat((calc.effectiveRate * 100).toFixed(2)),
          parseFloat((calc.averageRate * 100).toFixed(2)),
          parseFloat((calc.taxResult.marginalRate * 100).toFixed(2)),
        ],
        backgroundColor: ['#0f766e', '#0891b2', '#f59e0b'],
        borderRadius: 6,
      },
    ],
  }

  const ratesChartOptions = {
    ...chartOptions,
    plugins: { ...chartOptions.plugins, legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        ticks: { callback: (v: number | string) => `${v}%` },
      },
    },
  }

  const progressionChartData = {
    labels: progressionData.labels,
    datasets: [
      {
        label: 'Tax payable (S$)',
        data: progressionData.data,
        borderColor: '#0f766e',
        backgroundColor: 'rgba(15,118,110,0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
      },
    ],
  }

  // ── Right panel ────────────────────────────────────────────────────────────

  return (
    <CalcLayout inputPanel={inputPanel}>
      <div style={{ padding: '24px 28px' }}>
        {/* Metric Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            marginBottom: 22,
          }}
        >
          <MetricCard
            label="Tax Payable"
            value={`S$${fmtSGD(calc.taxResult.tax)}`}
            subvalue={`YA 2025`}
            accent="#f59e0b"
          />
          <MetricCard
            label="Effective Rate"
            value={fmtPct(calc.effectiveRate * 100)}
            subvalue="of gross income"
            accent="#0f766e"
          />
          <MetricCard
            label="Marginal Rate"
            value={fmtPct(calc.taxResult.marginalRate * 100)}
            subvalue="on next dollar"
            accent="#0891b2"
          />
          <MetricCard
            label="Chargeable Income"
            value={fmtSGDCompact(calc.chargeableIncome)}
            subvalue={`after S$${fmtSGD(calc.reliefResult.total)} reliefs`}
            accent="#a855f7"
          />
          <MetricCard
            label="Annual Take-Home"
            value={fmtSGDCompact(calc.incomeAfterTax)}
            subvalue={`S$${fmtSGD(calc.monthlyTakeHome)}/month`}
            accent="#10b981"
          />
          <MetricCard
            label="Tax Savings"
            value={fmtSGDCompact(calc.savings)}
            subvalue="benefit of reliefs"
            accent={calc.savings > 0 ? '#10b981' : 'var(--color-text-muted)'}
          />
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 2,
            marginBottom: 16,
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                padding: '7px 14px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: activeTab === t ? 600 : 400,
                color: activeTab === t ? 'var(--color-accent-teal)' : 'var(--color-text-muted)',
                borderBottom:
                  activeTab === t ? '2px solid var(--color-accent-teal)' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === 'Overview' && (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 20,
                marginBottom: 22,
              }}
            >
              {/* Donut */}
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                    marginBottom: 10,
                  }}
                >
                  Income Allocation
                </div>
                <div style={{ height: 220 }}>
                  <Doughnut
                    data={donutData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      cutout: '65%',
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: { usePointStyle: true, pointStyleWidth: 8, font: { size: 11 } },
                        },
                        tooltip: {
                          callbacks: {
                            label: (ctx) =>
                              ` S$${Math.round(ctx.raw as number).toLocaleString('en-SG')}`,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {/* Summary rows */}
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                    marginBottom: 10,
                  }}
                >
                  Summary
                </div>
                {[
                  { label: 'Gross income', value: calc.grossIncome },
                  { label: 'Total reliefs', value: calc.reliefResult.total },
                  { label: 'Chargeable income', value: calc.chargeableIncome },
                  { label: 'Tax payable', value: calc.taxResult.tax },
                  { label: 'Employee CPF', value: calc.reliefResult.cpfEmployee },
                  { label: 'Income after tax', value: calc.incomeAfterTax },
                  { label: 'Monthly take-home', value: calc.monthlyTakeHome },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '6px 0',
                      borderBottom: '1px solid var(--color-border)',
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                      S${fmtSGD(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Relief breakdown */}
            {calc.reliefResult.items.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                    marginBottom: 8,
                  }}
                >
                  Applied Reliefs
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr>
                        {['Relief', 'Amount'].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: '6px 8px',
                              textAlign: h === 'Amount' ? 'right' : 'left',
                              color: 'var(--color-text-muted)',
                              fontWeight: 600,
                              borderBottom: '1px solid var(--color-border)',
                              fontSize: 11,
                              textTransform: 'uppercase',
                              letterSpacing: 0.4,
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {calc.reliefResult.items.map((item) => (
                        <tr key={item.label}>
                          <td
                            style={{
                              padding: '6px 8px',
                              color: 'var(--color-text-secondary)',
                              borderBottom: '1px solid var(--color-border)',
                            }}
                          >
                            {item.label}
                          </td>
                          <td
                            style={{
                              padding: '6px 8px',
                              textAlign: 'right',
                              fontWeight: 600,
                              color: '#0f766e',
                              borderBottom: '1px solid var(--color-border)',
                            }}
                          >
                            S${fmtSGD(item.value)}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td
                          style={{
                            padding: '8px 8px',
                            fontWeight: 700,
                            color: 'var(--color-text)',
                          }}
                        >
                          Total
                          {calc.reliefResult.capApplied && (
                            <span
                              style={{
                                marginLeft: 6,
                                fontSize: 10,
                                padding: '1px 5px',
                                borderRadius: 8,
                                background: 'rgba(239,68,68,0.12)',
                                color: '#ef4444',
                              }}
                            >
                              capped
                            </span>
                          )}
                        </td>
                        <td
                          style={{
                            padding: '8px 8px',
                            textAlign: 'right',
                            fontWeight: 700,
                            color: '#0f766e',
                          }}
                        >
                          S${fmtSGD(calc.reliefResult.total)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Brackets Tab ── */}
        {activeTab === 'Brackets' && (
          <div>
            <div style={{ height: 280, marginBottom: 22 }}>
              <Bar data={bracketChartData} options={chartOptions} />
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--color-surface)' }}>
                    {['Bracket', 'Rate', 'Income taxed', 'Tax charged', 'Running total'].map(
                      (h) => (
                        <th
                          key={h}
                          style={{
                            padding: '8px 10px',
                            textAlign: h === 'Bracket' ? 'left' : 'right',
                            color: 'var(--color-text-muted)',
                            fontWeight: 600,
                            borderBottom: '1px solid var(--color-border)',
                            fontSize: 11,
                            textTransform: 'uppercase',
                            letterSpacing: 0.4,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {calc.taxResult.breakdown.map((row, i) => (
                    <tr
                      key={i}
                      style={{
                        background: row.active ? 'rgba(15,118,110,0.07)' : 'transparent',
                        opacity: row.incomeInBracket === 0 ? 0.4 : 1,
                      }}
                    >
                      <td
                        style={{
                          padding: '7px 10px',
                          color: row.active ? '#0f766e' : 'var(--color-text-secondary)',
                          fontWeight: row.active ? 700 : 400,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            width: 8,
                            height: 8,
                            borderRadius: 2,
                            background: BRACKET_COLORS[i % BRACKET_COLORS.length],
                            flexShrink: 0,
                          }}
                        />
                        {row.max === Infinity
                          ? `Above S$${row.min.toLocaleString()}`
                          : `S$${row.min.toLocaleString()} – ${row.max.toLocaleString()}`}
                        {row.active && (
                          <span
                            style={{
                              fontSize: 9,
                              padding: '1px 5px',
                              borderRadius: 8,
                              background: 'rgba(15,118,110,0.18)',
                              color: '#0f766e',
                            }}
                          >
                            you
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: '7px 10px',
                          textAlign: 'right',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        {(row.rate * 100).toFixed(1)}%
                      </td>
                      <td
                        style={{
                          padding: '7px 10px',
                          textAlign: 'right',
                          color: 'var(--color-text)',
                        }}
                      >
                        S${fmtSGD(row.incomeInBracket)}
                      </td>
                      <td
                        style={{
                          padding: '7px 10px',
                          textAlign: 'right',
                          fontWeight: row.active ? 600 : 400,
                          color: row.active ? '#f59e0b' : 'var(--color-text)',
                        }}
                      >
                        S${fmtSGD(row.taxInBracket)}
                      </td>
                      <td
                        style={{
                          padding: '7px 10px',
                          textAlign: 'right',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        S${fmtSGD(row.runningTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Rates Tab ── */}
        {activeTab === 'Rates' && (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 20,
                marginBottom: 22,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                    marginBottom: 10,
                  }}
                >
                  Rate Comparison
                </div>
                <div style={{ height: 220 }}>
                  <Bar data={ratesChartData} options={ratesChartOptions} />
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                    marginBottom: 10,
                  }}
                >
                  Tax Progression
                </div>
                <div style={{ height: 220 }}>
                  <Line data={progressionChartData} options={chartOptions} />
                </div>
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
              }}
            >
              {[
                {
                  label: 'Effective rate',
                  value: fmtPct(calc.effectiveRate * 100),
                  desc: 'Total tax ÷ gross income',
                  color: '#0f766e',
                },
                {
                  label: 'Average rate',
                  value: fmtPct(calc.averageRate * 100),
                  desc: 'Tax ÷ chargeable income',
                  color: '#0891b2',
                },
                {
                  label: 'Marginal rate',
                  value: fmtPct(calc.taxResult.marginalRate * 100),
                  desc: 'Rate on next dollar earned',
                  color: '#f59e0b',
                },
              ].map(({ label, value, desc, color }) => (
                <div
                  key={label}
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    borderTop: `3px solid ${color}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      marginBottom: 4,
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 3 }}>
                    {desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Insights Tab ── */}
        {activeTab === 'Insights' && (
          <div>
            {/* Insights */}
            <div style={{ marginBottom: 22 }}>
              {insights.map((ins, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 7,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      background:
                        ins.type === 'positive' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.10)',
                      color: ins.type === 'positive' ? '#10b981' : '#ef4444',
                    }}
                  >
                    {ins.type === 'positive' ? '✓' : '!'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text)', lineHeight: 1.5 }}>
                    {ins.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Optimisation score */}
            <div
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 10,
                padding: '16px 18px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <svg width={64} height={64} viewBox="0 0 64 64">
                <circle
                  cx={32}
                  cy={32}
                  r={26}
                  fill="none"
                  stroke="var(--color-border)"
                  strokeWidth={7}
                />
                <circle
                  cx={32}
                  cy={32}
                  r={26}
                  fill="none"
                  stroke="#0f766e"
                  strokeWidth={7}
                  strokeLinecap="round"
                  transform="rotate(-90 32 32)"
                  strokeDasharray={`${(score / 100) * 2 * Math.PI * 26} ${2 * Math.PI * 26}`}
                />
                <text
                  x={32}
                  y={36}
                  textAnchor="middle"
                  fontSize={16}
                  fontWeight={700}
                  fill="var(--color-text)"
                >
                  {score}
                </text>
              </svg>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
                  Tax Optimisation Score
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {score}/100 · based on SRS, CPF top-ups, donations and course fees used
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 10,
                padding: '12px 16px',
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                  marginBottom: 8,
                }}
              >
                Tax Planning Checklist
              </div>
              {[
                {
                  label: `Maximise SRS contribution (S$${srsCap.toLocaleString()} cap)`,
                  done: t.reliefs.srs >= srsCap,
                },
                {
                  label: 'Top up CPF Special/Retirement Account (self or family)',
                  done:
                    Math.min(t.reliefs.cpfTopUpSelf, 8000) +
                      Math.min(t.reliefs.cpfTopUpFamily, 8000) >=
                    16000,
                },
                {
                  label: 'Claim Course Fees Relief for approved upgrading courses',
                  done: t.reliefs.courseFees > 0,
                },
                {
                  label: 'Record all approved-IPC donations for the year',
                  done: t.reliefs.donations > 0,
                },
                {
                  label: 'Check Parent / Handicapped Parent Relief eligibility',
                  done: t.reliefs.parents.length > 0,
                },
                {
                  label: "Confirm Working Mother's Child Relief eligibility if applicable",
                  done: t.reliefs.wmcr > 0,
                },
                {
                  label: 'Review total reliefs against the S$80,000 relief cap',
                  done: !calc.reliefResult.capApplied,
                },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '7px 0',
                    borderBottom: '1px solid var(--color-border)',
                    fontSize: 12,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    readOnly
                    style={{ marginTop: 1, accentColor: '#0f766e', cursor: 'default' }}
                  />
                  <span
                    style={{
                      color: item.done ? 'var(--color-text-muted)' : 'var(--color-text)',
                      textDecoration: item.done ? 'line-through' : 'none',
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <div
              style={{
                marginTop: 16,
                padding: '10px 14px',
                borderRadius: 8,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                fontSize: 11,
                color: 'var(--color-text-muted)',
                lineHeight: 1.55,
              }}
            >
              <strong style={{ color: 'var(--color-text)' }}>Disclaimer:</strong> Estimates only —
              not tax advice. Actual assessments are made by IRAS. CPF contribution rates and relief
              caps shown are indicative of YA 2024 onwards rules. Always verify against official
              IRAS and CPF Board publications before filing.
            </div>
          </div>
        )}
      </div>
    </CalcLayout>
  )
}
