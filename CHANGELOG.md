# Changelog

All notable changes to SG Finance Suite are documented here.

---

## [1.3.5] — 2026-09-16

### Fixed

- **Numeric input fields could not be fully backspaced to blank** — clearing a number field (FIRE Calculator, Income Tax, Property Calculator, and the shared Profile Panel) immediately snapped back to an unremovable `0`, blocking re-entry of new values. Added `src/hooks/useNumberInputState.ts`, which buffers the field as local text so it can go fully blank while typing and only commits/normalizes to a number on blur.

### Changed

- **Portable executable regenerated** at `release/SG_Finance_Suite.exe`.

### Verification

- `npm run format` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run portable` passed and regenerated `release/SG_Finance_Suite.exe`.

---

## [1.3.4] — 2026-08-06

### Changed

- **Property Ownership moved to FIRE Calculator** — removed from Property Calculator sidebar; now lives as a collapsible "Property Ownership" section in the FIRE Calculator input panel.
- **Removed "I intend to purchase a property" checkbox** — only the "I currently own a property" toggle remains; `intendsToPurchase` field removed from `propertyStore`.
- **FIRE Calculator — Net Worth chart** now conditionally renders a "Property Value" line (purple) when property ownership is active, showing how the property appreciates alongside other assets.
- **FIRE Calculator — Portfolio doughnut** includes a "Property" slice when ownership is active, giving a complete picture of retirement wealth composition.
- **FIRE Calculator — Overview tab** conditionally shows a "Property Value at Retirement" card.
- **FIRE Calculator — Projection Table** conditionally adds a "Property" column when ownership is active.
- **Dashboard — Net Worth Projection chart** conditionally renders the "Property Value" line to match FIRE Calculator.
- **Dashboard — KPI cards** conditionally shows a "Property Value Today" card (with appreciation rate) when ownership is active.
- **Portable executable regenerated** at `release/SG_Finance_Suite.exe`.

### Verification

- `npm run format` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run portable` passed and regenerated `release/SG_Finance_Suite.exe`.

---

## [1.3.3] — 2026-08-06

### Added

- **Property Ownership section** in the Property Calculator input panel (visible across all tabs).
  - Checkbox: **"I currently own a property"** — when checked, exposes three fields:
    - Current Property Value (S$)
    - Expected Annual Appreciation (%)
    - Monthly Rental Income (S$)
  - Checkbox: **"I intend to purchase a property"** — informational indicator.
- **Owned property integrated into net worth projection** (`src/engines/fireEngine.ts`):
  - Initial property value is added to `currentNetWorth`.
  - Each simulation year the property value compounds at the user-specified appreciation rate and is included in `netWorth`.
  - Monthly rental income × 12 is credited to cash savings every year (both accumulation and retirement phases).
- **`FIREParams`** extended with optional `ownedPropertyValue`, `ownedPropertyAppreciation`, and `ownedPropertyRentalIncome` fields; `FIREYearRow` gains `propertyValue`.
- **Dashboard** and **FIRE Calculator** both read from `usePropertyStore` and forward owned-property params to `projectFIRE`.
- **`src/store/propertyStore.ts`** extended with `ownsProperty`, `intendsToPurchase`, `ownedPropertyValue`, `ownedPropertyAppreciation`, and `ownedPropertyRentalIncome` (persisted).
- **Portable executable regenerated** at `release/SG_Finance_Suite.exe`.
- **Version bumped** to `1.3.3`.

### Verification

