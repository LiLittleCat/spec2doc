# Spec2Doc

Spec2Doc 是一个基于 Tauri 2 + React 的桌面应用，用于将 OpenAPI 规范与数据库结构转换为标准化的 Word 文档（.docx）。支持自定义 .docx 模板，一键生成专业文档。

## 主要功能

- **OpenAPI 文档生成**：导入 OpenAPI 规范（粘贴或选择 YAML/JSON 文件），自动解析并生成接口文档
- **数据库文档生成**：通过 DDL 导入或数据库连接（支持 SSH 隧道），解析表结构并生成数据库设计文档
- **模板驱动**：基于 docxtemplater，使用 .docx 模板生成文档，支持自定义模板
- **自动更新**：内置版本检查与自动升级功能
- **深色/浅色主题**：支持系统跟随、手动切换

## 技术栈

- **桌面框架**: Tauri 2 (Rust backend + WebView frontend)
- **前端**: React 19 + Vite 7 + TypeScript
- **样式**: Tailwind CSS v4 + shadcn/ui
- **解析**: @apidevtools/swagger-parser (OpenAPI), sql-ddl-to-json-schema (DDL)
- **文档生成**: docxtemplater + pizzip
- **代码质量**: Biome (lint + format), Vitest (test)

## 目录结构

```
spec2doc/
  src/                    # 前端源码 (React)
    components/           # 组件 (layout, panels, ui)
    hooks/                # React hooks
    services/             # 业务逻辑 (文档服务, docx 生成)
    pages/                # 路由页面
    lib/                  # 工具函数
  src-tauri/              # Tauri 后端 (Rust)
  assets/                 # 文档模板 (.docx)
  public/                 # 静态资源
```

## 快速开始

### 前置条件

- Node.js 18+（建议 20+）
- pnpm 10+
- Rust toolchain 与 Tauri 2 依赖（参考 [Tauri 官方文档](https://v2.tauri.app/start/prerequisites/)）

### 安装依赖

```bash
pnpm install
pnpm approve-builds
```

> `approve-builds` 用于批准 @swc/core、esbuild、sharp 等后安装脚本，未执行可能导致启动失败。

### 开发

```bash
# 仅前端预览（浏览器）
pnpm dev

# 完整桌面应用（推荐）
pnpm tauri dev
```

默认开发地址：`http://localhost:1420`

### 构建

```bash
# 构建桌面安装包（需要配置签名密钥环境变量）
pnpm tauri build
```

构建产物为 NSIS 安装包（Windows）。

### 测试与代码检查

```bash
pnpm test          # 运行测试
pnpm lint          # 代码检查
pnpm format        # 代码格式化
```

## 发布流程

1. 更新 `package.json` 和 `src-tauri/tauri.conf.json` 中的版本号
2. 提交并推送代码
3. 创建并推送 tag：
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```
4. GitHub Actions 自动构建多平台安装包并创建 Release

需要配置 GitHub Secrets：`TAURI_SIGNING_PRIVATE_KEY`、`TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

## 常见问题

- **启动提示缺少依赖**：请先 `pnpm install`，再运行 `pnpm approve-builds`
- **npm 提示 Unknown env config "_jsr-registry"**：为 npm 配置警告，不影响 pnpm，可忽略

## License

MIT
