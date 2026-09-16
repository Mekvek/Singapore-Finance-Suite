# Migration Plan — SG Finance Suite

**Status:** COMPLETE — `release/SG_Finance_Suite.exe` shipped (v1.3.1, 2026-08-05)
**Author:** Migration Architect (Claude Code)

---

## 1. Executive Summary

Five standalone, single-file HTML applications were migrated into a single **Electron + React + TypeScript** desktop application. Rather than porting each HTML file wholesale, all five calculators were **seamlessly blended** into one cohesive product: personal financial data is entered once in a shared profile store and flows live to all calculation engines simultaneously.

The only release artifact is one portable Windows executable: `release/SG_Finance_Suite.exe` (~70 MB).

---

## 2. Source Applications

### App 1 — CPF Projection Simulator

| Property | Detail |
|---|---|
| **File** | `sg-cpf-projection.html` |
| **Size** | ~35 KB / 743 lines |
| **Purpose** | Year-by-year projection of Singapore CPF balances across OA, SA, and MA accounts |
| **External deps** | None — 100% self-contained |
| **Charts** | Hand-rolled `window.Chart` canvas engine (inline, lines 620–738) |
| **Dark mode** | `@media (prefers-color-scheme: dark)` |
| **Persistence** | `localStorage` — saves and loads named scenarios |
| **Key logic** | `CPF_CONFIG` constants, `project(params)` projection engine, preset system (4 profiles), CSV export |

### App 2 — SG FIRE Calculator

| Property | Detail |
|---|---|
| **File** | `sg-fire-calculator.html` |
| **Size** | ~71 KB / 2130 lines |
| **Purpose** | Financial Independence Retire Early (FIRE) planning dashboard with CPF integration |
| **External deps** | Tailwind CSS CDN, Chart.js 4.4.0 (CDN), Google Fonts (Syne + DM Sans) |
| **Charts** | Chart.js 4.4.0 — line chart (net worth), doughnut (portfolio breakdown) |
| **Dark mode** | `.dark` class toggle, persisted in `localStorage` |
| **Persistence** | `localStorage` key `sgfire_inputs_v1` |
| **Key logic** | `projectWealth(inp)` engine, `calculate()` orchestrator, FIRE number crossover detection, multi-asset class modelling |

### App 3 — SG PropSmart Pro

| Property | Detail |
|---|---|
| **File** | `sg-property-calculator.html` |
| **Size** | ~98 KB / 2049 lines |
| **Purpose** | Comprehensive Singapore property purchase planning — HDB BTO, HDB Resale, Private, Rent-vs-Buy, Comparison, Dashboard |
| **External deps** | Google Fonts only (DM Mono, DM Sans, Playfair Display via CSS `@import`) |
| **Charts** | Raw Canvas 2D API — loan balance chart, principal-vs-interest chart |
| **Dark mode** | `.dark` class toggle |
| **Persistence** | `localStorage` key `propsmartpro_v1` |
| **Key logic** | `SETTINGS` object, BSD/ABSD calculators, CPF Housing Grant engine, 6 tab calculators, risk score/gauge, smart insights |

### App 4 — SG Income Tax Estimator *(added post-v1.0.0, shipped in v1.2.0)*

| Property | Detail |
|---|---|
| **File** | `sg-income-tax.html` |
| **Purpose** | Singapore personal income tax estimation with CPF relief and chargeable income breakdown |
| **Key logic** | Progressive tax band engine, CPF relief, SRS relief, earned income relief |

### App 5 — SG Insurance Analysis *(added post-v1.2.0, shipped in v1.3.x)*

| Property | Detail |
|---|---|
| **File** | `sg-insurance-analysis.html` |
| **Purpose** | Insurance adequacy and coverage-gap analysis across life, hospitalisation, CI/ECI, disability, mortgage, and emergency funding |
| **Key logic** | Portfolio gap scoring, priority recommendation rules, insurance health/risk summary |

---

## 3. Shared Functionality — As Implemented

### 3.1 Shared Profile Store (Direction Change)

The original plan called for migrating each HTML file as an isolated page. This was revised: a single `profileStore` (Zustand + persist) holds all common financial inputs — age, salary, CPF balances, cash, investments, citizenship — and is the **single source of truth** consumed by all calculation engines. The Dashboard runs all engines simultaneously, making cross-module data sharing a live, reactive experience.

### 3.2 Calculation Engines (Not in Original Plan)

All apps' calculation logic was extracted into pure TypeScript engine files under `src/engines/`. These functions accept typed parameters and return typed results with no DOM side effects, enabling reuse across pages and in the unified Dashboard.

### 3.3 Dark Mode & Themes *(expanded beyond original plan)*

Unified via `themeStore` (Zustand + persist, key `sgfinance-theme`). Supports Light / Dark / System preference plus 5 named colour themes (added v1.1.0). Theme class applied to `<html>` element via `useEffect` in `App.tsx`. All pages consume CSS custom properties (`--color-*`) defined in `src/styles/tokens.css`. Full theme documentation in `THEMES.md`.

### 3.4 localStorage Persistence

