import { useMemo, useState } from 'react'
import { Line } from 'react-chartjs-2'
import CalcLayout from '../../layouts/CalcLayout'
import ProfilePanel from '../../components/ProfilePanel'
import MetricCard from '../../components/MetricCard'
import { useProfileStore } from '../../store/profileStore'
import { usePropertyStore } from '../../store/propertyStore'
import {
  calcBTO,
  calcResale,
  calcPrivate,
  calcCompare,
  calcDashboard,
  calcMaxLoan,
  affordClass,
  type PropertyProfile,
} from '../../engines/propertyEngine'
import { fmtSGD, fmtSGDCompact, fmtPct } from '../../utils/format'
import { useNumberTextInputState } from '../../hooks/useNumberInputState'

const PROP_TABS = ['HDB BTO', 'HDB Resale', 'Private', 'Compare', 'Financial Dashboard']

function NF({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max,
  prefix,
  suffix,
  type = 'number',
  options,
}: {
  label: string
  value: number | string
  onChange: (v: string) => void
  step?: number
  min?: number
  max?: number
  prefix?: string
  suffix?: string
  type?: string
  options?: Array<{ value: string; label: string }>
}) {
  const { text, handleChange, handleBlur } = useNumberTextInputState(value, onChange)
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
        {options ? (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              flex: 1,
              padding: '5px 8px',
              borderRadius: 6,
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
              fontSize: 13,
            }}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : type === 'range' ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              style={{ flex: 1 }}
            />
            <span
              style={{
                minWidth: 36,
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-text)',
                textAlign: 'right',
              }}
            >
              {value}
              {suffix}
            </span>
          </div>
        ) : (
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
        )}
        {suffix && type !== 'range' && (
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{suffix}</span>
        )}
      </div>
    </div>
  )
}

function StatGrid({ items }: { items: Array<{ label: string; value: string; color?: string }> }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 10,
        marginBottom: 16,
      }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            padding: '10px 12px',
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>
            {item.label}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: item.color ?? 'var(--color-text)' }}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  )
}

function Banner({ text, level }: { text: string; level: 'good' | 'warn' | 'info' }) {
  const colors = {
    good: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.3)', text: '#10b981' },
    warn: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', text: '#ef4444' },
    info: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)', text: '#3b82f6' },
  }
  const c = colors[level]
  return (
    <div
      style={{
        padding: '7px 12px',
        borderRadius: 6,
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        fontSize: 12,
        marginBottom: 6,
      }}
    >
      {text}
    </div>
  )
}

