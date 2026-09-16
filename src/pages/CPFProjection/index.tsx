import { useMemo, useState } from 'react'
import { Line, Bar } from 'react-chartjs-2'
import CalcLayout from '../../layouts/CalcLayout'
import ProfilePanel from '../../components/ProfilePanel'
import MetricCard from '../../components/MetricCard'
import { useProfileStore } from '../../store/profileStore'
import { useCPFStore, type CPFScenario } from '../../store/cpfStore'
import { projectCPF } from '../../engines/cpfEngine'
import { fmtSGD, fmtSGDCompact, fmtPct } from '../../utils/format'

const CPF_PRESETS = [
  {
    label: 'Fresh Grad',
    data: {
      gender: 'male' as const,
      age: 25,
      retireAge: 65,
      salary: 3500,
      salaryGrowth: 4,
      bonus: 1,
      expenses: 1800,
      cpfOA: 5000,
      cpfSA: 2000,
      cpfMA: 3000,
      cash: 10000,
      investments: 5000,
      citizenship: 'SC',
      marital: 'single',
      firstTimer: 'yes',
      dependants: 0,
      children: 0,
      housingType: 'hdb' as const,
      mortgageBalance: 0,
      otherLoans: 12000,
      lifeCoverage: 100000,
      hospCoverage: 500000,
      ciCoverage: 50000,
      eciCoverage: 0,
      diMonthlyCoverage: 1200,
      mortgageCoverage: 0,
    },
  },
  {
    label: 'Mid-Career',
    data: {
      gender: 'female' as const,
      age: 35,
      retireAge: 65,
      salary: 6000,
      salaryGrowth: 3,
      bonus: 2,
      expenses: 3200,
      cpfOA: 50000,
      cpfSA: 20000,
      cpfMA: 25000,
      cash: 60000,
      investments: 90000,
      citizenship: 'SC',
      marital: 'married',
      firstTimer: 'yes',
      dependants: 2,
      children: 1,
      housingType: 'hdb' as const,
      mortgageBalance: 300000,
      otherLoans: 15000,
      lifeCoverage: 500000,
      hospCoverage: 1000000,
      ciCoverage: 150000,
      eciCoverage: 50000,
      diMonthlyCoverage: 2800,
      mortgageCoverage: 220000,
    },
  },
  {
    label: 'Senior',
    data: {
      gender: 'male' as const,
      age: 45,
      retireAge: 65,
      salary: 9000,
      salaryGrowth: 2,
      bonus: 3,
      expenses: 4500,
      cpfOA: 120000,
      cpfSA: 80000,
      cpfMA: 63000,
      cash: 120000,
      investments: 250000,
      citizenship: 'SC',
      marital: 'married',
      firstTimer: 'no',
      dependants: 3,
      children: 2,
      housingType: 'condo' as const,
      mortgageBalance: 450000,
      otherLoans: 10000,
      lifeCoverage: 900000,
      hospCoverage: 1500000,
      ciCoverage: 300000,
      eciCoverage: 100000,
      diMonthlyCoverage: 4500,
      mortgageCoverage: 350000,
    },
  },
  {
    label: 'High Income',
    data: {
      gender: 'female' as const,
      age: 35,
      retireAge: 65,
      salary: 15000,
      salaryGrowth: 5,
      bonus: 3,
      expenses: 7000,
      cpfOA: 100000,
      cpfSA: 50000,
      cpfMA: 63000,
      cash: 250000,
      investments: 500000,
      citizenship: 'SC',
      marital: 'married',
      firstTimer: 'no',
      dependants: 2,
      children: 2,
      housingType: 'landed' as const,
      mortgageBalance: 900000,
      otherLoans: 40000,
      lifeCoverage: 1500000,
      hospCoverage: 1500000,
      ciCoverage: 500000,
      eciCoverage: 200000,
      diMonthlyCoverage: 9000,
      mortgageCoverage: 700000,
    },
  },
]

