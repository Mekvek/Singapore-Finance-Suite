import { useState } from 'react'
import { useProfileStore } from '../store/profileStore'
import { useNumberTextInputState } from '../hooks/useNumberInputState'

interface SectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function Section({ title, children, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
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
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div style={{ padding: '0 14px 12px' }}>{children}</div>}
    </div>
  )
}

interface FieldProps {
  label: string
  id: string
  type?: string
  value: number | string
  min?: number
  max?: number
  step?: number
  onChange: (v: string) => void
  options?: Array<{ value: string; label: string }>
  prefix?: string
  suffix?: string
  disabled?: boolean
}

function Field({
  label,
  id,
  type = 'number',
  value,
  min,
  max,
  step = 1,
  onChange,
  options,
  prefix,
  suffix,
  disabled = false,
}: FieldProps) {
  const { text, handleChange, handleBlur } = useNumberTextInputState(value, onChange)
  return (
    <div style={{ marginBottom: 10 }}>
      <label
        htmlFor={id}
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
            id={id}
            value={value}
            disabled={disabled}
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
              id={id}
              type="range"
              min={min}
              max={max}
              step={step}
              value={value}
              disabled={disabled}
              onChange={(e) => onChange(e.target.value)}
              style={{ flex: 1 }}
            />
            <span
              style={{
                minWidth: 32,
                fontSize: 13,
                color: 'var(--color-text)',
                textAlign: 'right',
                fontWeight: 600,
              }}
            >
              {value}
              {suffix}
            </span>
          </div>
        ) : (
          <input
            id={id}
            type="number"
            min={min}
            max={max}
            step={step}
            value={text}
            disabled={disabled}
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

interface ProfilePanelProps {
  showPropertyProfile?: boolean
  showAssets?: boolean
  showInsuranceProfile?: boolean
  collapsedSections?: string[]
}

export default function ProfilePanel({
  showPropertyProfile = false,
  showAssets = true,
  showInsuranceProfile = false,
  collapsedSections = [],
}: ProfilePanelProps) {
  const p = useProfileStore()

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>
          My Profile
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
          Shared across all calculators
        </div>
      </div>

      {/* Personal */}
      <Section title="Personal" defaultOpen={!collapsedSections.includes('personal')}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Field
            label="Current Age"
            id="age"
            value={p.age}
            min={18}
            max={70}
            onChange={(v) => p.set({ age: Number(v) })}
          />
          <Field
            label="Retire Age"
            id="retireAge"
            value={p.retireAge}
            min={30}
            max={75}
            onChange={(v) => p.set({ retireAge: Number(v) })}
          />
        </div>
      </Section>

      {/* Income */}
      <Section title="Income & Expenses" defaultOpen={!collapsedSections.includes('income')}>
        <Field
          label="Monthly Gross Salary (S$)"
          id="salary"
          value={p.salary}
          min={0}
          step={100}
          prefix="S$"
          onChange={(v) => p.set({ salary: Number(v) })}
        />
        <Field
          label="Annual Salary Growth"
          id="salaryGrowth"
          value={p.salaryGrowth}
          min={0}
          max={15}
          step={0.5}
          suffix="%"
          onChange={(v) => p.set({ salaryGrowth: Number(v) })}
        />
        <Field
          label="Bonus (months of salary)"
          id="bonus"
          value={p.bonus}
          min={0}
          max={12}
          step={0.5}
          onChange={(v) => p.set({ bonus: Number(v) })}
        />
        <Field
          label="Monthly Expenses (S$)"
          id="expenses"
          value={p.expenses}
          min={0}
          step={100}
          prefix="S$"
          onChange={(v) => p.set({ expenses: Number(v) })}
        />
      </Section>

      {/* CPF */}
      <Section title="CPF Balances" defaultOpen={!collapsedSections.includes('cpf')}>
        <Field
          label="Ordinary Account (S$)"
          id="cpfOA"
          value={p.cpfOA}
          min={0}
          step={1000}
          prefix="S$"
          onChange={(v) => p.set({ cpfOA: Number(v) })}
        />
        <Field
          label="Special Account (S$)"
          id="cpfSA"
          value={p.cpfSA}
          min={0}
          step={1000}
          prefix="S$"
          onChange={(v) => p.set({ cpfSA: Number(v) })}
        />
        <Field
          label="Medisave Account (S$)"
          id="cpfMA"
          value={p.cpfMA}
          min={0}
          step={1000}
          prefix="S$"
          onChange={(v) => p.set({ cpfMA: Number(v) })}
        />
      </Section>

      {/* Assets */}
      {showAssets && (
        <Section title="Assets" defaultOpen={!collapsedSections.includes('assets')}>
          <Field
            label="Cash Savings (S$)"
            id="cash"
            value={p.cash}
            min={0}
            step={1000}
            prefix="S$"
            onChange={(v) => p.set({ cash: Number(v) })}
          />
          <Field
            label="Investment Portfolio (auto-calculated)"
            id="investments"
            value={p.investments}
            min={0}
            step={1000}
            prefix="S$"
            disabled={true}
            onChange={(v) => p.set({ investments: Number(v) })}
          />
        </Section>
      )}

      {/* Property Profile */}
      {showPropertyProfile && (
        <Section title="Property Profile" defaultOpen={!collapsedSections.includes('property')}>
          <Field
            label="Citizenship"
            id="citizenship"
            value={p.citizenship}
            onChange={(v) => p.set({ citizenship: v })}
            options={[
              { value: 'SC', label: 'Singapore Citizen' },
              { value: 'PR', label: 'Permanent Resident' },
              { value: 'FG', label: 'Foreigner' },
            ]}
          />
          <Field
            label="Marital Status"
            id="marital"
            value={p.marital}
            onChange={(v) => p.set({ marital: v })}
            options={[
              { value: 'married', label: 'Married' },
              { value: 'engaged', label: 'Engaged' },
              { value: 'single', label: 'Single' },
            ]}
          />
          <Field
            label="First-Timer Applicant?"
            id="firstTimer"
            value={p.firstTimer}
            onChange={(v) => p.set({ firstTimer: v })}
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ]}
          />
        </Section>
      )}

      {/* Insurance Profile */}
      {showInsuranceProfile && (
        <Section title="Insurance Profile" defaultOpen={!collapsedSections.includes('insurance')}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field
              label="Gender"
              id="gender"
              value={p.gender}
              onChange={(v) => p.set({ gender: v as 'male' | 'female' })}
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
              ]}
            />
            <Field
              label="Housing Type"
              id="housingType"
              value={p.housingType}
              onChange={(v) => p.set({ housingType: v as 'hdb' | 'condo' | 'landed' })}
              options={[
                { value: 'hdb', label: 'HDB' },
                { value: 'condo', label: 'Condo' },
                { value: 'landed', label: 'Landed' },
              ]}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field
              label="Dependants"
              id="dependants"
              value={p.dependants}
              min={0}
              max={10}
              onChange={(v) => p.set({ dependants: Number(v) })}
            />
            <Field
              label="Children"
              id="children"
              value={p.children}
              min={0}
              max={10}
              onChange={(v) => p.set({ children: Number(v) })}
            />
          </div>
          <Field
            label="Outstanding Mortgage (S$)"
            id="mortgageBalance"
            value={p.mortgageBalance}
            min={0}
            step={1000}
            prefix="S$"
            onChange={(v) => p.set({ mortgageBalance: Number(v) })}
          />
          <Field
            label="Other Outstanding Loans (S$)"
            id="otherLoans"
            value={p.otherLoans}
            min={0}
            step={1000}
            prefix="S$"
            onChange={(v) => p.set({ otherLoans: Number(v) })}
          />
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              margin: '8px 0 6px',
            }}
          >
            Existing Insurance Coverage
          </div>
          <Field
            label="Life Coverage (S$)"
            id="lifeCoverage"
            value={p.lifeCoverage}
            min={0}
            step={10000}
            prefix="S$"
            onChange={(v) => p.set({ lifeCoverage: Number(v) })}
          />
          <Field
            label="Hospitalisation Coverage Limit (S$)"
            id="hospCoverage"
            value={p.hospCoverage}
            min={0}
            step={50000}
            prefix="S$"
            onChange={(v) => p.set({ hospCoverage: Number(v) })}
          />
          <Field
            label="Critical Illness Coverage (S$)"
            id="ciCoverage"
            value={p.ciCoverage}
            min={0}
            step={10000}
            prefix="S$"
            onChange={(v) => p.set({ ciCoverage: Number(v) })}
          />
          <Field
            label="Early CI Coverage (S$)"
            id="eciCoverage"
            value={p.eciCoverage}
            min={0}
            step={10000}
            prefix="S$"
            onChange={(v) => p.set({ eciCoverage: Number(v) })}
          />
          <Field
            label="Disability Income (monthly, S$)"
            id="diMonthlyCoverage"
            value={p.diMonthlyCoverage}
            min={0}
            step={100}
            prefix="S$"
            onChange={(v) => p.set({ diMonthlyCoverage: Number(v) })}
          />
          <Field
            label="Mortgage Protection Coverage (S$)"
            id="mortgageCoverage"
            value={p.mortgageCoverage}
            min={0}
            step={10000}
            prefix="S$"
            onChange={(v) => p.set({ mortgageCoverage: Number(v) })}
          />
        </Section>
      )}
    </div>
  )
}