All state persisted via Zustand `persist` middleware. Keys:

| Store | Key |
|---|---|
| `profileStore` | `sgfinance-profile` |
| `fireStore` | `sgfinance-fire` |
| `cpfStore` | `sgfinance-cpf` |
| `propertyStore` | `sgfinance-property` |
| `taxStore` | `sgfinance-tax` |
| `themeStore` | `sgfinance-theme` |
| `uiStore` | *(in-memory only — sidebar collapse state is not persisted)* |

Legacy HTML keys (`cpf_scenarios`, `sgfire_inputs_v1`, `propsmartpro_v1`) are cleared by Settings → Clear All Data.

### 3.5 Chart Library

Unified on Chart.js 4.x via `react-chartjs-2`. All chart types registered centrally in `src/lib/chartjs.ts`. Replaced App 1's hand-rolled canvas engine and App 3's raw Canvas 2D API entirely.

---

## 4. Final Architecture

```
<project-root>\
│
├── electron/
│   ├── main.ts              # BrowserWindow (1400×900), sandbox=true, contextIsolation=true
│   └── preload.ts           # contextBridge: getVersion, openExternal, getNativeTheme
│
├── src/
│   ├── app/
│   │   └── App.tsx          # HashRouter, routes, theme class injection
│   │
│   ├── components/
│   │   ├── MetricCard.tsx   # Reusable KPI card (label, value, subvalue, accent)
│   │   ├── ProfilePanel.tsx # Shared profile inputs (reads/writes profileStore)
│   │   └── Sidebar.tsx      # Navigation sidebar with theme cycle button
│   │
│   ├── engines/             # Pure TS calculation engines (no DOM)
│   │   ├── cpfEngine.ts     # projectCPF() — year-by-year CPF projection
│   │   ├── fireEngine.ts    # projectFIRE() — FIRE wealth projection
│   │   ├── propertyEngine.ts# calcBTO/Resale/Private/Compare/Dashboard, calcMaxLoan
│   │   └── taxEngine.ts     # Singapore income tax engine (added v1.2.0)
│   │
│   ├── hooks/
│   │   ├── useLocalStorage.ts
│   │   └── useDebounce.ts
│   │
│   ├── layouts/
│   │   ├── AppLayout.tsx    # AppSidebar + <Outlet/>
│   │   └── CalcLayout.tsx   # 300px input panel + flex:1 main content
│   │
│   ├── lib/
│   │   └── chartjs.ts       # Central Chart.js component registration
│   │
│   ├── pages/
│   │   ├── Dashboard/       # Unified overview: runs all engines live
│   │   ├── CPFProjection/   # CPF deep-dive (replaces sg-cpf-projection.html)
│   │   ├── FIRECalculator/  # FIRE deep-dive (replaces sg-fire-calculator.html)
│   │   ├── PropertyCalc/    # Property calculator (replaces sg-property-calculator.html)
│   │   ├── IncomeTax/       # Income Tax Estimator (replaces sg-income-tax.html, added v1.2.0)
│   │   ├── Settings/        # Theme picker + Clear All Data
│   │   └── About/           # Version, tech stack
│   │
│   ├── store/
│   │   ├── profileStore.ts  # Shared: age, salary, CPF, cash, citizenship…
│   │   ├── fireStore.ts     # FIRE-specific: SSB, SGX, ETF, SWR, inflation…
│   │   ├── cpfStore.ts      # CPF-specific: VCMA, toggles, saved scenarios
│   │   ├── propertyStore.ts # Property: all 5 tab inputs + settings
│   │   ├── taxStore.ts      # Income tax inputs (added v1.2.0)
│   │   ├── themeStore.ts    # Theme: light/dark/system + colour theme name
│   │   └── uiStore.ts       # Sidebar collapsed state (in-memory, not persisted)
│   │
│   ├── styles/
│   │   ├── tokens.css       # CSS custom properties (--color-*, --radius-*, …)
│   │   └── globals.css      # Tailwind base directives + global resets
│   │
│   ├── types/
│   │   └── electron.d.ts    # Window.electronAPI type declarations
│   │
│   ├── utils/
│   │   ├── cpf.ts           # CPF rate tables, getCpfRates(), calcCpfInterest()
│   │   ├── format.ts        # fmtSGD(), fmtSGDCompact(), fmtPct(), fmtAxisLabel()
│   │   └── math.ts          # monthlyPayment(), buildAmortization(), buildYearlyAmort()
│   │
│   └── main.tsx             # React entry point
│
├── scripts/
│   └── setup-win-cache.js   # Pre-populates electron-builder winCodeSign cache (added v1.1.1)
│
├── public/
│   └── icon.ico             # App icon (added v1.1.0)
│
├── docs/
│   └── MIGRATION_PLAN.md    # This file
│
├── dist/                    # Vite renderer build output
├── dist-electron/           # Vite electron build output
├── release/                 # Portable EXE output
│   └── SG_Finance_Suite.exe # ~70 MB portable Windows executable
│
├── sg-cpf-projection.html   # Original source (kept for reference)
├── sg-fire-calculator.html  # Original source (kept for reference)
├── sg-property-calculator.html # Original source (kept for reference)
├── sg-income-tax.html       # Original source (kept for reference)
│
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── electron-builder.json
├── THEMES.md
├── README.md
└── CHANGELOG.md
```