const TABS = ['Balance Growth', 'Total CPF', 'Contributions', 'Year Table']

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

function exportCSV(rows: ReturnType<typeof projectCPF>['rows']) {
  const header = 'Age,Year,OA,SA,MA,Total,Contribution,Interest,Cum.Contributions,Cum.Interest'
  const lines = rows.map((r) =>
    [
      r.age,
      r.year,
      Math.round(r.oa),
      Math.round(r.sa),
      Math.round(r.ma),
      Math.round(r.total),
      Math.round(r.annualContrib),
      Math.round(r.interestEarned),
      Math.round(r.cumContrib),
      Math.round(r.cumInterest),
    ].join(',')
  )
  const csv = [header, ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'cpf_projection.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function CPFProjection() {
  const p = useProfileStore()
  const c = useCPFStore()
  const [activeTab, setActiveTab] = useState(c.activeTab || 'Balance Growth')
  const [scenarioName, setScenarioName] = useState('')

  const result = useMemo(
    () =>
      projectCPF({
        age: p.age,
        retireAge: p.retireAge,
        salary: p.salary,
        salaryGrowth: p.salaryGrowth,
        bonus: p.bonus,
        vcma: c.vcma,
        cpfOA: p.cpfOA,
        cpfSA: p.cpfSA,
        cpfMA: p.cpfMA,
        togGrowth: c.togGrowth,
        togInflation: c.togInflation,
        togExtra: c.togExtra,
      }),
    [p, c]
  )

  const saveScenario = () => {
    const name = scenarioName.trim() || `Age ${p.age} · S$${Math.round(p.salary / 1000)}K/yr`
    c.saveScenario(name, {
      age: p.age,
      retireAge: p.retireAge,
      salary: p.salary,
      salaryGrowth: p.salaryGrowth,
      bonus: p.bonus,
      vcma: c.vcma,
      cpfOA: p.cpfOA,
      cpfSA: p.cpfSA,
      cpfMA: p.cpfMA,
    })
    setScenarioName('')
  }

  const loadScenario = (sc: CPFScenario) => {
    const d = sc.params as ReturnType<typeof p.set> & Record<string, number>
    p.set({
      age: Number(d.age),
      retireAge: Number(d.retireAge),
      salary: Number(d.salary),
      salaryGrowth: Number(d.salaryGrowth),
      bonus: Number(d.bonus),
      cpfOA: Number(d.cpfOA),
      cpfSA: Number(d.cpfSA),
      cpfMA: Number(d.cpfMA),
    })
    c.set({ vcma: Number(d.vcma) || 0 })
  }

  const ages = result.rows.map((r) => String(r.age))

  const balanceChartData = {
    labels: ages,
    datasets: [
      {
        label: 'OA',
        data: result.rows.map((r) => r.oa),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
      },
      {
        label: 'SA',
        data: result.rows.map((r) => r.sa),
        borderColor: '#14b8a6',
        backgroundColor: 'rgba(20,184,166,0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
      },
      {
        label: 'MA',
        data: result.rows.map((r) => r.ma),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245,158,11,0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
      },
    ],
  }

  const totalChartData = {
    labels: ages,
    datasets: [
      { label: 'OA', data: result.rows.map((r) => r.oa), backgroundColor: '#3b82f6', stack: 'cpf' },
      { label: 'SA', data: result.rows.map((r) => r.sa), backgroundColor: '#14b8a6', stack: 'cpf' },
      { label: 'MA', data: result.rows.map((r) => r.ma), backgroundColor: '#f59e0b', stack: 'cpf' },
    ],
  }

  const contribChartData = {
    labels: ages,
    datasets: [
      {
        label: 'Annual Contribution',
        data: result.rows.map((r) => r.annualContrib),
        backgroundColor: '#f97316',
      },
      {
        label: 'Interest Earned',
        data: result.rows.map((r) => r.interestEarned),
        backgroundColor: '#10b981',
      },
    ],
  }

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

  const inputPanel = (
    <div>
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
          CPF Projection
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
          Year-by-year CPF analysis
        </div>
      </div>

      {/* Presets */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: 7,
          }}
        >
          Quick Presets
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
          {CPF_PRESETS.map((pr) => (
            <button
              key={pr.label}
              onClick={() => {
                p.set(pr.data)
                c.set({ vcma: 0 })
              }}
              style={{
                padding: '5px 8px',
                borderRadius: 6,
                border: '1px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-text-secondary)',
                fontSize: 12,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              {pr.label}
            </button>
          ))}
        </div>
      </div>

      {/* Shared profile (personal + income + CPF sections) */}
      <ProfilePanel showAssets={false} collapsedSections={['assets', 'property']} />

      {/* CPF-specific options */}
      <div style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ padding: '10px 14px 12px' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginBottom: 8,
            }}
          >
            CPF Options
          </div>
          <label
            style={{
              display: 'block',
              fontSize: 12,
              color: 'var(--color-text-secondary)',
              marginBottom: 3,
              fontWeight: 500,
            }}
          >
            Monthly VCMA (S$)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <input
              type="range"
              min={0}
              max={5000}
              step={50}
              value={c.vcma}
              onChange={(e) => c.set({ vcma: Number(e.target.value) })}
              style={{ flex: 1 }}
            />
            <span
              style={{
                minWidth: 42,
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-text)',
                textAlign: 'right',
              }}
            >
              S${c.vcma.toLocaleString()}
            </span>
          </div>
          <Toggle
            label="Salary growth enabled"
            checked={c.togGrowth}
            onChange={(v) => c.set({ togGrowth: v })}
          />
          <Toggle
            label="BHS / FRS annual inflation"
            checked={c.togInflation}
            onChange={(v) => c.set({ togInflation: v })}
          />
          <Toggle
            label="Extra +1% CPF interest"
            checked={c.togExtra}
            onChange={(v) => c.set({ togExtra: v })}
          />
        </div>
      </div>

      {/* Save scenario */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: 7,
          }}
        >
          Scenarios
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            placeholder="Name (optional)"
            style={{
              flex: 1,
              padding: '4px 8px',
              borderRadius: 6,
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
              fontSize: 12,
            }}
          />
          <button
            onClick={saveScenario}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid var(--color-accent)',
              background: 'transparent',
              color: 'var(--color-accent)',
              fontSize: 12,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Save
          </button>
        </div>
        {c.savedScenarios.length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {c.savedScenarios.map((sc) => (
              <div key={sc.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={() => loadScenario(sc)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 12,
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-secondary)',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  {sc.name}
                </button>
                <button
                  onClick={() => c.deleteScenario(sc.id)}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'var(--color-border)',
                    color: 'var(--color-text-muted)',
                    fontSize: 10,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export CSV */}
      <div style={{ padding: '10px 14px' }}>
        <button
          onClick={() => exportCSV(result.rows)}
          style={{
            fontSize: 12,
            padding: '5px 12px',
            borderRadius: 6,
            border: '1px solid var(--color-border)',
            background: 'transparent',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Export CSV
        </button>
      </div>
    </div>
  )

  return (
    <CalcLayout inputPanel={inputPanel}>
      <div style={{ padding: '24px 28px' }}>
        {/* 6 Metric Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            marginBottom: 22,
          }}
        >
          <MetricCard
            label="Total at Retirement"
            value={fmtSGDCompact(result.retirementTotal)}
            subvalue={`Age ${p.retireAge}`}
            accent="#f97316"
          />
          <MetricCard
            label="Balance at Age 55"
            value={fmtSGDCompact(result.balance55)}
            subvalue="OA+SA+MA"
            accent="#3b82f6"
          />
          <MetricCard
            label="Total Contributions"
            value={fmtSGDCompact(result.totalContrib)}
            subvalue="Employer + Employee"
            accent="#14b8a6"
          />
          <MetricCard
            label="Interest Earned"
            value={fmtSGDCompact(result.totalInterest)}
            subvalue={
              result.totalContrib > 0
                ? `${fmtPct((result.totalInterest / result.totalContrib) * 100, 0)} of contributions`
                : '—'
            }
            accent="#10b981"
          />
          <MetricCard
            label="CPF FRS Reached"
            value={result.milestones.frsAge ? `Age ${result.milestones.frsAge}` : 'Not reached'}
            subvalue="Special Account"
            accent={result.milestones.frsAge ? '#a855f7' : 'var(--color-text-muted)'}
          />
          <MetricCard
            label="CPF BHS Reached"
            value={result.milestones.bhsAge ? `Age ${result.milestones.bhsAge}` : 'Not reached'}
            subvalue="Medisave Account"
            accent={result.milestones.bhsAge ? '#f59e0b' : 'var(--color-text-muted)'}
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

        {/* Chart / Table content */}
        {activeTab === 'Balance Growth' && (
          <div style={{ height: 380 }}>
            <Line data={balanceChartData} options={chartOptions} />
          </div>
        )}

        {activeTab === 'Total CPF' && (
          <div style={{ height: 380 }}>
            <Bar
              data={totalChartData}
              options={{
                ...chartOptions,
                scales: {
                  ...chartOptions.scales,
                  x: { stacked: true, grid: { display: false } },
                  y: { stacked: true, ticks: chartOptions.scales.y.ticks },
                },
              }}
            />
          </div>
        )}

        {activeTab === 'Contributions' && (
          <div style={{ height: 380 }}>
            <Bar data={contribChartData} options={chartOptions} />
          </div>
        )}

        {activeTab === 'Year Table' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'var(--color-surface)' }}>
                  {[
                    'Age',
                    'Year',
                    'OA',
                    'SA',
                    'MA',
                    'Total',
                    'Contribution',
                    'Interest',
                    'Cum. Contrib',
                    'Cum. Interest',
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
                {result.rows.map((r) => {
                  const isMilestone = r.milestone || r.age === p.retireAge
                  return (
                    <tr
                      key={r.age}
                      style={{ background: isMilestone ? 'rgba(59,130,246,0.06)' : 'transparent' }}
                    >
                      <td
                        style={{
                          padding: '6px 10px',
                          textAlign: 'right',
                          fontWeight: isMilestone ? 700 : 400,
                          color: isMilestone ? '#3b82f6' : 'var(--color-text)',
                        }}
                      >
                        {r.age}
                        {r.milestone && (
                          <span
                            style={{
                              marginLeft: 5,
                              fontSize: 9,
                              background: 'rgba(59,130,246,0.18)',
                              color: '#3b82f6',
                              padding: '1px 5px',
                              borderRadius: 8,
                            }}
                          >
                            {r.milestone}
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: '6px 10px',
                          textAlign: 'right',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        {r.year}
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: '#3b82f6' }}>
                        {fmtSGD(r.oa)}
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: '#14b8a6' }}>
                        {fmtSGD(r.sa)}
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: '#f59e0b' }}>
                        {fmtSGD(r.ma)}
                      </td>
                      <td
                        style={{
                          padding: '6px 10px',
                          textAlign: 'right',
                          fontWeight: 600,
                          color: 'var(--color-text)',
                        }}
                      >
                        {fmtSGD(r.total)}
                      </td>
                      <td
                        style={{
                          padding: '6px 10px',
                          textAlign: 'right',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        {fmtSGD(r.annualContrib)}
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: '#10b981' }}>
                        {fmtSGD(r.interestEarned)}
                      </td>
                      <td
                        style={{
                          padding: '6px 10px',
                          textAlign: 'right',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        {fmtSGD(r.cumContrib)}
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: '#10b981' }}>
                        {fmtSGD(r.cumInterest)}
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
