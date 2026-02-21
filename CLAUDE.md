# Tracking Tool

Electron desktop app for oncology social workers at Swedish Cancer Institute (SCI) to track patient encounters, interventions, and generate reports.

## Tech Stack

- **Runtime**: Electron 13 + React 17 (class components) + TypeScript 4.4
- **UI**: Semantic UI React + Formik (forms) + d3/dc/crossfilter (interactive reports)
- **Data**: NeDB (file-based JSON database) on shared network drive, per-user directories
- **Build**: Create React App (react-scripts) + electron-builder
- **Package manager**: yarn (v1 classic)
- **Linting**: ESLint (airbnb config) + Prettier (single quotes, 99 print width)
- **Tests**: Jest with `@jest-runner/electron` environment

## Commands

```
yarn start          # dev mode (CRA + Electron concurrently)
yarn build          # production web build
yarn test           # jest tests in electron environment
yarn eslint         # lint + fix
yarn dist           # build + package Windows
yarn dist-mac       # package macOS
```


## Project Structure

- `src/App.tsx` - Main app component, page routing (enum-based, no router), encounter list
- `src/forms/` - Encounter forms: Patient, Community, Staff, Other (all use Formik + withFormik HOC)
- `src/reporting/` - Reports: InteractiveReport (dc.js charts), CrisisReport, DataAuditReport, GridReport, LinkMrnReport
- `src/reporting/data.ts` - Data transformation, MRN inference, score categorization
- `src/patient-interventions.tsx` - Intervention definitions (groups, field names, descriptions)
- `src/data.ts` - NeDB access, data migrations (UUID-tracked)
- `src/store.ts` - electron-store config, file path helpers, directory management
- `src/options.ts` - Clinic/location/diagnosis options, monthly report grid config
- `src/doctors.ts` - Provider list with active/inactive status
- `src/usernames.ts` - Username-to-name mapping, intern tracking with date-based transitions
- `src/shared-fields.tsx` - Reusable form field components
- `src/constants.ts` - Date formats, tracking start date
- `public/electron.js` - Electron main process

## Domain Concepts

- **Encounter types**: Patient (most complex), Community, Staff, Other
- **Interventions**: ~50 social work interventions across groups (Crisis, Financial, Psychological, Care Coordination, etc.), stored as boolean fields on encounters
- **Scored assessments**: PHQ (depression), GAD (anxiety), MoCA (cognitive) - tracked with scores and severity labels
- **MRN linkage**: Providence MRN (600 + 8 digits) and Swedish MRN (100 + 7 digits), with inference logic to map between them
- **Locations**: Ballard, Cherry Hill, Edmonds, Issaquah, First Hill, True Cancer Center - each with a subset of clinics
- **Access control**: Hardcoded username lists in `App.tsx` (`canSeeReporting`, `canSeeAuditReport`)

## Constraints

- **No server components or network access** - the app is fully offline, all data lives on the filesystem
- **No file locking** - data is on a shared network drive where locking is unreliable; do not introduce solutions that depend on correct locking behavior
- **No concurrent access** - each user writes only to their own `<username>/encounters.json`; reporting reads all users' files by copying to temp directories first (`src/reporting/data.ts`)
- There is currently no lockfile or single-instance guard (no `requestSingleInstanceLock`); isolation is achieved by per-user data directories

## Data Storage

NeDB stores data as JSON files on a shared network drive:
```
<root>/
  tracking-tool-root.txt   # sentinel file to validate directory
  <username>/
    encounters.json
    backups/<timestamp>.json
  fixes/
    fixes.json
```

Root path configured via electron-store on first run. Default paths point to `S:\` or `G:\` network drives.

## CI/CD

- GitHub Actions: `.github/workflows/build.yml` - Windows build + Azure code signing on `v*` tags
- Releases via `release-it` with GitHub releases and artifact upload
