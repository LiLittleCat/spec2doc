# Spec2Doc
Spec2Doc 是一个基于 Tauri + React 的桌面应用，用于将 OpenAPI 规范与数据库结构
转换为标准化的 Word 文档（.docx）。

> 当前版本以 UI/流程为主，解析与生成逻辑仍为模拟数据（待接入真实实现）。

## 主要能力

- OpenAPI 导入：支持粘贴/选择文件（YAML/JSON）
- 数据库结构：连接配置或 DDL 导入（规划中）
- 模板与输出路径选择
- 一键生成文档（当前为模拟进度）
- 设置与帮助面板

## 技术栈

- Tauri 2
- React 18 + Vite 5
- Tailwind CSS + shadcn/ui
- 解析与生成依赖：@apidevtools/swagger-parser、sql-ddl-to-json-schema、docx
## 目录结构

```
spec2doc/
  src/            # 前端源码
  src-tauri/      # Tauri 后端与配置
  public/         # 静态资源
  assets/         # 模板与素材
```

## 快速开始

### 前置条件

- Node.js 18+（建议 20+）
- pnpm 10+
- Rust toolchain 与 Tauri 2 依赖

### 安装依赖

```bash
pnpm install
pnpm approve-builds
```

> 若未执行 approve-builds，@swc/core/esbuild/sharp 等脚本会被阻止，可能导致启动失败。

### 开发

```bash
pnpm dev
pnpm tauri dev
```

默认 devUrl：`http://localhost:1420`

### 构建
```bash
pnpm tauri build
```

## 配置说明

- 开发端口：`1420`（见 `vite.config.ts` 与 `src-tauri/tauri.conf.json`）
- 静态产物：`dist/`（Tauri `frontendDist`）

## 开发提示

- 仅预览前端界面可用 `pnpm dev`
- 桌面应用请用 `pnpm tauri dev`

## 现状与规划

- 当前：UI 完整、流程跑通（解析/生成仍为 Mock）
- 规划：接入真实 OpenAPI 解析、数据库解析与 docx 输出
- 规划：接入 Tauri dialog/fs，完成模板与输出路径选择

## 常见问题

- 启动提示缺少 @vitejs/plugin-react-swc：请先 `pnpm install`，再运行 `pnpm approve-builds`
- npm 提示 Unknown env config "_jsr-registry"：为 npm 配置警告，不影响 pnpm

## License
