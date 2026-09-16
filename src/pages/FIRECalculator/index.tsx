import { useEffect, useMemo, useState } from 'react'
import { Line, Doughnut } from 'react-chartjs-2'
import CalcLayout from '../../layouts/CalcLayout'
import ProfilePanel from '../../components/ProfilePanel'
import MetricCard from '../../components/MetricCard'
import { useProfileStore } from '../../store/profileStore'
import { useFIREStore } from '../../store/fireStore'
import { usePropertyStore } from '../../store/propertyStore'
import { projectFIRE, type FIREYearRow } from '../../engines/fireEngine'
import { fmtSGD, fmtSGDCompact, fmtPct } from '../../utils/format'
import { useNumberInputState } from '../../hooks/useNumberInputState'

function InputSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ borderBottom: '1px solid var(--color-border)' }}>
      <button
        onClick={() => setOpen(!open)}
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
        {title}
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
  step = 1,
  min = 0,
  max,
  prefix,
  suffix,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  max?: number
  prefix?: string
  suffix?: string
}) {
  const { text, handleChange, handleBlur } = useNumberInputState(value, onChange)
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
        {prefix && <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{prefix}</span>}
        <input
          type="number"
          value={text}
          min={min}
          max={max}
          step={step}
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
        {suffix && <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{suffix}</span>}
      </div>
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
        cursor: 'pointer',
        fontSize: 13,
        color: 'var(--color-text-secondary)',
      }}
    >
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}

const TABS = ['Overview', 'Net Worth', 'Portfolio', 'Projection Table']

function filterProjectionRows(
  rows: FIREYearRow[],
  retireAge: number,
  fireAge: number | null
): FIREYearRow[] {
  const keyAges = new Set([retireAge, 55, 65, fireAge].filter(Boolean) as number[])
  const everyFive = rows.filter((r) => r.age % 5 === 0)
  const keyRows = rows.filter((r) => keyAges.has(r.age))
  const combined = [...new Map([...everyFive, ...keyRows].map((r) => [r.age, r])).values()]
  return combined.sort((a, b) => a.age - b.age)
}