- `npm run format` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run portable` passed and regenerated `release/SG_Finance_Suite.exe`.

---

## [1.3.2] — 2026-08-06

### Changed

- **FIRE portfolio model simplified** in `src/engines/fireEngine.ts`.
  - Replaced the separate SSB / SGX / ETF buckets with a two-asset model: **Bonds** and **Stocks**.
  - Bond principal no longer compounds; annual bond interest now flows into cash savings.
  - Stocks now handle capital growth and the annual DCA contribution.
  - Investment Portfolio is now derived automatically as **Bonds + Stocks** instead of being user-editable.
- **`src/pages/FIRECalculator/index.tsx`** updated to match the new model.
  - Renamed SSB to Bonds.
  - Merged SGX stocks and ETFs into Stocks.
  - Removed the Cash Investments input block.
  - Updated portfolio charts, overview cards, and projection labels to use the new breakdown.
- **`src/components/ProfilePanel.tsx`** now shows Investment Portfolio as a read-only calculated field.
- **Dashboard FIRE snapshot** labels updated to use Cash + Portfolio wording.
- **Shared profile investment total** now tracks the derived FIRE portfolio so Dashboard and Insurance Analysis stay in sync.
- **Portable executable regenerated** at `release/SG_Finance_Suite.exe` after the FIRE model changes.
- **Version bumped** to `1.3.2`.

### Verification

- `npm run format` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run portable` passed and regenerated `release/SG_Finance_Suite.exe`.

## [1.3.1] — 2026-08-05

### Added

- **Insurance Analysis module** — new native calculator page accessible via the `🛡️ Insurance Analysis` sidebar tab (`/insurance` route).
  - Uses existing app layout/components (`CalcLayout`, `ProfilePanel`, `MetricCard`) to match current UI structure, spacing, and theming.
  - Adds an Insurance dashboard with:
    - insurance health score and risk score
    - life insurance adequacy and gap
    - hospitalisation coverage adequacy and gap
    - critical illness and early critical illness gap analysis
    - disability income replacement gap (monthly)
    - mortgage protection gap
    - emergency fund adequacy (months of coverage)
    - priority recommendations / next actions
- **`src/engines/insuranceEngine.ts`** — pure TypeScript insurance analysis engine (`analyzeInsurance`) with Singapore-oriented planning heuristics and prioritised recommendations.

### Changed

- **Shared profile model extended** in `src/store/profileStore.ts` to support insurance analysis without creating duplicate per-module state:
  - Added profile fields: `gender`, `dependants`, `children`, `housingType`, `mortgageBalance`, `otherLoans`, `lifeCoverage`, `hospCoverage`, `ciCoverage`, `eciCoverage`, `diMonthlyCoverage`, `mortgageCoverage`.
- **`src/components/ProfilePanel.tsx`** now supports optional `showInsuranceProfile` section for editing insurance-related profile fields from the same shared profile store.
- **Routing/navigation integration**:
  - `src/app/App.tsx` adds `<Route path="insurance" element={<InsuranceAnalysis />} />`
  - `src/components/Sidebar.tsx` adds `{ to: '/insurance', label: 'Insurance Analysis', emoji: '🛡️' }`
- **Dashboard enhancements**:
  - Added Income Tax snapshot visual summary (tax payable, chargeable income, effective rate, monthly take-home, relief-cap utilisation bar).
  - Added Insurance snapshot visual summary (health score, total gap, top 3 coverage bars).
  - Added dashboard navigation shortcuts for `Income Tax` and `Insurance Analysis`.
- **Duplicate shared-profile input removal**:
  - Removed dashboard quick-edit input controls for salary, expenses, and retire age; replaced with read-only summary chips to keep one canonical shared-profile edit surface.
- **Portable executable regenerated** at `release/SG_Finance_Suite.exe` including the new module.
- **Version bumped** to `1.3.1`.
- **CPF quick presets enhanced** (`Fresh Grad`, `Mid-Career`, `Senior`, `High Income`) to populate a fuller, cross-module plausible shared profile including insurance-relevant fields.
- **README refreshed** to align with current 5-calculator product scope and dashboard/tax/insurance snapshots.

### Fixed

- Resolved lint issue in `src/engines/insuranceEngine.ts` (removed unused local variable).
- Fixed CPF age-55 balance metric returning `S$0` when retirement age is set below 56 by adding a deterministic fallback projection to age 55 in `src/engines/cpfEngine.ts`.

### Verification