---

## 5. Electron Configuration

```typescript
// electron/main.ts
new BrowserWindow({
  width: 1400,
  height: 900,
  minWidth: 900,
  minHeight: 600,
  webPreferences: {
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    preload: path.join(__dirname, 'preload.js'),
  },
})
```

IPC bridge (preload.ts):
- `getVersion()` — returns `app.getVersion()`
- `openExternal(url)` — opens URL in system browser
- `getNativeTheme()` — returns `nativeTheme.shouldUseDarkColors`

---

## 6. Build Configuration

### electron-builder.json

```json
{
  "appId": "com.sgfinance.suite",
  "productName": "SG Finance Suite",
  "directories": { "output": "release" },
  "win": {
    "target": "portable",
    "artifactName": "SG_Finance_Suite.exe",
    "icon": "public/icon.ico"
  },
  "nsis": { "oneClick": false },
  "asar": true
}
```

### npm scripts

| Script | Action |
|---|---|
| `npm run dev` | Vite dev server + Electron in watch mode |
| `npm run build` | `tsc --noEmit` + Vite bundle (renderer + electron) |
| `npm run preportable` | Runs `scripts/setup-win-cache.js` before the portable build (added v1.1.1) |
| `npm run portable` | Full production build → `release/SG_Finance_Suite.exe` |
| `npm run lint` | ESLint across `src/` and `electron/` |
| `npm run format` | Prettier across all source files |

---

## 7. Known Build Notes

### winCodeSign Symlink Issue (First-Time Build)

On Windows without Developer Mode enabled, electron-builder's first-run download of `winCodeSign-2.6.0.7z` fails with exit code 2 because the archive contains macOS symlinks (`darwin/10.12/lib/libcrypto.dylib`, `libssl.dylib`) that Windows cannot create without symlink privileges.

**Fix (v1.1.1):** `scripts/setup-win-cache.js` is wired as a `preportable` npm hook. It pre-populates the electron-builder cache at `%LOCALAPPDATA%\electron-builder\Cache\winCodeSign\winCodeSign-2.6.0\` by extracting the archive with 7za (ignoring the 2 symlink errors) and creating placeholder regular files at the two failing paths. Subsequent builds reuse the cache and complete without admin privileges or Developer Mode.

---

## 8. Success Criteria — Final Status

### v1.0.0 — Initial Release
- [x] All three calculators functional in the Electron app (CPF, FIRE, Property)
- [x] CPF projection engine ported from `project()` function in `sg-cpf-projection.html`
- [x] FIRE calculator engine ported from `projectWealth()` in `sg-fire-calculator.html`
- [x] Property calculator engine ported from all 6 tab calculators in `sg-property-calculator.html`
- [x] Dark mode works across all pages (Light / Dark / System)
- [x] localStorage save/load works in all stores
- [x] CSV export works in CPF Projection
- [x] Saved scenarios (CPF) persist across app restarts
- [x] Shared profile data flows live to all three calculators
- [x] Dashboard runs all three engines simultaneously with useMemo
- [x] `npm run build` succeeds with zero TypeScript errors
- [x] `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` throughout
- [x] CHANGELOG.md complete
- [x] README.md complete

### v1.1.0 — Themes & Icon
- [x] 5 named colour themes added (Light, Dark, and 3 variants)
- [x] App icon (`public/icon.ico`) bundled into executable
- [x] EXE renamed from `MyApplication.exe` → `SG_Finance_Suite.exe`
- [x] `THEMES.md` documentation added

### v1.1.1 — Build Reliability
- [x] `scripts/setup-win-cache.js` added as `preportable` hook
- [x] winCodeSign symlink issue resolved for first-time Windows builds
- [x] `npm run portable` produces `release/SG_Finance_Suite.exe` without admin privileges

### v1.2.0 — Income Tax Estimator
- [x] `src/engines/taxEngine.ts` — Singapore income tax calculation engine
- [x] `src/store/taxStore.ts` — persisted input store (`sgfinance-tax`)
- [x] `src/pages/IncomeTax/` — Income Tax Estimator page integrated into app
- [x] Dashboard updated to include income tax summary
- [x] README.md updated to document the fourth calculator

### v1.3.x — Insurance Integration & UX Improvements
- [x] `src/engines/insuranceEngine.ts` added and integrated
- [x] `src/pages/InsuranceAnalysis/` integrated into routing and sidebar
- [x] Shared profile store expanded with insurance-relevant fields
- [x] Dashboard updated with insurance and tax visual snapshots
- [x] CPF age-55 balance fallback bug fixed for retirement ages below 56
- [x] CPF quick presets expanded to populate plausible cross-module profile fields
- [x] Documentation updated (`CHANGELOG.md`, `README.md`, `MIGRATION_PLAN.md`)

---

*Migration complete — 2026-07-09. Post-release additions documented through v1.3.1 (2026-08-05).*
