# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Spec2Doc is a Tauri 2 + React desktop application that converts OpenAPI specifications and database structures into standardized Word documents (.docx). It uses docxtemplater with customizable .docx templates to generate professional documents.

## Architecture

### Tauri Hybrid Architecture

This is a **Tauri 2 hybrid desktop app** with:
- **Frontend**: React 19 + Vite 7 running on port `1420`
- **Backend**: Rust (Tauri) for native desktop integration
- **Routing**: Uses `HashRouter` when running in Tauri, `BrowserRouter` otherwise (detected via `__TAURI_INTERNALS__` or `__TAURI__` in window)

### Directory Structure

```
spec2doc/
  src/                    # React frontend
    components/
      layout/             # Layout components (Sidebar)
      panels/             # Feature panels (OpenAPI, Database, Settings, Help)
      ui/                 # shadcn/ui components (14 components)
    hooks/                # React hooks (use-theme, use-mobile, use-updater)
    services/             # Business logic (documentService, docxGenerator)
    pages/                # Route pages (Index, NotFound)
    lib/                  # Utilities (defaultPath, generationSettings, templateSettings, utils)
  src-tauri/              # Rust backend
    src/
      lib.rs              # Tauri commands and app setup
      main.rs             # Entry point
    capabilities/         # Tauri permission capabilities
    tauri.conf.json       # Tauri configuration
    Cargo.toml            # Rust dependencies
  assets/                 # Document templates (.docx)
  public/                 # Static assets
```

### Frontend Architecture

- **Main Layout**: `src/pages/Index.tsx` uses tab-based navigation with a `Sidebar` component
- **Four Main Panels**:
  - `OpenAPIPanel`: OpenAPI spec import (paste/file), parsing, and document generation
  - `DatabasePanel`: Database structure import (DDL/connection), parsing, and document generation; SSH tunnel with independent toggle/expand
  - `SettingsPanel`: Theme, output directory, template paths, generation options, about section with version info and update check
  - `HelpPanel`: Quick start guide, template reference, FAQ
- **UI Library**: shadcn/ui (Radix UI primitives) with Tailwind CSS v4
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite` plugin (no tailwind.config.ts), CSS variables for theming in `src/index.css`
- **State Management**: React Query (@tanstack/react-query) for data fetching
- **Theme**: next-themes for dark/light/system mode support
- **Icons**: lucide-react

### Tauri Configuration

- **Product Name**: Spec2Doc
- **Window**: 1200x800 default, 800x600 minimum
- **Bundle Target**: NSIS installer (Windows)
- **Bundled Resources**: Templates are mapped to install root via resource map in `tauri.conf.json`:
  ```json
  "resources": {
    "../assets/接口文档模板.docx": "接口文档模板.docx",
    "../assets/数据库设计文档模板.docx": "数据库设计文档模板.docx"
  }
  ```
- **Capabilities** (defined in `src-tauri/capabilities/default.json`):
  - `dialog`: File open/save dialogs
  - `fs`: File system access (read/write for document, desktop, download, home, resource scopes)
  - `updater`: Auto-update support
  - `process`: App restart (for applying updates)
- **Updater**: Configured with minisign public key; signing keys stored in `.tauri/` (gitignored)
- **Security**: CSP is disabled (`null`)

### Key Dependencies

- **Parsing**: `@apidevtools/swagger-parser` (OpenAPI), `sql-ddl-to-json-schema` (DDL)
- **Document Generation**: `docxtemplater` + `pizzip` for template-based .docx generation
- **Tauri Plugins**: `@tauri-apps/plugin-dialog`, `@tauri-apps/plugin-fs`, `@tauri-apps/plugin-updater`, `@tauri-apps/plugin-process`
- **Linting/Formatting**: Biome (`@biomejs/biome`) — configured in `biome.json`

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

# Tauri desktop app build (requires signing key env vars)
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content .tauri\spec2doc.key -Raw
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "your-password"
pnpm tauri build
```

### Testing
```bash
# Run tests once
pnpm test

# Watch mode
pnpm test:watch
```

### Linting & Formatting (Biome)
```bash
# Check for issues
pnpm lint

# Auto-fix issues
pnpm lint:fix

# Format code
pnpm format
```

## Path Alias

The codebase uses `@/` as an alias for `./src/`. All imports from the src directory should use this alias:
```typescript
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
```

## shadcn/ui Components

Components are installed in `src/components/ui/` via `pnpm dlx shadcn@latest add <component>`. Currently installed: accordion, badge, button, checkbox, dialog, input, label, progress, radio-group, select, switch, tabs, textarea, tooltip.

Configuration is in `components.json`. When adding new shadcn components, use:
```bash
set NODE_OPTIONS=--max-old-space-size=4096 && pnpm dlx shadcn@latest add <component-name>
```

## CI/CD

### CI Workflow (`.github/workflows/ci.yml`)
Runs on push to `main` and PRs targeting `main`. Steps: lint (Biome), test (Vitest), frontend build, and `cargo check` (Rust). Runs on `ubuntu-latest` only.

### Release Workflow (`.github/workflows/release.yml`)
Triggered by pushing a tag matching `v*`. Builds Tauri installers for Linux, macOS (aarch64), and Windows using `tauri-apps/tauri-action`. Automatically creates a GitHub Release with signed update bundles and `latest.json` for auto-update.

**Required secrets**: `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

**Release process**:
```bash
# 1. Update version in package.json and src-tauri/tauri.conf.json
# 2. Commit and push
# 3. Tag and push
git tag v0.1.0
git push origin v0.1.0
```

## Current Status & Future Work

- **Complete**: UI workflow, all panels functional, theme support, template-based docx generation with docxtemplater, OpenAPI parsing, DDL parsing, database connection form with SSH tunnel, Tauri dialog/fs integration, auto-update with settings panel check and update dialog, CI/CD workflows, NSIS installer packaging, v0.1.0 release
- **Planned**:
  - Database connection-based schema extraction (backend implementation)
  - Additional template customization options

## Important Notes

- Development server runs on port **1420** (configured in vite.config.ts and tauri.conf.json)
- Frontend build output goes to `dist/` (referenced as `frontendDist` in Tauri config)
- Tauri uses `HashRouter` for routing (file:// protocol compatibility)
- Tailwind CSS v4 uses the Vite plugin (`@tailwindcss/vite`), not a separate config file
- Biome ignores `assets/` and `scripts/` directories (configured in `biome.json`)
- `.gitignore` uses `/test/` (root only) to avoid ignoring `src/test/` test files
- Signing keys are stored in `.tauri/` and gitignored — never commit private keys
- If you see "Unknown env config '_jsr-registry'" warnings from npm, ignore them — pnpm is the correct package manager
