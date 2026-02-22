# Tracking Tool

Electron desktop app for oncology social workers at Swedish Cancer Institute (SCI) to track patient encounters, interventions, and generate reports.

## Tech Stack

- **Runtime**: Electron 33 + React 17 (class components) + TypeScript 4.4
- **UI**: Semantic UI React + Formik (forms) + d3/dc/crossfilter (interactive reports)
- **Data**: NeDB (file-based JSON database) on shared network drive, per-user directories
- **Build**: Create React App (react-scripts) + electron-builder
- **Package manager**: yarn (v1 classic)
- **Linting**: ESLint (airbnb config) + Prettier (single quotes, 99 print width)
- **Tests**: Jest

## Architecture

Context isolation is enabled. The renderer has no direct access to Node.js or Electron APIs. All filesystem, database, and system access goes through IPC:

```
Renderer (React)  <-->  preload.js (contextBridge)  <-->  main process (ipcMain handlers)
  window.trackingTool.*      ipcRenderer.invoke()           fs, NeDB, dialog, clipboard, etc.
```

- `public/preload.js` - Exposes `window.trackingTool` via `contextBridge`
- `public/ipc-handlers.js` - All `ipcMain.handle()` registrations (DB, config, filesystem, dialog, clipboard, shell, logging)
- `public/reporting-service.js` - Reporting I/O pipeline (file copying, NeDB access, migrations) in main process
- `src/electron-api.d.ts` - TypeScript declarations for `window.trackingTool`

## Commands

```
yarn start          # dev mode (CRA + Electron concurrently)
yarn build          # production web build
yarn test           # jest tests
yarn eslint         # lint + fix
yarn dist           # build + package Windows
yarn dist-mac       # package macOS
```

## Project Structure

- `src/App.tsx` - Main app component, page routing (enum-based, no router), encounter list
- `src/forms/` - Encounter forms: Patient, Community, Staff, Other (all use Formik + withFormik HOC)
- `src/reporting/` - Reports: InteractiveReport (dc.js charts), CrisisReport, DataAuditReport, GridReport, LinkMrnReport
- `src/reporting/data.ts` - Pure data transformation, MRN inference, score categorization, plus `transform()` wrapper that calls IPC
- `src/patient-interventions.tsx` - Intervention definitions (groups, field names, descriptions)
- `src/data.ts` - Type exports (Fix, etc.) — NeDB access is now in main process
- `src/store.ts` - Cached root path, file path helpers, async directory management via IPC
- `src/components/FindBar.tsx` - Find-in-page UI using built-in `webContents.findInPage()` via IPC
- `src/options.ts` - Clinic/location/diagnosis options, monthly report grid config
- `src/doctors.ts` - Provider list with active/inactive status
- `src/usernames.ts` - Username-to-name mapping, intern tracking with date-based transitions
- `src/shared-fields.tsx` - Reusable form field components
- `src/constants.ts` - Date formats, tracking start date
- `public/electron.js` - Electron main process (contextIsolation: true, nodeIntegration: false)
- `public/preload.js` - Context bridge exposing `window.trackingTool`
- `public/ipc-handlers.js` - IPC handler registrations
- `public/reporting-service.js` - Reporting pipeline and data migrations (main process)

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
- **No concurrent access** - each user writes only to their own `<username>/encounters.json`; reporting reads all users' files by copying to temp directories first (in `public/reporting-service.js`)
- There is currently no lockfile or single-instance guard (no `requestSingleInstanceLock`); isolation is achieved by per-user data directories
- **Context isolation** - renderer cannot access Node.js APIs; all system access goes through `window.trackingTool.*` IPC bridge

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