- `npm run format` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run portable` passed and produced `release/SG_Finance_Suite.exe`.

### Infrastructure

- **`.gitignore` — complete overhaul** following Git best practices for an Electron + Vite + React project. No application code was modified; only the ignore ruleset was updated.

  | Section | What changed | Why |
  |---|---|---|
  | **Environment Variables** | Kept `.env`, `.env.*`, `!.env.example` | Prevents secrets from being committed; `.env.example` stays tracked as a setup template. |
  | **Dependencies** | `node_modules/` (was present, kept) | The package manager re-creates this from `package-lock.json`; committing it bloats the repo. |
  | **Build Output** | Added `dist/`, `dist-electron/`, `build/`, `out/`; replaced the three granular `release/…` lines with a single `release/` | All four directories are generated artefacts. The previous rules only partially covered the release folder (`win-unpacked`, `builder-debug.yml`, `builder-effective-config.yaml`), leaving the packaged `.exe` and any future sub-paths un-ignored. |
  | **Electron Build Artefacts** | Added `*.exe`, `*.msi`, `*.dmg`, `*.AppImage`, `*.deb`, `*.rpm`, `*.asar` | Platform-specific packaged binaries and the asar archive are build outputs, not source. They are large, binary-diffed, and belong in a release channel (e.g. GitHub Releases), not the repository tree. |
  | **Logs** | Added `logs/`, `*.log`, `npm-debug.log*`, `yarn-debug.log*`, `pnpm-debug.log*` | Runtime and package-manager logs are ephemeral and machine-specific. |
  | **Cache** | Added `.cache/`, `.parcel-cache/`, `.vite/`, `.eslintcache` | Tool caches are regenerated on the next run; committing them causes noisy, meaningless diffs. |
  | **Test Output** | Added `coverage/`, `playwright-report/`, `test-results/` | Not currently used, but included defensively so that adding a test suite in the future never accidentally commits its artefacts. |
  | **IDEs & Editors** | Added `.vscode/`, `.idea/` | Editor-specific settings are personal to each developer's machine and workspace; sharing them forces tooling choices on contributors. |
  | **OS-Generated Files** | Added `.DS_Store`, `Thumbs.db`, `Desktop.ini` | macOS, Windows Explorer, and Windows shell artefacts; never intentional source files. |
  | **Temporary Files** | Added `tmp/`, `temp/`, `*.tmp` | Short-lived scratch files that tools sometimes leave behind. |
  | **Python** | Added `__pycache__/`, `*.pyc` | Defensive: the project has no Python source, but standalone HTML tools and scripts may grow Python dependencies. |
  | **Runtime** | Added `*.pid` | Process-ID files written by long-running daemons; not source. |
  | **Local Databases** | Added `*.sqlite`, `*.sqlite3` | Defensive: Electron apps commonly adopt SQLite for persistence; ignoring them pre-empts accidental data commits. |
  | **Certificates & Private Keys** | Added `*.pem`, `*.key`, `*.crt`, `*.p12` | Code-signing certificates and private keys must never reach a repository. |
  | **Local Configuration** | `*.local` kept from previous file | Matches Vite's `*.env.local` pattern and any other machine-local overrides. |
  | **Miscellaneous Generated Files** | Added `*.bak`, `*.old`, `*.orig` | Editor backup and merge-conflict residue files. |

  **Removed** (redundant after the above additions):
  - `release/win-unpacked` — now covered by `release/`
  - `release/builder-debug.yml` — now covered by `release/`
  - `release/builder-effective-config.yaml` — now covered by `release/`

  **Verified**: all source files (`src/`, `electron/`, `public/`, `scripts/`, `*.html`, `*.json`, `*.ts`, `*.cjs`, `*.md`, `index.html`) remain tracked; no build-required file is newly ignored.

---

## [1.2.0] — 2026-08-04

### Added
- **Income Tax Estimator** — new native calculator page accessible via the `🧾 Income Tax` sidebar tab (`/tax` route).
  - Auto-consumes salary, bonus, age, and citizenship from `profileStore`; users never re-enter shared data.
  - **Additional income** section: director fees, commission, other employment, self-employed/business, rental, taxable investment, and other income.
  - **CPF contributions** panel with auto mode (derived from salary + bonus using existing `cpf.ts` rate tables and `CPF_WAGE_CEILING_MONTHLY = 6,800`) or manual override.
  - **Tax reliefs** — all 16 IRAS-recognised relief types: Earned Income, CPF, NSman (self/wife/parent), Spouse, Handicapped Spouse, QCR, HCR, WMCR (tiered S$8K / S$10K / S$12K for 1st / 2nd / 3rd+ child), Parent Relief with per-dependant living-with / handicapped flags (cap 2), Course Fees, CPF Top-up (self + family), SRS, Life Insurance, FDWL, Donations (250%).
  - **S$80,000 relief cap** enforced (donations excluded per IRAS rules); cap-reached warning shown in panel and results.
  - **What-If mode** — chip selectors for salary increase, extra SRS, extra CPF top-up, extra donations; live delta showing new tax, change, and savings.
  - **6 MetricCards**: Tax Payable, Effective Rate, Marginal Rate, Chargeable Income, Annual Take-Home, Tax Savings.
  - **4 tabs**: Overview (doughnut + relief table), Brackets (bar chart + full bracket breakdown table with "you are here" highlight), Rates (rate comparison bar + tax progression line chart), Insights (personalised insights list + optimisation score ring + tax planning checklist).
  - CSV export of full tax estimate.
- **`src/engines/taxEngine.ts`** — pure TypeScript tax calculation engine: 13-bracket YA 2025 table, all relief computations, `calculateTax()`, `computeTax()`, `generateInsights()`, `computeOptimizationScore()`.
- **`src/store/taxStore.ts`** — Zustand persisted store (`sgfinance-tax`) for all tax-page inputs.

### Changed
- **`src/app/App.tsx`** — added `<Route path="tax" element={<IncomeTax />} />`.
- **`src/components/Sidebar.tsx`** — added `{ to: '/tax', label: 'Income Tax', emoji: '🧾' }` to `NAV_ITEMS`.
- **`release/SG_Finance_Suite.exe`** regenerated to include Income Tax Estimator.
- **Version bumped** to `1.2.0`.

---

## [1.1.1] — 2026-08-04

### Fixed
- **Themes now apply visually** — `@import './tokens.css'` moved to the top of `globals.css`, before all Tailwind directives. esbuild (the CSS bundler used by Vite) drops `@import` statements that appear after other CSS rules per the CSS spec; all custom properties defined in `tokens.css` were silently absent from the production bundle, making every theme switch a no-op.
- **Windows build reliability on fresh machines** — Added `scripts/setup-win-cache.js` (runs as `preportable` hook) that pre-creates darwin placeholder files in the electron-builder winCodeSign cache. Prevents 7-Zip from failing on macOS symlinks when building on Windows without Developer Mode enabled.
- **tsconfig.json IDE warning** — Removed `allowImportingTsExtensions` option; no source files use explicit `.ts` import paths so the flag was unused and caused VS Code to show a squiggle.

### Changed
- **Renamed** `cpf_projection.html` → `sg-cpf-projection.html` at project root.
- **Version bumped** to `1.1.1`.

---

## [1.1.0] — 2026-07-09

### Added
- **5 colour themes** selectable from Settings → Appearance dropdown (alphabetical order): Arctic Calm (icy blue, light), Aurora Pulse (neon pink/green, dark), Retro Radar (phosphor green terminal, dark), Solar Flare (warm amber, dark), Tropical Breeze (sandy teal/coral, light). Theme cycles via sidebar button; full CSS custom property overrides in `src/styles/tokens.css`.
- **Custom EXE icon** (`public/icon.ico`) — dark navy rounded square with ascending bar chart in green, amber top bar, white "S$" label; embedded at 16, 32, 48, 256 px.

### Changed
- **EXE renamed** to `SG_Finance_Suite.exe` (was `MyApplication.exe`); `electron-builder.json` `artifactName` updated.
- **EXE description** updated to `"SG Finance Suite"` in `package.json`.
- **App opens maximised** — `win.maximize()` called in `ready-to-show` handler in `electron/main.ts`.
- **Dashboard** — removed `maxWidth: 1200` constraint; content now fills the full available width at any window size.
- **Settings and About pages** — added `margin: 0 auto` so the 640px content block centres on wide screens rather than left-aligning.
- **Theme system overhauled** — `ThemeChoice` now supports `system | arctic-calm | aurora-pulse | retro-radar | solar-flare | tropical-breeze`. Named themes use `data-theme` HTML attribute; `system` still uses `.dark` class toggle. Sidebar cycle button iterates all 6 themes in alphabetical order.
- **Version bumped** to `1.1.0`.

---

## [1.0.0] — 2026-07-09

Initial release. Three standalone HTML finance tools migrated into a single portable Electron desktop application with seamless cross-module data sharing.

### Added

#### Application shell
- Electron 31 main process with `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
- Secure preload bridge exposing `getVersion`, `openExternal`, `getNativeTheme`
- HashRouter-based React 18 SPA (required for Electron `file://` protocol)
- Persistent sidebar navigation with theme cycle button
- Light / Dark / System theme support via `themeStore` (Zustand + persist)
- Content Security Policy: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'`
- Unified CSS design token system (`--color-*`, `--radius-*`) in `src/styles/tokens.css`
- Chart.js 4 registered centrally in `src/lib/chartjs.ts`

