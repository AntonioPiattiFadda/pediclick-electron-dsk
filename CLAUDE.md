# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PediClick Market-Store is a desktop POS (Point-of-Sale) application built with Electron + React. It manages in-store and delivery orders, integrates with physical hardware (scales, thermal printers, barcode readers), and uses Supabase as its backend.

## Commands

- **Dev server:** `npm run dev` (Vite + Electron with hot reload)
- **Build (Windows):** `npm run build` (tsc → vite build → electron-builder, produces NSIS installer)
- **Build (Linux):** `npm run build:linux` (produces AppImage)
- **Lint:** `npm run lint`

There are no tests configured in this project.

## Architecture

### Two-Process Electron Model

**Main process** (`electron/`): Window management, IPC handlers, hardware drivers, Express server on port 3000, auto-updater via `electron-updater`.

**Renderer process** (`src/`): React SPA using hash-based routing (`HashRouter`), loaded via Vite dev server in dev or `dist/index.html` in production.

**Preload** (`electron/preload.ts`): Context bridge exposing typed APIs on `window` — `window.serial`, `window.usb`, `window.printer`, `window.scale`, `window.scaleAPI`. Types declared in `src/types/global.d.ts`.

### Hardware Integration

- **Scales:** `scaleManager.tsx` spawns a native C++ subprocess (`public/bin/scale_reader.exe`) that reads serial port data. Weight is streamed to renderer via IPC event `scale-weight` → consumed in `ScaleContext`.
- **Printers:** `printerManager.tsx` communicates with USB thermal printers using ESC/POS commands built by `printerBufferFactory.tsx`. Uses `node-usb` directly (requires WinUSB driver via Zadig).
- **Serial/USB enumeration:** `serialManager.ts` and `usbManager.ts` list available devices via IPC.

Native modules (`serialport`, `usb`) are externalized in Vite's Rollup config — they run only in the main process.

### State Management (Hybrid)

- **Redux Toolkit** (`src/stores/`): Global user/auth state only (`userSlice`).
- **React Context** (`src/context/`): Feature-specific state — `OrderContext` (orders, cart, pricing, product selection), `ScaleContext` (weight data), `ShortCutContext` (keyboard shortcuts), `ModalsContext` (modal visibility).
- **React Query** (`@tanstack/react-query`): Server state — products, clients, locations, etc. fetched from Supabase.

Provider nesting order in `App.tsx`: QueryClient → Scale → ShortCut → Modals → Order → Redux → Router.

### Service Layer (`src/service/`)

All Supabase communication lives here. `src/service/index.tsx` creates the Supabase client using `VITE_APP_SUPABASE_URL` and `VITE_APP_SUPABASE_ANON_KEY` env vars. Services use Supabase RPC functions for atomic operations (e.g., `register_order` saves order + items + payments in one call).

### Routes

`/` and `/login` → Login | `/select-terminal` → Terminal selection | `/select-store` → Store selection | `/in-site-orders` → Main POS | `/delivery-orders` → Delivery orders

### Path Alias

`@/` maps to `./src/` (configured in both `vite.config.ts` and `tsconfig.json`).

### IPC Channels

| Channel | Direction | Purpose |
|---|---|---|
| `list-serial-ports` | renderer→main | Enumerate COM ports |
| `list-usb-devices` | renderer→main | Enumerate USB devices |
| `print` | renderer→main | Send print job (vendorId, productId, printFunction, content) |
| `connect-scale` | renderer→main | Start scale subprocess on COM port |
| `scale-weight` | main→renderer | Stream weight data (weight, isScaleConnected, isScaleError) |

### UI Components

Uses shadcn/ui pattern: Radix UI primitives wrapped in `src/components/ui/` with TailwindCSS v4 styling. `class-variance-authority` for variant management, `tailwind-merge` + `clsx` via `src/lib/utils.ts`.

## Environment

Copy `.env_example` to `.env` and fill in:
```
VITE_APP_SUPABASE_URL=
VITE_APP_SUPABASE_ANON_KEY=
```

## Build Output

- Renderer bundle: `dist/`
- Electron main bundle: `dist-electron/`
- Installer output: `release/{version}/`
- Native binaries bundled from `public/bin/` into `resources/bin/`
