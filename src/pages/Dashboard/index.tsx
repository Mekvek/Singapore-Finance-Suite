import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import { Link } from 'react-router-dom'
import { useProfileStore } from '../../store/profileStore'
import { useFIREStore } from '../../store/fireStore'
import { useCPFStore } from '../../store/cpfStore'
import { useTaxStore } from '../../store/taxStore'
import { usePropertyStore } from '../../store/propertyStore'
import { projectFIRE } from '../../engines/fireEngine'
import { projectCPF } from '../../engines/cpfEngine'
import { calcMaxLoan } from '../../engines/propertyEngine'
import { calculateTax } from '../../engines/taxEngine'
import { analyzeInsurance } from '../../engines/insuranceEngine'
import { fmtSGDCompact, fmtSGD, fmtPct } from '../../utils/format'
import MetricCard from '../../components/MetricCard'

export default function Dashboard() {
  const p = useProfileStore()
  const f = useFIREStore()
  const c = useCPFStore()
  const t = useTaxStore()
  const ps = usePropertyStore()

  const fireResult = useMemo(
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

  const cpfResult = useMemo(
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

  const maxLoan = useMemo(() => calcMaxLoan(p.salary, 0), [p.salary])

  const taxResult = useMemo(() => {
    const annualSalary = p.salary * 12
    const annualBonus = p.salary * p.bonus
    const srsCap = p.citizenship === 'FG' ? 35700 : 15300

    return calculateTax({
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
    })
  }, [p, t])

  const insuranceResult = useMemo(
    () =>
      analyzeInsurance({
        age: p.age,
        retireAge: p.retireAge,
        salary: p.salary,
        expenses: p.expenses,
        dependants: p.dependants,
        children: p.children,
        housingType: p.housingType,
        mortgageBalance: p.mortgageBalance,
        otherLoans: p.otherLoans,
        cash: p.cash,
        investments: p.investments,
        lifeCoverage: p.lifeCoverage,
        hospCoverage: p.hospCoverage,
        ciCoverage: p.ciCoverage,
        eciCoverage: p.eciCoverage,
        diMonthlyCoverage: p.diMonthlyCoverage,
        mortgageCoverage: p.mortgageCoverage,
      }),
    [p]
  )

  // Net worth chart data (up to retireAge)
  const chartRows = fireResult.rows.filter((r) => r.age <= p.retireAge + 5)
  const chartLabels = chartRows.map((r) => r.age.toString())

  const nwChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Net Worth',
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
        data: chartRows.map(() => fireResult.fireNumber),
        borderColor: '#ef4444',
        borderDash: [6, 3],
        pointRadius: 0,
        fill: false,
        tension: 0,
      },
    ],
  }

  // CPF chart data
  const cpfChartData = {
    labels: cpfResult.rows.map((r) => r.age.toString()),
    datasets: [
      {
        label: 'OA',
        data: cpfResult.rows.map((r) => r.oa),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.07)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
      },
      {
        label: 'SA',
        data: cpfResult.rows.map((r) => r.sa),
        borderColor: '#14b8a6',
        backgroundColor: 'rgba(20,184,166,0.07)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
      },
      {
        label: 'MA',
        data: cpfResult.rows.map((r) => r.ma),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245,158,11,0.07)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
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

  // FIRE progress
  const fireProgress = Math.min(100, fireResult.fireProgressPct)
  const fireStatusLabel =
    fireProgress >= 100 ? 'FIRE Achieved!' : fireProgress >= 50 ? 'On Track' : 'Building'
  const fireStatusColor =
    fireProgress >= 100 ? '#f97316' : fireProgress >= 50 ? '#10b981' : '#3b82f6'

  // Property affordability
  const maxHdbAfford = maxLoan.maxHdbLoan / (1 - 0.2)
  const maxPrivAfford = maxLoan.maxBankLoan / (1 - 0.25)

  const cardAccents = ['#f97316', '#10b981', '#14b8a6', '#3b82f6', '#a855f7']

  return (
    <div style={{ padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--color-text)',
                marginBottom: 4,
                letterSpacing: -0.5,
              }}
            >
              Financial Overview
            </h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              Age {p.age} · Retire at {p.retireAge} · Salary S${fmtSGD(p.salary)}/mth
            </p>
          </div>
          {/* Read-only profile strip to avoid duplicate input entry points */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {[
              { label: 'Salary', value: `S$${fmtSGD(p.salary)}/mth` },
              { label: 'Expenses', value: `S$${fmtSGD(p.expenses)}/mth` },
              { label: 'Retire Age', value: `Age ${p.retireAge}` },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: 'var(--color-text-muted)',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  padding: '4px 8px',
                }}
              >
                <span>{item.label}</span>
                <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 12,
          marginBottom: 28,
        }}
      >
        <MetricCard
          label="Net Worth Today"
          value={fmtSGDCompact(fireResult.currentNetWorth)}
          subvalue={f.includeCPF ? 'incl. CPF' : 'excl. CPF'}
          accent={cardAccents[0]}
        />
        <MetricCard
          label="FIRE Progress"
          value={fmtPct(fireProgress, 0)}
          subvalue={fireStatusLabel}
          accent={fireStatusColor}
        />
        <MetricCard
          label="FIRE Age"
          value={fireResult.fireAge ? `Age ${fireResult.fireAge}` : 'Not reached'}
          subvalue={`Need ${fmtSGDCompact(fireResult.fireNumber)}`}
          accent={cardAccents[2]}
        />
        <MetricCard
          label="CPF at Retirement"
          value={fmtSGDCompact(cpfResult.retirementTotal)}
          subvalue={`Age ${p.retireAge}`}
          accent={cardAccents[3]}
        />
        <MetricCard
          label="Max HDB Budget"
          value={fmtSGDCompact(maxHdbAfford)}
          subvalue={`Bank: ${fmtSGDCompact(maxPrivAfford)}`}
          accent={cardAccents[4]}
        />
        {ps.ownsProperty && (
          <MetricCard
            label="Property Value Today"
            value={fmtSGDCompact(ps.ownedPropertyValue)}
            subvalue={`+${ps.ownedPropertyAppreciation}% p.a.`}
            accent="#a855f7"
          />
        )}
      </div>

      {/* FIRE Progress Bar */}
      <div
        style={{
          marginBottom: 28,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          padding: '16px 20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
            FIRE Progress
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 20,
              background: `${fireStatusColor}22`,
              color: fireStatusColor,
            }}
          >
            {fireStatusLabel}
          </span>
        </div>
        <div
          style={{
            height: 10,
            background: 'var(--color-border)',
            borderRadius: 5,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${fireProgress}%`,
              background: `linear-gradient(90deg, ${fireStatusColor}, #f97316)`,
              borderRadius: 5,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 6,
            fontSize: 11,
            color: 'var(--color-text-muted)',
          }}
        >
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Two charts side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            padding: '16px 20px',
          }}
        >
          <div
            style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 12 }}
          >
            Net Worth Projection
          </div>
          <div style={{ height: 220 }}>
            <Line data={nwChartData} options={chartOptions} />
          </div>
        </div>

        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            padding: '16px 20px',
          }}
        >
          <div
            style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 12 }}
          >
            CPF Balance Growth
          </div>
          <div style={{ height: 220 }}>
            <Line
              data={cpfChartData}
              options={{ ...chartOptions, plugins: { ...chartOptions.plugins } }}
            />
          </div>
        </div>
      </div>

      {/* Key Milestones + Property Affordability */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Milestones */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            padding: '16px 20px',
          }}
        >
          <div
            style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 14 }}
          >
            Key Milestones
          </div>
          {[
            { label: 'CPF BRS unlocked', age: 55, badge: '#3b82f6' },
            {
              label: 'CPF BHS reached',
              age: cpfResult.milestones.bhsAge ?? null,
              badge: '#f59e0b',
            },
            {
              label: 'CPF FRS reached',
              age: cpfResult.milestones.frsAge ?? null,
              badge: '#14b8a6',
            },
            { label: 'FIRE crossover', age: fireResult.fireAge, badge: '#f97316' },
            { label: 'Retirement target', age: p.retireAge, badge: '#10b981' },
          ].map((m) => (
            <div
              key={m.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '7px 0',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{m.label}</span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '2px 10px',
                  borderRadius: 20,
                  background: m.age ? `${m.badge}22` : 'var(--color-border)',
                  color: m.age ? m.badge : 'var(--color-text-muted)',
                }}
              >
                {m.age ? `Age ${m.age}` : 'Not reached'}
              </span>
            </div>
          ))}
        </div>

        {/* Property Affordability */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            padding: '16px 20px',
          }}
        >
          <div
            style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 14 }}
          >
            Property Affordability
          </div>
          {[
            {
              label: 'Max HDB Loan (MSR 30%)',
              value: fmtSGDCompact(maxLoan.maxHdbLoan),
              color: '#10b981',
            },
            { label: 'Max HDB Property', value: fmtSGDCompact(maxHdbAfford), color: '#14b8a6' },
            {
              label: 'Max Bank Loan (TDSR 55%)',
              value: fmtSGDCompact(maxLoan.maxBankLoan),
              color: '#3b82f6',
            },
            {
              label: 'Max Private Property',
              value: fmtSGDCompact(maxPrivAfford),
              color: '#a855f7',
            },
            { label: 'CPF OA Available', value: `S$${fmtSGD(p.cpfOA)}`, color: '#f59e0b' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '7px 0',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                {item.label}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value}</span>
            </div>
          ))}
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link
              to="/property"
              style={{
                fontSize: 12,
                padding: '5px 12px',
                borderRadius: 6,
                background: 'rgba(59,130,246,0.12)',
                color: '#3b82f6',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Open Property Calculator →
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation shortcuts */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          marginBottom: 16,
        }}
      >
        {[
          {
            to: '/fire',
            label: 'FIRE Deep Dive',
            sub: 'Full FIRE analysis with all asset classes',
            color: '#f97316',
          },
          {
            to: '/cpf',
            label: 'CPF Analysis',
            sub: 'Year-by-year CPF projection with charts',
            color: '#14b8a6',
          },
          {
            to: '/property',
            label: 'Property Calculator',
            sub: 'BTO, Resale, Private & more',
            color: '#3b82f6',
          },
          {
            to: '/tax',
            label: 'Income Tax Estimator',
            sub: 'Tax payable, reliefs and bracket analysis',
            color: '#14b8a6',
          },
          {
            to: '/insurance',
            label: 'Insurance Analysis',
            sub: 'Coverage adequacy, gaps and priorities',
            color: '#ef4444',
          },
        ].map((card) => (
          <Link key={card.to} to={card.to} style={{ textDecoration: 'none' }}>
            <div
              style={{
                background: 'var(--color-surface)',
                border: `1px solid var(--color-border)`,
                borderLeft: `3px solid ${card.color}`,
                borderRadius: 10,
                padding: '14px 16px',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: card.color, marginBottom: 3 }}>
                {card.label}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{card.sub}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Tax + Insurance snapshots */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            padding: '16px 20px',
          }}
        >
          <div
            style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 12 }}
          >
            Income Tax Snapshot
          </div>
          {[
            { label: 'Tax Payable', value: `S$${fmtSGD(taxResult.taxResult.tax)}` },
            {
              label: 'Chargeable Income',
              value: `S$${fmtSGD(taxResult.chargeableIncome)}`,
            },
            {
              label: 'Effective Tax Rate',
              value: fmtPct(taxResult.effectiveRate * 100, 2),
            },
            {
              label: 'Monthly Take-Home',
              value: `S$${fmtSGD(taxResult.monthlyTakeHome)}`,
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '7px 0',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                {item.label}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#14b8a6' }}>{item.value}</span>
            </div>
          ))}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 6 }}>
              Relief Utilisation vs S$80,000 Cap
            </div>
            <div
              style={{
                height: 8,
                background: 'var(--color-border)',
                borderRadius: 6,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, (taxResult.reliefResult.cappedTotal / 80000) * 100)}%`,
                  height: '100%',
                  background: '#14b8a6',
                  borderRadius: 6,
                }}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            padding: '16px 20px',
          }}
        >
          <div
            style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 12 }}
          >
            Insurance Snapshot
          </div>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}
          >
            <MetricCard
              label="Health Score"
              value={`${insuranceResult.insuranceHealthScore}`}
              subvalue={`Risk ${insuranceResult.riskBand}`}
              accent={
                insuranceResult.insuranceHealthScore >= 80
                  ? '#10b981'
                  : insuranceResult.insuranceHealthScore >= 60
                    ? '#f59e0b'
                    : '#ef4444'
              }
            />
            <MetricCard
              label="Total Coverage Gap"
              value={fmtSGDCompact(
                insuranceResult.lifeGap +
                  insuranceResult.ciGap +
                  insuranceResult.eciGap +
                  insuranceResult.mortgageGap +
                  insuranceResult.emergencyGap
              )}
              subvalue={`DI Gap S$${fmtSGD(insuranceResult.diGapMonthly)}/mth`}
              accent="#ef4444"
            />
          </div>
          {[...insuranceResult.rows]
            .filter((r) => r.id !== 'emergency')
            .sort((a, b) => b.gap - a.gap)
            .slice(0, 3)
            .map((row) => (
              <div key={row.id} style={{ marginBottom: 9 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 3,
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: 'var(--color-text-secondary)' }}>{row.label}</span>
                  <span style={{ color: 'var(--color-text-muted)' }}>
                    {fmtPct(row.pct, 0)} covered
                  </span>
                </div>
                <div
                  style={{
                    height: 7,
                    background: 'var(--color-border)',
                    borderRadius: 6,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, row.pct)}%`,
                      height: '100%',
                      background:
                        row.priority === 'high'
                          ? '#ef4444'
                          : row.priority === 'medium'
                            ? '#f59e0b'
                            : '#10b981',
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
        All calculations are estimates based on 2024–2025 CPF rules and assumptions. Not financial
        advice.
      </div>
    </div>
  )
}