#### Shared state layer
- `profileStore` — single source of truth for personal financial data (age, salary, CPF balances, cash, investments, citizenship, marital status, first-timer flag); persist key `sgfinance-profile`
- `fireStore` — FIRE-specific inputs (SSB, SGX, ETF, SWR, inflation, return assumptions); persist key `sgfinance-fire`
- `cpfStore` — CPF options (VCMA, growth/inflation/extra toggles, named scenarios with save/delete); persist key `sgfinance-cpf`
- `propertyStore` — all five property tab inputs plus settings overrides; persist key `sgfinance-property`

#### Calculation engines (pure TypeScript, no DOM)
- `cpfEngine.ts` — `projectCPF()`: yearly CPF projection with 2024–2025 rate tables, BHS/FRS milestone detection, VCMA, extra +1% interest toggle
- `fireEngine.ts` — `projectFIRE()`: multi-asset FIRE projection (CPF, cash, investments, SSB, SGX, ETF), age-55 CPF withdrawal, FIRE number crossover detection
- `propertyEngine.ts` — `calcBTO`, `calcResale`, `calcPrivate`, `calcCompare`, `calcDashboard`, `calcMaxLoan`, `calcBSD`, `calcABSD`, `calcGrants`, `affordClass`, `generateInsights`; 16-bracket EHG table, 2023 ABSD rates