export default function PropertyCalc() {
  const p = useProfileStore()
  const ps = usePropertyStore()
  const [activeTab, setActiveTab] = useState(ps.activeTab || 'HDB BTO')

  // Build profile object for engines
  const profile: PropertyProfile = useMemo(
    () => ({
      age: p.age,
      income: p.salary,
      cpfOA: p.cpfOA,
      cash: p.cash,
      citizenship: p.citizenship,
      marital: p.marital,
      firstTimer: p.firstTimer,
      existingLoans: 0,
      expenses: p.expenses,
      msrPct: ps.setMsr,
      tdsrPct: ps.setTdsr,
      hdbLtv: ps.setHdbLtv,
      bankLtv: ps.setLtv,
    }),
    [p, ps]
  )

  const btoResult = useMemo(
    () =>
      calcBTO(profile, {
        flatType: ps.btoFlatType,
        estate: ps.btoEstate,
        price: ps.btoPrice,
        tenure: ps.btoTenure,
        rate: ps.btoRate,
        phg: ps.btoPHG === 'yes',
      }),
    [profile, ps]
  )
  const rsResult = useMemo(
    () =>
      calcResale(profile, {
        price: ps.rsPrice,
        valuation: ps.rsVal,
        lease: ps.rsLease,
        flatType: ps.rsFlatType,
        tenure: ps.rsTenure,
        rate: ps.rsRate,
        phg: ps.rsPHG === 'yes',
      }),
    [profile, ps]
  )
  const pvResult = useMemo(
    () =>
      calcPrivate(profile, {
        type: ps.pvType,
        price: ps.pvPrice,
        tenure: ps.pvTenure,
        rate: ps.pvRate,
        existingProps: ps.pvExisting,
        rvbRent: ps.rvbRent,
        rvbAppreciation: ps.rvbAppreciation,
        rvbYears: ps.rvbYears,
      }),
    [profile, ps]
  )
  const cmpResult = useMemo(
    () =>
      calcCompare(profile, {
        btoPrice: ps.cmpBtoPrice,
        btoTenure: ps.cmpBtoTenure,
        btoRate: ps.cmpBtoRate,
        rsPrice: ps.cmpRsPrice,
        rsTenure: ps.cmpRsTenure,
        rsRate: ps.cmpRsRate,
        pvPrice: ps.cmpPvPrice,
        pvTenure: ps.cmpPvTenure,
        pvRate: ps.cmpPvRate,
      }),
    [profile, ps]
  )
  const maxLoan = useMemo(
    () => calcMaxLoan(p.salary, 0, ps.setMsr, ps.setTdsr, ps.setHdbLtv, ps.setLtv),
    [p.salary, ps]
  )

  const activeResult =
    activeTab === 'HDB BTO' ? btoResult : activeTab === 'HDB Resale' ? rsResult : pvResult
  const activeMp = 'monthlyMortgage' in activeResult ? activeResult.monthlyMortgage : 0
  const activeTdsr =
    'tdsrPct' in activeResult
      ? activeResult.tdsrPct
      : 'msrPct' in activeResult
        ? activeResult.msrPct
        : 0

  const dashResult = useMemo(() => {
    const mp =
      activeTab === 'HDB BTO'
        ? btoResult.monthlyMortgage
        : activeTab === 'HDB Resale'
          ? rsResult.monthlyMortgage
          : pvResult.monthlyMortgage
    const price =
      activeTab === 'HDB BTO' ? ps.btoPrice : activeTab === 'HDB Resale' ? ps.rsPrice : ps.pvPrice
    const loan =
      activeTab === 'HDB BTO'
        ? btoResult.loan
        : activeTab === 'HDB Resale'
          ? rsResult.loan
          : pvResult.loan
    return calcDashboard(profile, {
      propertyPrice: price,
      propertyType:
        activeTab === 'HDB BTO' ? 'bto' : activeTab === 'HDB Resale' ? 'resale' : 'private',
      loan,
      monthlyMortgage: mp,
      upPrice: ps.upPrice,
      upLoan: ps.upLoan,
      upCpfUsed: ps.upCpfUsed,
      upCpfYrs: ps.upCpfYrs,
      upSalePrice: ps.upSalePrice,
    })
  }, [profile, ps, btoResult, rsResult, pvResult, activeTab])

  // Amortization chart for Private tab
  const amortChartData = useMemo(() => {
    const yearly = pvResult.yearlyAmort
    return {
      labels: yearly.map((r) => `Yr ${r.year}`),
      datasets: [
        {
          label: 'Balance',
          data: yearly.map((r) => r.balance),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.08)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
        },
        {
          label: 'Principal Paid',
          data: yearly.map((r) => r.principal),
          borderColor: '#10b981',
          pointRadius: 0,
          fill: false,
          tension: 0.3,
        },
        {
          label: 'Interest Paid',
          data: yearly.map((r) => r.interest),
          borderColor: '#f97316',
          pointRadius: 0,
          fill: false,
          tension: 0.3,
        },
      ],
    }
  }, [pvResult])

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
          Property Calculator
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
          SG PropSmart Pro
        </div>
      </div>

      {/* Shared profile */}
      <ProfilePanel
        showPropertyProfile={true}
        showAssets={true}
        collapsedSections={['income', 'assets']}
      />

      {/* Tab-specific inputs */}
      {activeTab === 'HDB BTO' && (
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
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
            BTO Details
          </div>
          <NF
            label="Flat Type"
            value={ps.btoFlatType}
            onChange={(v) => ps.set({ btoFlatType: v })}
            options={[
              { value: '2room', label: '2-Room Flexi' },
              { value: '3room', label: '3-Room' },
              { value: '4room', label: '4-Room' },
              { value: '5room', label: '5-Room' },
              { value: 'ec', label: 'Executive Condo' },
            ]}
          />
          <NF
            label="Estate"
            value={ps.btoEstate}
            onChange={(v) => ps.set({ btoEstate: v })}
            options={[
              { value: 'mature', label: 'Mature Estate' },
              { value: 'nonmature', label: 'Non-Mature Estate' },
            ]}
          />
          <NF
            label="Purchase Price (S$)"
            value={ps.btoPrice}
            onChange={(v) => ps.set({ btoPrice: Number(v) })}
            step={5000}
            prefix="S$"
          />
          <NF
            label="Loan Tenure (years)"
            value={ps.btoTenure}
            onChange={(v) => ps.set({ btoTenure: Number(v) })}
            min={5}
            max={25}
            type="range"
            suffix="yr"
          />
          <NF
            label="Interest Rate (%)"
            value={ps.btoRate}
            onChange={(v) => ps.set({ btoRate: Number(v) })}
            step={0.05}
            min={1}
            max={6}
            suffix="%"
          />
          <NF
            label="Living Near Parents?"
            value={ps.btoPHG}
            onChange={(v) => ps.set({ btoPHG: v })}
            options={[
              { value: 'yes', label: 'Yes (PHG eligible)' },
              { value: 'no', label: 'No' },
            ]}
          />
        </div>
      )}

      {activeTab === 'HDB Resale' && (
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
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
            Resale Details
          </div>
          <NF
            label="Resale Price (S$)"
            value={ps.rsPrice}
            onChange={(v) => ps.set({ rsPrice: Number(v) })}
            step={5000}
            prefix="S$"
          />
          <NF
            label="HDB Valuation (S$)"
            value={ps.rsVal}
            onChange={(v) => ps.set({ rsVal: Number(v) })}
            step={5000}
            prefix="S$"
          />
          <NF
            label="Remaining Lease (years)"
            value={ps.rsLease}
            onChange={(v) => ps.set({ rsLease: Number(v) })}
            min={20}
            max={99}
          />
          <NF
            label="Flat Type"
            value={ps.rsFlatType}
            onChange={(v) => ps.set({ rsFlatType: v })}
            options={[
              { value: '3room', label: '3-Room' },
              { value: '4room', label: '4-Room' },
              { value: '5room', label: '5-Room' },
              { value: 'ea', label: 'EA/EM' },
            ]}
          />
          <NF
            label="Loan Tenure (years)"
            value={ps.rsTenure}
            onChange={(v) => ps.set({ rsTenure: Number(v) })}
            min={5}
            max={25}
            type="range"
            suffix="yr"
          />
          <NF
            label="Interest Rate (%)"
            value={ps.rsRate}
            onChange={(v) => ps.set({ rsRate: Number(v) })}
            step={0.05}
            min={1}
            max={6}
            suffix="%"
          />
          <NF
            label="Living Near Parents?"
            value={ps.rsPHG}
            onChange={(v) => ps.set({ rsPHG: v })}
            options={[
              { value: 'yes', label: 'Yes (PHG eligible)' },
              { value: 'no', label: 'No' },
            ]}
          />
        </div>
      )}

      {activeTab === 'Private' && (
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
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
            Private Property
          </div>
          <NF
            label="Property Type"
            value={ps.pvType}
            onChange={(v) => ps.set({ pvType: v })}
            options={[
              { value: 'new_condo', label: 'New Launch Condo' },
              { value: 'resale_condo', label: 'Resale Condo' },
              { value: 'landed', label: 'Landed' },
            ]}
          />
          <NF
            label="Purchase Price (S$)"
            value={ps.pvPrice}
            onChange={(v) => ps.set({ pvPrice: Number(v) })}
            step={10000}
            prefix="S$"
          />
          <NF
            label="Loan Tenure (years)"
            value={ps.pvTenure}
            onChange={(v) => ps.set({ pvTenure: Number(v) })}
            min={5}
            max={30}
            type="range"
            suffix="yr"
          />
          <NF
            label="Interest Rate (%)"
            value={ps.pvRate}
            onChange={(v) => ps.set({ pvRate: Number(v) })}
            step={0.05}
            min={1}
            max={7}
            suffix="%"
          />
          <NF
            label="Existing Properties Owned"
            value={ps.pvExisting}
            onChange={(v) => ps.set({ pvExisting: Number(v) })}
            options={[
              { value: '0', label: 'None (1st property)' },
              { value: '1', label: '1 existing' },
              { value: '2', label: '2+ existing' },
            ]}
          />
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              margin: '10px 0 8px',
            }}
          >
            Rent vs Buy
          </div>
          <NF
            label="Monthly Rent Comparable (S$)"
            value={ps.rvbRent}
            onChange={(v) => ps.set({ rvbRent: Number(v) })}
            step={100}
            prefix="S$"
          />
          <NF
            label="Expected Annual Appreciation (%)"
            value={ps.rvbAppreciation}
            onChange={(v) => ps.set({ rvbAppreciation: Number(v) })}
            step={0.5}
            suffix="%"
          />
          <NF
            label="Holding Period (years)"
            value={ps.rvbYears}
            onChange={(v) => ps.set({ rvbYears: Number(v) })}
            min={1}
            max={30}
          />
        </div>
      )}

      {activeTab === 'Compare' && (
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#10b981',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginBottom: 6,
            }}
          >
            HDB BTO
          </div>
          <NF
            label="Price (S$)"
            value={ps.cmpBtoPrice}
            onChange={(v) => ps.set({ cmpBtoPrice: Number(v) })}
            step={5000}
            prefix="S$"
          />
          <NF
            label="Tenure (yr)"
            value={ps.cmpBtoTenure}
            onChange={(v) => ps.set({ cmpBtoTenure: Number(v) })}
            min={5}
            max={25}
          />
          <NF
            label="Rate (%)"
            value={ps.cmpBtoRate}
            onChange={(v) => ps.set({ cmpBtoRate: Number(v) })}
            step={0.05}
            suffix="%"
          />
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#14b8a6',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              margin: '8px 0 6px',
            }}
          >
            HDB Resale
          </div>
          <NF
            label="Price (S$)"
            value={ps.cmpRsPrice}
            onChange={(v) => ps.set({ cmpRsPrice: Number(v) })}
            step={5000}
            prefix="S$"
          />
          <NF
            label="Tenure (yr)"
            value={ps.cmpRsTenure}
            onChange={(v) => ps.set({ cmpRsTenure: Number(v) })}
            min={5}
            max={25}
          />
          <NF
            label="Rate (%)"
            value={ps.cmpRsRate}
            onChange={(v) => ps.set({ cmpRsRate: Number(v) })}
            step={0.05}
            suffix="%"
          />
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#3b82f6',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              margin: '8px 0 6px',
            }}
          >
            Private
          </div>
          <NF
            label="Price (S$)"
            value={ps.cmpPvPrice}
            onChange={(v) => ps.set({ cmpPvPrice: Number(v) })}
            step={10000}
            prefix="S$"
          />
          <NF
            label="Tenure (yr)"
            value={ps.cmpPvTenure}
            onChange={(v) => ps.set({ cmpPvTenure: Number(v) })}
            min={5}
            max={30}
          />
          <NF
            label="Rate (%)"
            value={ps.cmpPvRate}
            onChange={(v) => ps.set({ cmpPvRate: Number(v) })}
            step={0.05}
            suffix="%"
          />
        </div>
      )}

      {activeTab === 'Financial Dashboard' && (
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
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
            HDB Upgrade Path
          </div>
          <NF
            label="Current HDB Price (S$)"
            value={ps.upPrice}
            onChange={(v) => ps.set({ upPrice: Number(v) })}
            step={5000}
            prefix="S$"
          />
          <NF
            label="Remaining Loan (S$)"
            value={ps.upLoan}
            onChange={(v) => ps.set({ upLoan: Number(v) })}
            step={5000}
            prefix="S$"
          />
          <NF
            label="CPF Used (S$)"
            value={ps.upCpfUsed}
            onChange={(v) => ps.set({ upCpfUsed: Number(v) })}
            step={5000}
            prefix="S$"
          />
          <NF
            label="CPF Years Accrued"
            value={ps.upCpfYrs}
            onChange={(v) => ps.set({ upCpfYrs: Number(v) })}
            min={0}
            max={30}
          />
          <NF
            label="Expected Sale Price (S$)"
            value={ps.upSalePrice}
            onChange={(v) => ps.set({ upSalePrice: Number(v) })}
            step={5000}
            prefix="S$"
          />
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              margin: '10px 0 8px',
            }}
          >
            Settings
          </div>
          <NF
            label="HDB Loan Rate (%)"
            value={ps.setHdbRate}
            onChange={(v) => ps.set({ setHdbRate: Number(v) })}
            step={0.05}
            suffix="%"
          />
          <NF
            label="MSR Limit (%)"
            value={ps.setMsr}
            onChange={(v) => ps.set({ setMsr: Number(v) })}
            min={20}
            max={35}
          />
          <NF
            label="TDSR Limit (%)"
            value={ps.setTdsr}
            onChange={(v) => ps.set({ setTdsr: Number(v) })}
            min={40}
            max={60}
          />
          <NF
            label="Bank LTV (%)"
            value={ps.setLtv}
            onChange={(v) => ps.set({ setLtv: Number(v) })}
            min={55}
            max={80}
          />
          <NF
            label="HDB LTV (%)"
            value={ps.setHdbLtv}
            onChange={(v) => ps.set({ setHdbLtv: Number(v) })}
            min={70}
            max={90}
          />
        </div>
      )}
    </div>
  )

  const afford = affordClass(activeTdsr)

  return (
    <CalcLayout inputPanel={inputPanel}>
      <div>
        {/* Live Summary Bar */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: 'var(--color-sidebar)',
            borderBottom: '1px solid var(--color-border)',
            padding: '10px 20px',
            display: 'flex',
            gap: 20,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {[
            { label: 'Monthly Income', value: `S$${fmtSGD(p.salary)}` },
            { label: 'Max HDB Loan', value: fmtSGDCompact(maxLoan.maxHdbLoan) },
            {
              label: 'Monthly Mortgage',
              value: `S$${fmtSGD(activeMp)}`,
              color: affordClass(activeTdsr).color,
            },
            { label: 'MSR / TDSR', value: fmtPct(activeTdsr, 1) },
            { label: 'Affordability', value: afford.label, color: afford.color },
          ].map((item) => (
            <div key={item.label}>
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: (item as { color?: string }).color ?? 'var(--color-text)',
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Tab navigation */}
        <div
          style={{
            display: 'flex',
            gap: 2,
            padding: '0 20px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          {PROP_TABS.map((t) => (
            <button
              key={t}
              onClick={() => {
                setActiveTab(t)
                ps.set({ activeTab: t })
              }}
              style={{
                padding: '10px 14px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: activeTab === t ? 600 : 400,
                color: activeTab === t ? '#3b82f6' : 'var(--color-text-muted)',
                borderBottom: activeTab === t ? '2px solid #3b82f6' : '2px solid transparent',
                marginBottom: -1,
                whiteSpace: 'nowrap',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div style={{ padding: '20px 24px' }}>
          {/* ── HDB BTO Tab ─────────────────────────────────────────────────── */}
          {activeTab === 'HDB BTO' && (
            <div>
              <StatGrid
                items={[
                  { label: 'Purchase Price', value: `S$${fmtSGD(ps.btoPrice)}` },
                  {
                    label: 'Total Grants',
                    value: `S$${fmtSGD(btoResult.grants.total)}`,
                    color: '#10b981',
                  },
                  { label: 'Effective Price', value: `S$${fmtSGD(btoResult.effectivePrice)}` },
                  {
                    label: 'HDB Loan (80%)',
                    value: `S$${fmtSGD(btoResult.loan)}`,
                    color: '#3b82f6',
                  },
                  { label: 'Downpayment (20%)', value: `S$${fmtSGD(btoResult.downpayment)}` },
                  { label: 'CPF Used', value: `S$${fmtSGD(btoResult.cpfUsed)}`, color: '#a855f7' },
                  {
                    label: 'Cash Required',
                    value: `S$${fmtSGD(btoResult.cashNeeded)}`,
                    color: btoResult.cashNeeded > p.cash ? '#ef4444' : '#10b981',
                  },
                  {
                    label: 'Monthly Mortgage',
                    value: `S$${fmtSGD(btoResult.monthlyMortgage)}`,
                    color: '#f97316',
                  },
                  { label: 'Total Interest', value: `S$${fmtSGD(btoResult.totalInterest)}` },
                  {
                    label: 'MSR',
                    value: fmtPct(btoResult.msrPct, 1),
                    color: btoResult.msrPct > ps.setMsr ? '#ef4444' : '#10b981',
                  },
                ]}
              />

              {/* MSR Progress Bar */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    color: 'var(--color-text-muted)',
                    marginBottom: 5,
                  }}
                >
                  <span>MSR — {fmtPct(btoResult.msrPct, 1)} of income</span>
                  <span>Limit: {ps.setMsr}%</span>
                </div>
                <div
                  style={{
                    height: 8,
                    background: 'var(--color-border)',
                    borderRadius: 4,
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, (btoResult.msrPct / ps.setMsr) * 100)}%`,
                      height: '100%',
                      background: btoResult.msrPct > ps.setMsr ? '#ef4444' : '#10b981',
                      borderRadius: 4,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: `${Math.min(100, ps.setMsr)}%`,
                      width: 2,
                      height: '100%',
                      background: 'var(--color-text-muted)',
                    }}
                  />
                </div>
              </div>

              {/* Grants */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    marginBottom: 8,
                  }}
                >
                  Grant Eligibility
                </div>
                {btoResult.grants.notes.map((n, i) => (
                  <Banner
                    key={i}
                    text={n}
                    level={
                      n.toLowerCase().includes('not') || n.toLowerCase().includes('exceed')
                        ? 'warn'
                        : 'good'
                    }
                  />
                ))}
                {btoResult.eligibilityNotes.map((n, i) => (
                  <Banner key={`e${i}`} text={n} level="warn" />
                ))}
              </div>

              {/* Progressive Payment Timeline */}
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    marginBottom: 8,
                  }}
                >
                  Progressive Payment Timeline
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--color-surface)' }}>
                      <th
                        style={{
                          padding: '7px 10px',
                          textAlign: 'left',
                          color: 'var(--color-text-muted)',
                          borderBottom: '1px solid var(--color-border)',
                        }}
                      >
                        Stage
                      </th>
                      <th
                        style={{
                          padding: '7px 10px',
                          textAlign: 'right',
                          color: 'var(--color-text-muted)',
                          borderBottom: '1px solid var(--color-border)',
                        }}
                      >
                        %
                      </th>
                      <th
                        style={{
                          padding: '7px 10px',
                          textAlign: 'right',
                          color: 'var(--color-text-muted)',
                          borderBottom: '1px solid var(--color-border)',
                        }}
                      >
                        Amount (S$)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {btoResult.progressivePayments.map((row) => (
                      <tr key={row.stage}>
                        <td style={{ padding: '6px 10px', color: 'var(--color-text-secondary)' }}>
                          {row.stage}
                        </td>
                        <td
                          style={{
                            padding: '6px 10px',
                            textAlign: 'right',
                            color: 'var(--color-text-muted)',
                          }}
                        >
                          {row.pct}%
                        </td>
                        <td
                          style={{
                            padding: '6px 10px',
                            textAlign: 'right',
                            fontWeight: 600,
                            color: 'var(--color-text)',
                          }}
                        >
                          {fmtSGD(row.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── HDB Resale Tab ──────────────────────────────────────────────── */}
          {activeTab === 'HDB Resale' && (
            <div>
              <StatGrid
                items={[
                  { label: 'Resale Price', value: `S$${fmtSGD(ps.rsPrice)}` },
                  { label: 'HDB Valuation', value: `S$${fmtSGD(ps.rsVal)}` },
                  {
                    label: 'COV (Cash Over Valuation)',
                    value: `S$${fmtSGD(rsResult.cov)}`,
                    color: rsResult.cov > 0 ? '#f97316' : '#10b981',
                  },
                  {
                    label: 'Total Grants',
                    value: `S$${fmtSGD(rsResult.grants.total)}`,
                    color: '#10b981',
                  },
                  { label: 'HDB Loan', value: `S$${fmtSGD(rsResult.loan)}`, color: '#3b82f6' },
                  { label: 'Downpayment', value: `S$${fmtSGD(rsResult.downpayment)}` },
                  { label: 'CPF Used', value: `S$${fmtSGD(rsResult.cpfUsed)}`, color: '#a855f7' },
                  {
                    label: 'Cash Required',
                    value: `S$${fmtSGD(rsResult.cashNeeded)}`,
                    color: rsResult.cashNeeded > p.cash ? '#ef4444' : '#10b981',
                  },
                  {
                    label: 'Monthly Mortgage',
                    value: `S$${fmtSGD(rsResult.monthlyMortgage)}`,
                    color: '#f97316',
                  },
                  { label: 'BSD', value: `S$${fmtSGD(rsResult.bsd)}` },
                ]}
              />

              {/* Lease Analysis */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    marginBottom: 8,
                  }}
                >
                  Lease Analysis
                </div>
                <StatGrid
                  items={[
                    { label: 'Remaining Lease', value: `${rsResult.leaseRisk.remaining} yrs` },
                    { label: 'Age at Lease Expiry', value: `${rsResult.leaseRisk.ageAtExpiry}` },
                    {
                      label: 'CPF Restriction',
                      value: rsResult.leaseRisk.cpfRestriction ? 'Yes' : 'No',
                      color: rsResult.leaseRisk.cpfRestriction ? '#ef4444' : '#10b981',
                    },
                    {
                      label: 'Lease Risk',
                      value: rsResult.leaseRisk.riskLevel.toUpperCase(),
                      color:
                        rsResult.leaseRisk.riskLevel === 'high'
                          ? '#ef4444'
                          : rsResult.leaseRisk.riskLevel === 'medium'
                            ? '#f59e0b'
                            : '#10b981',
                    },
                  ]}
                />
                <div
                  style={{
                    height: 8,
                    background: 'var(--color-border)',
                    borderRadius: 4,
                    overflow: 'hidden',
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      width: `${(rsResult.leaseRisk.remaining / 99) * 100}%`,
                      height: '100%',
                      background:
                        rsResult.leaseRisk.riskLevel === 'high'
                          ? '#ef4444'
                          : rsResult.leaseRisk.riskLevel === 'medium'
                            ? '#f59e0b'
                            : '#10b981',
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>

              {/* Grants */}
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    marginBottom: 8,
                  }}
                >
                  Grant Eligibility
                </div>
                {rsResult.grants.notes.map((n, i) => (
                  <Banner
                    key={i}
                    text={n}
                    level={
                      n.toLowerCase().includes('not') || n.toLowerCase().includes('exceed')
                        ? 'warn'
                        : 'good'
                    }
                  />
                ))}
                {rsResult.eligibilityNotes.map((n, i) => (
                  <Banner key={`e${i}`} text={n} level="warn" />
                ))}
              </div>
            </div>
          )}

          {/* ── Private Tab ─────────────────────────────────────────────────── */}
          {activeTab === 'Private' && (
            <div>
              <StatGrid
                items={[
                  { label: 'Purchase Price', value: `S$${fmtSGD(ps.pvPrice)}` },
                  { label: 'Bank Loan', value: `S$${fmtSGD(pvResult.loan)}`, color: '#3b82f6' },
                  { label: 'Downpayment', value: `S$${fmtSGD(pvResult.downpayment)}` },
                  { label: 'CPF Used', value: `S$${fmtSGD(pvResult.cpfUsed)}`, color: '#a855f7' },
                  { label: 'BSD', value: `S$${fmtSGD(pvResult.bsd)}` },
                  {
                    label: 'ABSD',
                    value: `S$${fmtSGD(pvResult.absd)}`,
                    color: pvResult.absd > 0 ? '#ef4444' : '#10b981',
                  },
                  { label: 'Legal Fees', value: `S$${fmtSGD(pvResult.legalFees)}` },
                  {
                    label: 'Total Upfront',
                    value: `S$${fmtSGD(pvResult.totalUpfront)}`,
                    color: '#f97316',
                  },
                  {
                    label: 'Monthly Mortgage',
                    value: `S$${fmtSGD(pvResult.monthlyMortgage)}`,
                    color: '#f97316',
                  },
                  {
                    label: 'TDSR',
                    value: fmtPct(pvResult.tdsrPct, 1),
                    color: pvResult.tdsrPct > 55 ? '#ef4444' : '#10b981',
                  },
                ]}
              />

              {pvResult.eligibilityNotes.map((n, i) => (
                <Banner key={i} text={n} level="warn" />
              ))}

              {/* Stress Test */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    marginBottom: 8,
                  }}
                >
                  Interest Rate Stress Test
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--color-surface)' }}>
                      {['Scenario', 'Rate', 'Monthly Payment', 'TDSR'].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '7px 10px',
                            textAlign: 'right',
                            color: 'var(--color-text-muted)',
                            borderBottom: '1px solid var(--color-border)',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pvResult.stressTest.map((row) => (
                      <tr key={row.rateIncrease}>
                        <td
                          style={{
                            padding: '6px 10px',
                            textAlign: 'right',
                            color: '#f97316',
                            fontWeight: 600,
                          }}
                        >
                          {row.rateIncrease}
                        </td>
                        <td
                          style={{
                            padding: '6px 10px',
                            textAlign: 'right',
                            color: 'var(--color-text-secondary)',
                          }}
                        >
                          {row.rate.toFixed(2)}%
                        </td>
                        <td
                          style={{
                            padding: '6px 10px',
                            textAlign: 'right',
                            color: 'var(--color-text)',
                          }}
                        >
                          S${fmtSGD(row.monthlyPayment)}
                        </td>
                        <td
                          style={{
                            padding: '6px 10px',
                            textAlign: 'right',
                            color: row.tdsrPct > 55 ? '#ef4444' : 'var(--color-text-secondary)',
                          }}
                        >
                          {fmtPct(row.tdsrPct, 1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Rent vs Buy */}
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    marginBottom: 8,
                  }}
                >
                  Rent vs Buy Analysis ({ps.rvbYears} years)
                </div>
                <StatGrid
                  items={[
                    {
                      label: 'Total Rent Cost',
                      value: `S$${fmtSGD(pvResult.rvb.totalRent)}`,
                      color: '#ef4444',
                    },
                    {
                      label: 'Future Property Value',
                      value: `S$${fmtSGD(pvResult.rvb.futureValue)}`,
                      color: '#10b981',
                    },
                    {
                      label: 'Capital Appreciation',
                      value: `S$${fmtSGD(pvResult.rvb.capitalGain)}`,
                      color: '#10b981',
                    },
                    {
                      label: 'Recommendation',
                      value: pvResult.rvb.verdict,
                      color:
                        pvResult.rvb.verdict === 'Buy'
                          ? '#10b981'
                          : pvResult.rvb.verdict === 'Rent'
                            ? '#ef4444'
                            : '#f59e0b',
                    },
                  ]}
                />
              </div>

              {/* Amortization Chart */}
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    marginBottom: 10,
                  }}
                >
                  Loan Balance & Repayment Schedule
                </div>
                <div style={{ height: 280, marginBottom: 16 }}>
                  <Line data={amortChartData} options={chartOptions} />
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--color-surface)' }}>
                      {['Year', 'Annual Payment', 'Principal', 'Interest', 'Balance'].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '7px 10px',
                            textAlign: 'right',
                            color: 'var(--color-text-muted)',
                            borderBottom: '1px solid var(--color-border)',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pvResult.yearlyAmort
                      .filter((_, i) => i % 2 === 0 || i === pvResult.yearlyAmort.length - 1)
                      .map((row) => (
                        <tr key={row.year}>
                          <td
                            style={{
                              padding: '5px 10px',
                              textAlign: 'right',
                              color: 'var(--color-text-secondary)',
                            }}
                          >
                            {row.year}
                          </td>
                          <td
                            style={{
                              padding: '5px 10px',
                              textAlign: 'right',
                              color: 'var(--color-text)',
                            }}
                          >
                            S${fmtSGD(row.payment)}
                          </td>
                          <td style={{ padding: '5px 10px', textAlign: 'right', color: '#10b981' }}>
                            S${fmtSGD(row.principal)}
                          </td>
                          <td style={{ padding: '5px 10px', textAlign: 'right', color: '#f97316' }}>
                            S${fmtSGD(row.interest)}
                          </td>
                          <td
                            style={{
                              padding: '5px 10px',
                              textAlign: 'right',
                              fontWeight: 600,
                              color: 'var(--color-text)',
                            }}
                          >
                            S${fmtSGD(row.balance)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Compare Tab ─────────────────────────────────────────────────── */}
          {activeTab === 'Compare' && (
            <div>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 12,
                  marginBottom: 16,
                }}
              >
                <thead>
                  <tr style={{ background: 'var(--color-surface)' }}>
                    <th
                      style={{
                        padding: '8px 12px',
                        textAlign: 'left',
                        color: 'var(--color-text-muted)',
                        borderBottom: '1px solid var(--color-border)',
                      }}
                    >
                      Metric
                    </th>
                    {cmpResult.map((s) => (
                      <th
                        key={s.name}
                        style={{
                          padding: '8px 12px',
                          textAlign: 'right',
                          color: 'var(--color-text-muted)',
                          borderBottom: '1px solid var(--color-border)',
                        }}
                      >
                        {s.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: 'price' as const, label: 'Purchase Price' },
                    { key: 'grants' as const, label: 'Total Grants' },
                    { key: 'effectivePrice' as const, label: 'Effective Price' },
                    { key: 'downpayment' as const, label: 'Downpayment' },
                    { key: 'loan' as const, label: 'Loan Amount' },
                    { key: 'monthlyMortgage' as const, label: 'Monthly Mortgage' },
                    { key: 'totalInterest' as const, label: 'Total Interest' },
                    { key: 'bsdAbsd' as const, label: 'BSD + ABSD' },
                    { key: 'cashNeeded' as const, label: 'Cash Needed' },
                    { key: 'tdsrPct' as const, label: 'TDSR %' },
                  ].map((metric) => {
                    const vals = cmpResult.map((s) => s[metric.key])
                    const min = Math.min(...vals.filter((v) => v > 0))
                    const max = Math.max(...vals)
                    return (
                      <tr key={metric.key}>
                        <td
                          style={{
                            padding: '7px 12px',
                            color: 'var(--color-text-secondary)',
                            borderBottom: '1px solid var(--color-border)',
                          }}
                        >
                          {metric.label}
                        </td>
                        {cmpResult.map((s) => {
                          const v = s[metric.key]
                          const isBest = v === min && min !== max
                          const isWorst = v === max && min !== max
                          const isCash = metric.key === 'tdsrPct'
                          return (
                            <td
                              key={s.name}
                              style={{
                                padding: '7px 12px',
                                textAlign: 'right',
                                borderBottom: '1px solid var(--color-border)',
                                fontWeight: isBest ? 700 : 400,
                                color: isBest
                                  ? isCash
                                    ? '#ef4444'
                                    : '#10b981'
                                  : isWorst
                                    ? isCash
                                      ? '#10b981'
                                      : '#ef4444'
                                    : 'var(--color-text)',
                              }}
                            >
                              {metric.key === 'tdsrPct' ? fmtPct(v, 1) : `S$${fmtSGD(v)}`}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                  <tr>
                    <td
                      style={{ padding: '8px 12px', color: 'var(--color-text)', fontWeight: 700 }}
                    >
                      Score
                    </td>
                    {cmpResult.map((s) => {
                      const maxScore = Math.max(...cmpResult.map((x) => x.score))
                      return (
                        <td
                          key={s.name}
                          style={{
                            padding: '8px 12px',
                            textAlign: 'right',
                            fontWeight: 700,
                            color: s.score === maxScore ? '#10b981' : 'var(--color-text-muted)',
                          }}
                        >
                          {s.score}/100 {s.score === maxScore ? '⭐' : ''}
                        </td>
                      )
                    })}
                  </tr>
                </tbody>
              </table>

              {/* Recommendation */}
              {(() => {
                const best = cmpResult.reduce((a, b) => (a.score >= b.score ? a : b))
                return (
                  <div
                    style={{
                      background: 'rgba(16,185,129,0.08)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      borderRadius: 10,
                      padding: '14px 18px',
                    }}
                  >
                    <div
                      style={{ fontSize: 14, fontWeight: 700, color: '#10b981', marginBottom: 5 }}
                    >
                      Recommendation: {best.name}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                      Scores {best.score}/100. Best balance of affordability, grants, and upfront
                      costs based on your profile.
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* ── Financial Dashboard Tab ──────────────────────────────────── */}
          {activeTab === 'Financial Dashboard' && (
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <MetricCard
                  label="Net Worth Post-Buy"
                  value={fmtSGDCompact(dashResult.netWorthPostBuy)}
                  accent="#3b82f6"
                />
                <MetricCard
                  label="Cash After Purchase"
                  value={`S$${fmtSGD(dashResult.cashAfter)}`}
                  accent={dashResult.cashAfter < 10000 ? '#ef4444' : '#10b981'}
                />
                <MetricCard
                  label="Monthly Stress Ratio"
                  value={fmtPct(dashResult.monthlyStressRatio, 1)}
                  accent={dashResult.monthlyStressRatio > 45 ? '#ef4444' : '#10b981'}
                />
                <MetricCard
                  label="Overall Risk Score"
                  value={`${dashResult.riskScore}/100`}
                  accent={
                    dashResult.riskScore >= 50
                      ? '#ef4444'
                      : dashResult.riskScore >= 25
                        ? '#f59e0b'
                        : '#10b981'
                  }
                />
              </div>

              {/* Risk gauge (CSS) */}
              <div
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  padding: '16px 20px',
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    marginBottom: 10,
                  }}
                >
                  Risk Level
                </div>
                <div
                  style={{
                    height: 12,
                    borderRadius: 6,
                    background: 'linear-gradient(90deg, #10b981 0%, #f59e0b 50%, #ef4444 100%)',
                    position: 'relative',
                    marginBottom: 6,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: -2,
                      left: `${dashResult.riskScore}%`,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: 'white',
                      border: '2px solid var(--color-text)',
                      transform: 'translateX(-50%)',
                    }}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 11,
                    color: 'var(--color-text-muted)',
                  }}
                >
                  <span>Low Risk</span>
                  <span>Medium</span>
                  <span>High Risk</span>
                </div>
              </div>

              {/* Risk flags */}
              {dashResult.riskFlags.map((flag, i) => (
                <Banner key={i} text={flag} level="warn" />
              ))}

              {/* Upgrade path */}
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    marginBottom: 10,
                  }}
                >
                  HDB Upgrade Path
                </div>
                <StatGrid
                  items={[
                    { label: 'Expected Sale Price', value: `S$${fmtSGD(ps.upSalePrice)}` },
                    { label: 'Remaining Loan', value: `S$${fmtSGD(ps.upLoan)}` },
                    {
                      label: 'CPF Accrued Interest',
                      value: `S$${fmtSGD(dashResult.upgradeResult.cpfAccruedInterest)}`,
                      color: '#f59e0b',
                    },
                    {
                      label: 'Agent Fees (2%)',
                      value: `S$${fmtSGD(dashResult.upgradeResult.agentFees)}`,
                    },
                    {
                      label: 'Net Cash Proceeds',
                      value: `S$${fmtSGD(dashResult.upgradeResult.netProceeds)}`,
                      color: dashResult.upgradeResult.netProceeds > 0 ? '#10b981' : '#ef4444',
                    },
                    {
                      label: 'Capital Gain',
                      value: `S$${fmtSGD(dashResult.upgradeResult.capitalGain)}`,
                      color: dashResult.upgradeResult.capitalGain > 0 ? '#10b981' : '#ef4444',
                    },
                  ]}
                />
              </div>

              {/* Smart Insights */}
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    marginBottom: 10,
                  }}
                >
                  Smart Insights
                </div>
                {dashResult.insights.map((ins, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderLeft: `3px solid ${ins.level === 'good' ? '#10b981' : ins.level === 'warn' ? '#f97316' : '#3b82f6'}`,
                      borderRadius: 8,
                      padding: '12px 14px',
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--color-text)',
                        marginBottom: 3,
                      }}
                    >
                      {ins.icon} {ins.title}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.5,
                      }}
                    >
                      {ins.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </CalcLayout>
  )
}
