# SG Finance Suite

SG Finance Suite is a portable Windows desktop app for Singapore personal finance planning. It combines a shared financial profile with five calculators so CPF projections, FIRE planning, property affordability, income tax, and insurance analysis stay aligned instead of drifting across separate spreadsheets or tools.

All calculations run locally on device. No login, sync, or cloud backend is required.

## Documentation

- [Changelog](CHANGELOG.md)
- [Migration Plan](docs/MIGRATION_PLAN.md)
- [Themes](THEMES.md)

## App Modules

The current Electron app exposes these sections through a single shared shell:

- Dashboard: cross-module overview with net worth, milestones, CPF, FIRE, property, tax, and insurance snapshots
- CPF Projection: year-by-year OA, SA, and MA balances with milestone tracking, presets, scenarios, and CSV export
- FIRE Calculator: multi-asset retirement planning with CPF withdrawal modelling and retirement crossover detection
- Property Calculator: HDB BTO, HDB resale, private property, comparison, and post-purchase dashboard views
- Income Tax Estimator: YA 2025 resident tax estimate with shared profile inputs, relief modelling, and what-if analysis
- Insurance Analysis: coverage adequacy scoring, gap sizing, and next-step recommendations
- Settings: theme selection and local data management
- About: app version and tech stack summary

## Run The App

For the packaged Windows build, launch [release/SG_Finance_Suite.exe](release/SG_Finance_Suite.exe).

The packaged target is a portable `.exe`, so no installer is required.

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Electron 31 |
| UI framework | React 18 + TypeScript |
| Build tool | Vite 5 + vite-plugin-electron/simple |
| Routing | React Router 6 with HashRouter |
| State / persistence | Zustand 4 + persist middleware |
| Charts | Chart.js 4 + react-chartjs-2 |
| Styling | TailwindCSS v3 + CSS custom properties |
| Packaging | electron-builder 24, Windows portable target |

## Project Structure

```text
src/
├── app/App.tsx              # Route tree + theme application
├── components/              # Shared UI such as sidebar, profile panel, metric cards
├── engines/                 # Pure calculation logic for CPF, FIRE, tax, property, insurance
├── hooks/                   # Reusable state helpers
├── layouts/                 # Shell and calculator page layouts
├── pages/                   # Route-level feature screens
├── store/                   # Zustand persisted and UI-only stores
├── styles/                  # Global styles and theme tokens
├── types/                   # Shared TypeScript declarations
└── utils/                   # Formatting, CPF helpers, amortization math

electron/
├── main.ts                  # BrowserWindow lifecycle, external link handling, IPC registration
└── preload.ts               # Safe renderer bridge

public/                      # Static assets, including app icon
dist-electron/               # Built Electron entry points
release/                     # Packaged Windows artifacts
```

## Development

### Prerequisites

- Node.js 18+
- npm 9+
- Windows 10 or 11 for running the packaged executable

### Install

```bash
npm install
```

### Available scripts

```bash
npm run dev
npm run build
npm run portable
npm run lint
npm run format
```

- `npm run dev`: starts the Vite-based Electron development workflow
- `npm run build`: runs `tsc --noEmit` and builds the renderer and Electron bundles
- `npm run portable`: prepares the build cache, runs the production build, and packages `release/SG_Finance_Suite.exe`
- `npm run lint`: runs ESLint with zero warnings allowed
- `npm run format`: runs Prettier over `src/**/*.ts`, `src/**/*.tsx`, `src/**/*.css`, and `electron/**/*.ts`

## Persistence

App state is stored locally in `localStorage` through Zustand persistence.

| Key | Store | Contents |
|---|---|---|
| `sgfinance-profile` | profileStore | Shared profile, liabilities, property eligibility fields, and insurance coverage inputs |
| `sgfinance-fire` | fireStore | FIRE assumptions and portfolio-specific inputs |
| `sgfinance-cpf` | cpfStore | CPF projection inputs, toggles, and saved scenarios |
| `sgfinance-property` | propertyStore | Property calculator inputs and comparison state |
| `sgfinance-tax` | taxStore | Additional income, CPF override mode, relief values, and what-if inputs |
| `sgfinance-theme` | themeStore | Active theme choice: `system`, `arctic-calm`, `aurora-pulse`, `retro-radar`, `solar-flare`, `tropical-breeze` |

Older builds may also leave legacy keys such as `cpf_scenarios`, `sgfire_inputs_v1`, or `propsmartpro_v1` in local storage.

## Security

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- External links are opened through Electron shell handling instead of unrestricted window creation
- The preload bridge exposes only `getVersion`, `openExternal`, and `getNativeTheme`

## Data Notes

CPF contribution rates, allocation ratios, BHS, FRS, and grant assumptions are based on published Singapore rules reflected in the codebase for 2024-2025. Income tax calculations target IRAS YA 2025 resident tax brackets and relief rules.

All outputs are estimates and should be treated as planning aids, not financial advice.
