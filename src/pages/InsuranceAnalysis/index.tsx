import { useMemo } from 'react'
import CalcLayout from '../../layouts/CalcLayout'
import ProfilePanel from '../../components/ProfilePanel'
import MetricCard from '../../components/MetricCard'
import { useProfileStore } from '../../store/profileStore'
import { analyzeInsurance } from '../../engines/insuranceEngine'
import { fmtPct, fmtSGD, fmtSGDCompact } from '../../utils/format'

function priorityColor(priority: 'high' | 'medium' | 'low'): string {
  if (priority === 'high') return 'var(--color-red)'
  if (priority === 'medium') return 'var(--color-accent-amber)'
  return 'var(--color-accent-jade)'
}

export default function InsuranceAnalysis() {
  const p = useProfileStore()

  const result = useMemo(
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

  const statusColor =
    result.insuranceHealthScore >= 80
      ? 'var(--color-accent-jade)'
      : result.insuranceHealthScore >= 60
        ? 'var(--color-accent-amber)'
        : 'var(--color-red)'

  const inputPanel = (
    <div>
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
          Insurance Analysis
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
          SG coverage adequacy and gap analysis
        </div>
      </div>

      <ProfilePanel
        showAssets={true}
        showInsuranceProfile={true}
        collapsedSections={['property']}
      />
    </div>
  )

  return (
    <CalcLayout inputPanel={inputPanel}>
      <div style={{ padding: '28px 32px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--color-text)',
              marginBottom: 4,
              letterSpacing: -0.5,
            }}
          >
            Insurance Analysis Dashboard
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            Uses your shared profile to evaluate life, hospitalisation, CI, disability, mortgage,
            and emergency-fund protection.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 12,
            marginBottom: 28,
          }}
        >
          <MetricCard
            label="Insurance Health Score"
            value={fmtPct(result.insuranceHealthScore, 0)}
            subvalue={`Risk ${result.riskBand}`}
            accent={statusColor}
          />
          <MetricCard
            label="Life Coverage Gap"
            value={fmtSGDCompact(result.lifeGap)}
            subvalue={`${fmtPct((result.lifeGap / Math.max(1, result.lifeNeed)) * 100, 0)} shortfall`}
            accent="var(--color-red)"
          />
          <MetricCard
            label="Hospital Gap"
            value={fmtSGDCompact(result.hospitalGap)}
            subvalue={`Need ${fmtSGDCompact(result.hospitalNeed)}`}
            accent="var(--color-accent-blue)"
          />
          <MetricCard
            label="CI + Early CI Gap"
            value={fmtSGDCompact(result.ciGap + result.eciGap)}
            subvalue={`CI ${fmtSGDCompact(result.ciGap)} · ECI ${fmtSGDCompact(result.eciGap)}`}
            accent="var(--color-accent-amber)"
          />
          <MetricCard
            label="Disability Income Gap"
            value={`S$${fmtSGD(result.diGapMonthly)}/mth`}
            subvalue={`Need S$${fmtSGD(result.diNeedMonthly)}/mth`}
            accent="var(--color-accent-teal)"
          />
          <MetricCard
            label="Emergency Fund"
            value={`${result.emergencyMonths.toFixed(1)} months`}
            subvalue={`Target 6 months (gap ${fmtSGDCompact(result.emergencyGap)})`}
            accent="var(--color-accent-purple)"
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(300px, 2fr) minmax(260px, 1fr)',
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              padding: 18,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--color-text)',
                marginBottom: 10,
              }}
            >
              Coverage Gap Analysis
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {result.rows.map((row) => (
                <div key={row.id}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ fontSize: 12, color: 'var(--color-text)' }}>{row.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {fmtPct(row.pct, 0)} covered
                    </span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      background: 'var(--color-bg-secondary)',
                      borderRadius: 6,
                      overflow: 'hidden',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, row.pct)}%`,
                        height: '100%',
                        background: priorityColor(row.priority),
                        borderRadius: 6,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: 3,
                      fontSize: 11,
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    <span>Need S${fmtSGD(row.need)}</span>
                    <span>Have S${fmtSGD(row.have)}</span>
                    <span
                      style={{
                        color: row.gap > 0 ? 'var(--color-red)' : 'var(--color-accent-jade)',
                      }}
                    >
                      Gap S${fmtSGD(row.gap)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              padding: 18,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--color-text)',
                marginBottom: 10,
              }}
            >
              Risk Snapshot
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: statusColor, lineHeight: 1 }}>
              {result.insuranceHealthScore}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>
              Insurance health score
            </div>

            <div style={{ marginTop: 16, fontSize: 12, color: 'var(--color-text-secondary)' }}>
              <div style={{ marginBottom: 6 }}>
                Income replacement: {result.incomeReplacementYears.toFixed(1)} years
              </div>
              <div style={{ marginBottom: 6 }}>
                Mortgage protection gap: S${fmtSGD(result.mortgageGap)}
              </div>
              <div style={{ marginBottom: 6 }}>
                Risk score: {result.riskScore}/100 ({result.riskBand})
              </div>
              <div>
                Priority focus:{' '}
                {result.recommendations[0]?.title ?? 'Maintain annual review cadence'}
              </div>
            </div>

            <div
              style={{
                marginTop: 14,
                padding: '10px 11px',
                borderRadius: 8,
                fontSize: 11,
                color: 'var(--color-text-muted)',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                lineHeight: 1.5,
              }}
            >
              Singapore guidance: prioritise Integrated Shield adequacy, CI/ECI layering, disability
              income replacement, and mortgage protection if dependants rely on your cash flow.
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            padding: 18,
          }}
        >
          <div
            style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 10 }}
          >
            Priority Recommendations
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {result.recommendations.map((rec, index) => (
              <div
                key={`${rec.title}-${index}`}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  background: 'var(--color-bg)',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: priorityColor(rec.priority),
                    marginBottom: 3,
                  }}
                >
                  {rec.priority.toUpperCase()} PRIORITY
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                  {rec.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 3 }}>
                  {rec.detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CalcLayout>
  )
}
