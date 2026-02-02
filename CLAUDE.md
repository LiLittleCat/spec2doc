# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Spec2Doc is a Tauri 2 + React desktop application that converts OpenAPI specifications and database structures into standardized Word documents (.docx). The current version focuses on UI and workflow, with parsing and generation logic using mock data.

## Architecture

### Tauri Hybrid Architecture

This is a **Tauri 2 hybrid desktop app** with:
- **Frontend**: React 18 + Vite 5 running on port `1420`
- **Backend**: Rust (Tauri) for native desktop integration
- **Routing**: Uses `HashRouter` when running in Tauri, `BrowserRouter` otherwise (detected via `__TAURI_INTERNALS__` or `__TAURI__` in window)

### Directory Structure

```
spec2doc/
  src/                    # React frontend
    components/
      layout/             # Layout components (Sidebar)
      panels/             # Main feature panels (OpenAPI, Database, Generate, Settings, Help)
      ui/                 # shadcn/ui components
    hooks/                # React hooks (theme, toast, mobile)
    pages/                # Route pages (Index, NotFound)
    lib/                  # Utilities
  src-tauri/              # Rust backend
    src/
      lib.rs              # Tauri commands and app setup
      main.rs             # Entry point
    tauri.conf.json       # Tauri configuration
    Cargo.toml            # Rust dependencies
  public/                 # Static assets
  assets/                 # Templates and resources
```

### Frontend Architecture

- **Main Layout**: `src/pages/Index.tsx` uses tab-based navigation with a `Sidebar` component
- **Five Main Panels**:
  - `OpenAPIPanel`: OpenAPI spec import (paste/file selection for YAML/JSON)
  - `DatabasePanel`: Database structure import (connection config or DDL)
  - `GeneratePanel`: Document generation with progress simulation
  - `SettingsPanel`: Application settings
  - `HelpPanel`: Help and documentation
- **UI Library**: shadcn/ui with Tailwind CSS and Radix UI primitives
- **State Management**: React Query (@tanstack/react-query) for data fetching
- **Theme**: next-themes for dark/light mode support

### Tauri Configuration

- **Window**: 1200x800 default, 800x600 minimum
- **Plugins Enabled**:
  - `dialog`: File open/save dialogs (all permissions)
  - `fs`: File system access (read/write with scope: $HOME, $DESKTOP, $DOCUMENT, $DOWNLOAD)
  - `opener`: Open external URLs/files
- **Security**: CSP is disabled (`null`)

### Key Dependencies

- **Parsing**: `@apidevtools/swagger-parser` (OpenAPI), `sql-ddl-to-json-schema` (DDL)
- **Document Generation**: `docx` for Word file creation
- **Tauri Plugins**: `@tauri-apps/plugin-dialog`, `@tauri-apps/plugin-fs`, `@tauri-apps/plugin-opener`

## Development Commands

### Package Manager
Use **pnpm** exclusively. After installing dependencies, run `pnpm approve-builds` to approve post-install scripts for @swc/core, esbuild, and sharp.

### Development
```bash
# Frontend only (preview in browser)
pnpm dev

# Full desktop app (recommended)
pnpm tauri dev
```

### Building
```bash
# Development build
pnpm build:dev

# Production build
pnpm build

# Tauri desktop app build
pnpm tauri build
```

### Testing
```bash
# Run tests once
pnpm test

# Watch mode
pnpm test:watch
```

### Linting
```bash
pnpm lint
```

## Path Alias

The codebase uses `@/` as an alias for `./src/`. All imports from the src directory should use this alias:
```typescript
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
```

## Current Status & Future Work

- **Complete**: UI workflow, all panels functional, theme support
- **Mock Data**: OpenAPI parsing, database parsing, and docx generation are currently simulated
- **Planned**:
  - Real OpenAPI spec parsing implementation
  - Database schema parsing (DDL and connection-based)
  - Actual docx file generation with templates
  - Tauri dialog/fs integration for file selection and output path management

## Important Notes

- Development server runs on port **1420** (configured in vite.config.ts and tauri.conf.json)
- Frontend build output goes to `dist/` (referenced as `frontendDist` in Tauri config)
- Tauri uses `HashRouter` for routing (file:// protocol compatibility)
- If you see "Unknown env config '_jsr-registry'" warnings from npm, ignore them - pnpm is the correct package manager