#### Shared utilities
- `src/utils/cpf.ts` — CPF contribution rate tables by age band, allocation fractions (OA/SA/MA), `getCpfRates()`, `getCpfEmployeeRate()`, `getCpfEmployerRate()`, `calcCpfInterest()`
- `src/utils/math.ts` — `monthlyPayment()`, `totalInterest()`, `buildAmortization()`, `buildYearlyAmort()`, `clamp()`
- `src/utils/format.ts` — `fmtSGD()`, `fmtSGDCompact()`, `fmtDollar()`, `fmtPct()`, `fmtAxisLabel()`

#### Shared components
- `MetricCard` — reusable KPI card with label, value, optional subvalue, accent colour
- `ProfilePanel` — collapsible input panel (Personal, Income, CPF Balances, Assets, Property Profile sections) bound to `profileStore`; used by all three calculator pages
- `CalcLayout` — two-column layout: 300px scrollable input panel + flex:1 main content area

#### Dashboard page (unified financial overview)
- Runs `projectFIRE()` and `projectCPF()` simultaneously with `useMemo`
- Quick-edit strip (salary, expenses, retire age) updates all three engines live
- Five KPI MetricCards: Net Worth Today, FIRE Progress %, FIRE Age, CPF at Retirement, Max HDB Budget
- FIRE progress bar with status badge (Building / On Track / FIRE Achieved)
- Net Worth Projection line chart (net worth, cash+invest, CPF total, FIRE number dashed)
- CPF Balance Growth line chart (OA, SA, MA)
- Key Milestones panel (CPF BRS at 55, BHS age, FRS age, FIRE crossover, retirement target)
- Property Affordability panel using `calcMaxLoan()` from `profileStore` salary
- Navigation shortcuts to all three calculator pages