export default function FIRECalculator() {
  const p = useProfileStore()
  const f = useFIREStore()
  const ps = usePropertyStore()
  const [activeTab, setActiveTab] = useState('Overview')

  const result = useMemo(
    () =>
      projectFIRE({
        age: p.age,
        retireAge: p.retireAge,
        salary: p.salary,
        salaryGrowth: p.salaryGrowth,
        expenses: p.expenses,
        cpfOA: p.cpfOA,
        cpfSA: p.cpfSA,
        cpfMA: p.cpfMA,
        cash: p.cash,
        investments: p.investments,
        bondPrincipal: f.bondPrincipal,
        bondRate: f.bondRate,
        stocksValue: f.stocksValue,
        stocksDCA: f.stocksDCA,
        stocksReturn: f.stocksReturn,
        inflation: f.inflation,
        swr: f.swr,
        includeCPF: f.includeCPF,
        adjustInflation: f.adjustInflation,
        ownedPropertyValue: ps.ownsProperty ? ps.ownedPropertyValue : 0,
        ownedPropertyAppreciation: ps.ownsProperty ? ps.ownedPropertyAppreciation : 0,
        ownedPropertyRentalIncome: ps.ownsProperty ? ps.ownedPropertyRentalIncome : 0,
      }),
    [p, f, ps]
  )

  const derivedInvestmentPortfolio = f.bondPrincipal + f.stocksValue

  useEffect(() => {
    if (p.investments !== derivedInvestmentPortfolio) {
      p.set({ investments: derivedInvestmentPortfolio })
    }
  }, [derivedInvestmentPortfolio, p])

  const fireProgress = Math.min(100, result.fireProgressPct)
  const statusLabel =
    fireProgress >= 100 ? 'FIRE Achieved!' : fireProgress >= 50 ? 'On Track' : 'Building'
  const statusColor = fireProgress >= 100 ? '#f97316' : fireProgress >= 50 ? '#10b981' : '#3b82f6'

  // Warnings
  const warnings: string[] = []
  if (p.retireAge <= p.age) warnings.push('Retirement age must be greater than current age')
  if (p.salary === 0) warnings.push('No salary entered — CPF contributions will not be modelled')
  if (p.expenses >= p.salary * 0.9 && p.salary > 0)
    warnings.push('Expenses are ≥90% of salary — very little savings capacity')
  if (f.inflation > 5)
    warnings.push('Inflation >5% — this significantly increases your FIRE number')
  if (f.stocksReturn > 15) warnings.push('Stocks capital growth >15% — very optimistic assumption')

  const inputPanel = (
    <div>
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
          FIRE Calculator
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
          Financial Independence, Retire Early
        </div>
      </div>

      <ProfilePanel showAssets={true} />

      <InputSection title="FIRE — Investments">
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--color-text-muted)',
            marginBottom: 6,
            textTransform: 'uppercase',
          }}
        >
          Bonds
        </div>
        <NF
          label="Bond Principal (S$)"
          value={f.bondPrincipal}
          onChange={(v) => f.set({ bondPrincipal: v })}
          step={1000}
          prefix="S$"
        />
        <NF
          label="Bond Interest Rate (%)"
          value={f.bondRate}
          onChange={(v) => f.set({ bondRate: v })}
          step={0.1}
          min={0}
          max={10}
          suffix="%"
        />

        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--color-text-muted)',
            margin: '8px 0 6px',
            textTransform: 'uppercase',
          }}
        >
          Stocks
        </div>
        <NF
          label="Stocks Value (S$)"
          value={f.stocksValue}
          onChange={(v) => f.set({ stocksValue: v })}
          step={1000}
          prefix="S$"
        />
        <NF
          label="Stocks Annual DCA (S$)"
          value={f.stocksDCA}
          onChange={(v) => f.set({ stocksDCA: v })}
          step={500}
          prefix="S$"
        />
        <NF
          label="Stocks Capital Growth (%)"
          value={f.stocksReturn}
          onChange={(v) => f.set({ stocksReturn: v })}
          step={0.5}
          suffix="%"
        />
      </InputSection>

      <InputSection title="FIRE — Assumptions">
        <NF
          label="Inflation Rate (%)"
          value={f.inflation}
          onChange={(v) => f.set({ inflation: v })}
          step={0.1}
          min={0}
          max={8}
          suffix="%"
        />
        <NF
          label="Safe Withdrawal Rate (%)"
          value={f.swr}
          onChange={(v) => f.set({ swr: v })}
          step={0.1}
          min={2}
          max={6}
          suffix="%"
        />
        <Toggle
          label="Include CPF in net worth"
          checked={f.includeCPF}
          onChange={(v) => f.set({ includeCPF: v })}
        />
        <Toggle
          label="Adjust for inflation"
          checked={f.adjustInflation}
          onChange={(v) => f.set({ adjustInflation: v })}
        />
      </InputSection>

      <InputSection title="Property Ownership">
        <Toggle
          label="I currently own a property"
          checked={ps.ownsProperty}
          onChange={(v) => ps.set({ ownsProperty: v })}
        />
        {ps.ownsProperty && (
          <>
            <NF
              label="Current Property Value (S$)"
              value={ps.ownedPropertyValue}
              onChange={(v) => ps.set({ ownedPropertyValue: v })}
              step={10000}
              prefix="S$"
            />
            <NF
              label="Annual Appreciation (%)"
              value={ps.ownedPropertyAppreciation}
              onChange={(v) => ps.set({ ownedPropertyAppreciation: v })}
              step={0.5}
              min={0}
              max={15}
              suffix="%"
            />
            <NF
              label="Monthly Rental Income (S$)"
              value={ps.ownedPropertyRentalIncome}
              onChange={(v) => ps.set({ ownedPropertyRentalIncome: v })}
              step={100}
              prefix="S$"
            />
          </>
        )}
      </InputSection>

      {/* Reset */}
      <div style={{ padding: '10px 14px' }}>
        <button
          onClick={() =>
            f.set({
              bondPrincipal: 20000,
              bondRate: 3.0,
              stocksValue: 80000,
              stocksDCA: 12000,
              stocksReturn: 7.5,
              inflation: 2.5,
              swr: 4,
              includeCPF: true,
              adjustInflation: true,
            })
          }
          style={{
            fontSize: 12,
            padding: '5px 12px',
            borderRadius: 6,
            border: '1px solid var(--color-border)',
            background: 'transparent',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
          }}
        >
          Reset to defaults
        </button>
      </div>
    </div>
  )

  // Chart data
  const chartRows = result.rows.filter((r) => r.age <= Math.min(p.retireAge + 15, 85))
  const chartLabels = chartRows.map((r) => String(r.age))

  const nwChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Total Net Worth',
        data: chartRows.map((r) => r.netWorth),
        borderColor: '#f97316',
        backgroundColor: 'rgba(249,115,22,0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
      },
      {
        label: 'Cash & Portfolio',
        data: chartRows.map((r) => r.cashInvest),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.06)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
      },
      {
        label: 'CPF Total',
        data: chartRows.map((r) => r.cpfTotal),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.06)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
      },
      ...(ps.ownsProperty
        ? [
            {
              label: 'Property Value',
              data: chartRows.map((r) => r.propertyValue),
              borderColor: '#a855f7',
              backgroundColor: 'rgba(168,85,247,0.06)',
              fill: true,
              tension: 0.3,
              pointRadius: 0,
            },
          ]
        : []),
      {
        label: 'FIRE Number',
        data: chartRows.map(() => result.fireNumber),
        borderColor: '#ef4444',
        borderDash: [5, 3],
        pointRadius: 0,
        fill: false,
        tension: 0,
      },
    ],
  }

  const retRow = result.retirementRow
  const doughnutData = retRow
    ? {
        labels: ps.ownsProperty
          ? ['Cash', 'Bonds', 'Stocks', 'CPF', 'Property']
          : ['Cash', 'Bonds', 'Stocks', 'CPF'],
        datasets: [
          {
            data: ps.ownsProperty
              ? [retRow.cash, retRow.bonds, retRow.stocks, retRow.cpfTotal, retRow.propertyValue]
              : [retRow.cash, retRow.bonds, retRow.stocks, retRow.cpfTotal],
            backgroundColor: ps.ownsProperty
              ? ['#94a3b8', '#3b82f6', '#10b981', '#a855f7', '#f97316']
              : ['#94a3b8', '#3b82f6', '#10b981', '#a855f7'],
            borderWidth: 0,
          },
        ],
      }
    : null

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

  const projRows = filterProjectionRows(result.rows, p.retireAge, result.fireAge)

  return (
    <CalcLayout inputPanel={inputPanel}>
      <div style={{ padding: '24px 28px' }}>
        {/* Warnings */}
        {warnings.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            {warnings.map((w, i) => (
              <div
                key={i}
                style={{
                  padding: '7px 12px',
                  borderRadius: 6,
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#ef4444',
                  fontSize: 12,
                  marginBottom: 4,
                }}
              >
                ⚠ {w}
              </div>
            ))}
          </div>
        )}

        {/* 4 Metric cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            marginBottom: 22,
          }}
        >
          <MetricCard
            label="FIRE Number"
            value={`S$${fmtSGD(result.fireNumber)}`}
            subvalue={`${f.swr}% SWR`}
            accent="#ef4444"
          />
          <MetricCard
            label="Years to FIRE"
            value={result.fireAge ? String(result.fireAge - p.age) : '—'}
            subvalue={result.fireAge ? `At age ${result.fireAge}` : 'Not reached'}
            accent="#f97316"
          />
          <MetricCard
            label="Monthly Passive Income"
            value={`S$${fmtSGD(result.monthlyPassiveIncome)}`}
            subvalue="At retirement"
            accent="#10b981"
          />
          <MetricCard
            label="Net Worth Today"
            value={fmtSGDCompact(result.currentNetWorth)}
            subvalue={f.includeCPF ? 'Incl. CPF' : 'Excl. CPF'}
            accent="#3b82f6"
          />
        </div>

        {/* Status + Progress */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
              FIRE Progress — {fmtPct(fireProgress, 0)}
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: '3px 12px',
                borderRadius: 20,
                background: `${statusColor}22`,
                color: statusColor,
              }}
            >
              {statusLabel}
            </span>
          </div>
          <div
            style={{
              height: 8,
              background: 'var(--color-border)',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${fireProgress}%`,
                background: `linear-gradient(90deg, ${statusColor}, #f97316)`,
                borderRadius: 4,
                transition: 'width 0.4s',
              }}
            />
          </div>
          {/* Age timeline */}
          <div style={{ marginTop: 14, position: 'relative', height: 28 }}>
            <div
              style={{
                position: 'absolute',
                top: 12,
                left: 0,
                right: 0,
                height: 3,
                background: 'var(--color-border)',
                borderRadius: 2,
              }}
            />
            {[
              { age: p.age, label: 'Now', color: '#3b82f6' },
              ...(result.fireAge ? [{ age: result.fireAge, label: 'FIRE', color: '#f97316' }] : []),
              { age: 65, label: 'CPF LIFE', color: '#10b981' },
              { age: p.retireAge, label: 'Retire', color: '#a855f7' },
            ].map((m) => {
              const pct = Math.min(100, Math.max(0, ((m.age - 20) / (75 - 20)) * 100))
              return (
                <div
                  key={m.label}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: `${pct}%`,
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: m.color,
                      border: '2px solid var(--color-bg)',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 9,
                      color: m.color,
                      marginTop: 12,
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {m.age}
                  </span>
                </div>
              )
            })}
          </div>
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
                color: activeTab === t ? 'var(--color-accent)' : 'var(--color-text-muted)',
                borderBottom:
                  activeTab === t ? '2px solid var(--color-accent)' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'Overview' && retRow && (
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-text)',
                marginBottom: 12,
              }}
            >
              Projected Wealth at Retirement (Age {p.retireAge})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { label: 'Cash', value: retRow.cash, color: '#94a3b8' },
                { label: 'Bonds', value: retRow.bonds, color: '#3b82f6' },
                { label: 'Stocks', value: retRow.stocks, color: '#10b981' },
                { label: 'Investment Portfolio', value: retRow.invest, color: '#14b8a6' },
                { label: 'CPF OA', value: retRow.cpfOA, color: '#6366f1' },
                { label: 'CPF SA', value: retRow.cpfSA, color: '#8b5cf6' },
                { label: 'CPF MA', value: retRow.cpfMA, color: '#a855f7' },
                ...(ps.ownsProperty
                  ? [{ label: 'Property Value', value: retRow.propertyValue, color: '#f97316' }]
                  : []),
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderLeft: `3px solid ${item.color}`,
                    borderRadius: 8,
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: item.color }}>
                    {fmtSGDCompact(item.value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Net Worth' && (
          <div style={{ height: 380 }}>
            <Line data={nwChartData} options={chartOptions} />
          </div>
        )}

        {activeTab === 'Portfolio' && doughnutData && (
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ width: 300, height: 300 }}>
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '68%',
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                      labels: { usePointStyle: true, font: { size: 11 } },
                    },
                  },
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 6 }}>
                Investment Portfolio at Age {p.retireAge}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)' }}>
                {fmtSGDCompact(result.retirementRow?.netWorth ?? 0)}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Projection Table' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'var(--color-surface)' }}>
                  {[
                    'Age',
                    'Year',
                    'Net Worth',
                    'CPF Total',
                    'Cash+Portfolio',
                    ...(ps.ownsProperty ? ['Property'] : []),
                    'Savings',
                    'FIRE %',
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '8px 10px',
                        textAlign: 'right',
                        color: 'var(--color-text-muted)',
                        fontWeight: 600,
                        borderBottom: '1px solid var(--color-border)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projRows.map((r) => {
                  const isKey =
                    r.age === p.retireAge ||
                    r.age === result.fireAge ||
                    r.age === 55 ||
                    r.age === 65
                  const firePct = Math.min(100, (r.netWorth / result.fireNumber) * 100)
                  return (
                    <tr
                      key={r.age}
                      style={{ background: isKey ? 'rgba(249,115,22,0.06)' : 'transparent' }}
                    >
                      <td
                        style={{
                          padding: '7px 10px',
                          textAlign: 'right',
                          fontWeight: isKey ? 700 : 400,
                          color: isKey ? 'var(--color-accent)' : 'var(--color-text)',
                        }}
                      >
                        {r.age}
                        {r.age === result.fireAge && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: 10,
                              background: 'rgba(249,115,22,0.2)',
                              color: '#f97316',
                              padding: '1px 6px',
                              borderRadius: 10,
                            }}
                          >
                            FIRE!
                          </span>
                        )}
                        {r.age === 55 && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: 10,
                              background: 'rgba(99,102,241,0.15)',
                              color: '#6366f1',
                              padding: '1px 6px',
                              borderRadius: 10,
                            }}
                          >
                            CPF Unlock
                          </span>
                        )}
                        {r.age === p.retireAge && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: 10,
                              background: 'rgba(16,185,129,0.15)',
                              color: '#10b981',
                              padding: '1px 6px',
                              borderRadius: 10,
                            }}
                          >
                            Retire
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: '7px 10px',
                          textAlign: 'right',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        {r.year}
                      </td>
                      <td
                        style={{
                          padding: '7px 10px',
                          textAlign: 'right',
                          fontWeight: 600,
                          color: 'var(--color-text)',
                        }}
                      >
                        S${fmtSGD(r.netWorth)}
                      </td>
                      <td
                        style={{
                          padding: '7px 10px',
                          textAlign: 'right',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        S${fmtSGD(r.cpfTotal)}
                      </td>
                      <td
                        style={{
                          padding: '7px 10px',
                          textAlign: 'right',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        S${fmtSGD(r.cashInvest)}
                      </td>
                      {ps.ownsProperty && (
                        <td
                          style={{
                            padding: '7px 10px',
                            textAlign: 'right',
                            color: '#a855f7',
                          }}
                        >
                          S${fmtSGD(r.propertyValue)}
                        </td>
                      )}
                      <td
                        style={{
                          padding: '7px 10px',
                          textAlign: 'right',
                          color: r.annualSavings >= 0 ? 'var(--color-green)' : 'var(--color-red)',
                        }}
                      >
                        S${fmtSGD(r.annualSavings)}
                      </td>
                      <td style={{ padding: '7px 10px', textAlign: 'right' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            justifyContent: 'flex-end',
                          }}
                        >
                          <span style={{ color: 'var(--color-text-secondary)' }}>
                            {firePct.toFixed(0)}%
                          </span>
                          <div
                            style={{
                              width: 50,
                              height: 4,
                              background: 'var(--color-border)',
                              borderRadius: 2,
                            }}
                          >
                            <div
                              style={{
                                width: `${firePct}%`,
                                height: '100%',
                                background: '#f97316',
                                borderRadius: 2,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </CalcLayout>
  )
}
