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
      ui/                 # shadcn/ui components (13 components)
    hooks/                # React hooks (use-theme, use-mobile)
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
  assets/                 # Templates (.docx) and generation scripts (.cjs)
  public/                 # Static assets
```

### Frontend Architecture

- **Main Layout**: `src/pages/Index.tsx` uses tab-based navigation with a `Sidebar` component
- **Four Main Panels**:
  - `OpenAPIPanel`: OpenAPI spec import (paste/file), parsing, and document generation
  - `DatabasePanel`: Database structure import (DDL), parsing, and document generation
  - `SettingsPanel`: Theme, output directory, template paths, generation options
  - `HelpPanel`: Quick start guide, template reference, FAQ
- **UI Library**: shadcn/ui (Radix UI primitives) with Tailwind CSS v4
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite` plugin (no tailwind.config.ts), CSS variables for theming in `src/index.css`
- **State Management**: React Query (@tanstack/react-query) for data fetching
- **Theme**: next-themes for dark/light/system mode support
- **Icons**: lucide-react

### Tauri Configuration

- **Window**: 1200x800 default, 800x600 minimum
- **Bundled Resources**: `assets/接口文档模板.docx`, `assets/数据库设计文档模板.docx`
- **Capabilities** (defined in `src-tauri/capabilities/default.json`):
  - `dialog`: File open/save dialogs
  - `fs`: File system access (read/write for document, desktop, download, home, resource scopes)
- **Security**: CSP is disabled (`null`)

### Key Dependencies

- **Parsing**: `@apidevtools/swagger-parser` (OpenAPI), `sql-ddl-to-json-schema` (DDL)
- **Document Generation**: `docxtemplater` + `pizzip` for template-based .docx generation
- **Tauri Plugins**: `@tauri-apps/plugin-dialog`, `@tauri-apps/plugin-fs`
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

Components are installed in `src/components/ui/` via `pnpm dlx shadcn@latest add <component>`. Currently installed: accordion, badge, button, checkbox, input, label, progress, radio-group, select, switch, tabs, textarea, tooltip.

Configuration is in `components.json`. When adding new shadcn components, use:
```bash
set NODE_OPTIONS=--max-old-space-size=4096 && pnpm dlx shadcn@latest add <component-name>
```

## Current Status & Future Work

- **Complete**: UI workflow, all panels functional, theme support, template-based docx generation with docxtemplater, OpenAPI parsing, DDL parsing, Tauri dialog/fs integration
- **Planned**:
  - Database connection-based schema import (currently DDL-only)
  - Additional template customization options

## Important Notes

- Development server runs on port **1420** (configured in vite.config.ts and tauri.conf.json)
- Frontend build output goes to `dist/` (referenced as `frontendDist` in Tauri config)
- Tauri uses `HashRouter` for routing (file:// protocol compatibility)
- Tailwind CSS v4 uses the Vite plugin (`@tailwindcss/vite`), not a separate config file
- If you see "Unknown env config '_jsr-registry'" warnings from npm, ignore them — pnpm is the correct package manager