#### CPF Projection page (replaces `cpf_projection.html`)
- Four quick-load presets applying to `profileStore`: Fresh Grad, Mid-Career, Senior, High Income
- VCMA slider (S$0–5,000/month)
- Three toggles: salary growth, BHS/FRS annual inflation, extra +1% CPF interest
- Save named scenarios (persisted) with one-click load and delete
- CSV export of full projection table
- Six MetricCards: Total at Retirement, Balance at 55, Total Contributions, Interest Earned, FRS Reached, BHS Reached
- Four tabs: Balance Growth (line), Total CPF (stacked bar), Contributions (grouped bar), Year Table
- Year Table with milestone row highlighting (BHS, FRS, age 55, retirement)

#### FIRE Calculator page (replaces `sg-fire-calculator.html`)
- Input panel: ProfilePanel + FIRE Investments (SSB principal+rate, SGX value+return+dividend, ETF value+DCA+return) + FIRE Assumptions (invest return, inflation, SWR, include CPF toggle, adjust inflation toggle) + reset button
- Four MetricCards: FIRE Number, Years to FIRE, Monthly Passive Income, Net Worth Today
- FIRE status badge + progress bar
- Age timeline (current age → FIRE age → age 65)
- Four tabs: Overview (wealth at retirement tiles), Net Worth (line chart), Portfolio (doughnut chart at retirement), Projection Table
- Projection table filtered to milestone years and every 5 years
- Input validation warnings

#### Property Calculator page (replaces `sg-property-calculator.html`)
- Sticky Live Summary Bar: monthly income, max HDB loan, monthly mortgage, TDSR/MSR, affordability label
- Five tabs: HDB BTO, HDB Resale, Private, Compare, Financial Dashboard
- **BTO tab**: stat grid (price, grants, effective price, loan, downpayment, CPF used, cash required, monthly mortgage, total interest, MSR), MSR progress bar, grant eligibility banners, income ceiling warnings, 10-stage progressive payment timeline
- **Resale tab**: COV analysis, grant breakdown, lease risk grid (remaining lease, age at expiry, CPF restriction flag, risk level), eligibility warnings
- **Private tab**: full cost breakdown (BSD, ABSD, legal fees, agent fees, total upfront), stress test table (+1/+2/+3%), Rent vs Buy analysis, Chart.js amortization line chart, amortization table (every 2 years)
- **Compare tab**: 3-column × 10-metric table with best/worst cell highlighting, score row, recommendation card
- **Financial Dashboard tab**: four MetricCards (net worth post-buy, cash after, monthly stress ratio, risk score), CSS gradient risk gauge, risk flag banners, upgrade path calculator (CPF accrued interest, agent fees, net proceeds, capital gain), Smart Insights cards (up to 6)

#### Settings page
- Theme picker: System / Light / Dark
- Clear All Saved Data — removes all six `sgfinance-*` localStorage keys plus three legacy HTML app keys

#### About page
- App version, tech stack, data source attribution

#### Build & packaging
- `electron-builder` portable target; `artifactName: "MyApplication.exe"`; output to `release/`
- No Setup.exe, NSIS, MSI, ZIP, or auto-updater targets
- `npm run dev` — Vite HMR + Electron watch mode
- `npm run build` — `tsc --noEmit` + Vite (renderer + electron main/preload)
- `npm run portable` — full build → `release/MyApplication.exe`

### Technical notes

- HashRouter required (not BrowserRouter) — Electron loads `index.html` via `file://` protocol; history-based routing breaks on reload
- CSS `@import` for `tokens.css` placed after Tailwind directives to avoid PostCSS ordering warning
- `winCodeSign` cache pre-populated on first build to work around Windows symlink privilege restriction (see `docs/MIGRATION_PLAN.md`)

---

*Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)*
