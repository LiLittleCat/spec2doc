# Spec2Doc

![Spec2Doc Logo](assets/logo.svg)

Spec2Doc 是一个**规范驱动的文档生成器**：从 **OpenAPI 规范** + **数据库结构（连接反射 / DDL）** 自动生成标准化的 **接口设计** 与 **数据库设计** Word 文档（`.docx`）。  
目标：减少重复写文档的时间，让输出更统一、更易推广。

---

## 功能概览

- ✅ 导入 OpenAPI（YAML/JSON）
- ✅ 连接数据库并反射表结构（SQLAlchemy Inspector）
- ✅ 生成 Word 文档
  - 接口文档统一使用 **python-docx** 生成通用模板（无需 Jinja）
  - 可选加载 `.docx` 模板继承样式/页眉页脚
  - 数据库文档暂保留 **docxtpl** 模板渲染能力
- ✅ GUI 桌面应用（PySide6 / Qt，接口转文档 / 数据库转文档两个 Tab）
- ✅ 每个 Tab 支持上传文件或粘贴内容，带日志与进度条
- ✅ 支持多文件批量生成（OpenAPI/DDL 可多选）
- ✅ 输出目录一键打开
- ✅ 自定义模板字段（key/value，注入到 api / ep）
- ✅ 生成核心逻辑已剥离为独立模块，便于改 GUI 或做 CLI/服务化

> 说明：目前版本偏 MVP，输出内容可逐步扩展（参数表、响应字段展开、错误码、索引/外键/注释、ER 图等）。

---

## 截止当前支持的数据源

### OpenAPI
- OpenAPI 3.x / 2.0（视你的 spec 内容而定）
- 支持 `.yaml/.yml/.json`

### 数据库（通过连接反射）
- 通过 SQLAlchemy 支持的数据库均可尝试
- 常见示例：
  - MySQL：`mysql+pymysql://user:pass@host:3306/dbname?charset=utf8mb4`
  - PostgreSQL：`postgresql+psycopg://user:pass@host:5432/dbname`

> 若出现 `No module named 'pymysql'` / `psycopg` 等错误，安装对应驱动即可（见下文）。

---

## 快速开始

### 1) 创建并激活虚拟环境（Windows 示例）
```bash
python -m venv env
env\Scripts\activate
````

macOS/Linux：

```bash
python3 -m venv env
source env/bin/activate
```

### 2) 安装依赖

```bash
pip install -r requirements.txt
```

#### 数据库驱动（按你使用的 DB 安装）

* MySQL：

```bash
pip install pymysql
```

* PostgreSQL：

```bash
pip install "psycopg[binary]"
```

---

## 运行

```bash
python app.py
```

运行后在 GUI 中：

1. 选择「接口转文档」或「数据库转文档」Tab
2. 上传文件或粘贴内容（可多选文件；若两者同时存在，**优先使用粘贴内容**）
3. 选择 Word 模板（可选）
4. 选择输出目录
5. 点击生成按钮
6. 可点击「打开输出文件夹」快速打开目录

输出文件名规则：
- 若选择文件：输出为同名 `.docx`（同名冲突会自动加后缀 `_2`、`_3`）
- 若粘贴内容：使用默认时间戳命名

数据库 Tab：
- 支持直接填写 DB URL 连接反射
- 或提供 DDL 文件/粘贴 DDL（若 DB URL 和 DDL 同时存在，**优先使用 DB 连接**）

---

## 接口文档模板（python-docx）

Spec2Doc 使用 `python-docx` 生成接口文档，不依赖 Jinja。  
模板文件（`.docx`）用于继承样式/页眉页脚，文档内容会由程序按结构生成并追加。

覆盖范围包括：
- OpenAPI `info`（title/version/description 等）
- `servers`、`tags`、`security`、`paths`
- 路径/接口描述、路径参数、query 参数、body 参数
- 响应与响应字段、请求示例、响应示例
- `components`（schemas/parameters/responses/requestBodies/headers/securitySchemes/examples/links/callbacks）
- `x-` 扩展字段与自定义字段

### 自定义字段

GUI「自定义字段」区域每行一条 key/value（如 `server=设备管理后台服务`），  
生成后会写入文档的“自定义字段/接口自定义字段”区域。

### 数据库模板（docxtpl）

数据库文档仍保留 docxtpl 渲染能力，若后续也迁移为 python-docx，可再调整。

---

## 项目结构

```
spec2doc/
  app.py               # 入口
  ui_main.py           # PySide6 GUI
  workers.py           # 线程池任务封装
  models.py            # 数据结构（避免循环 import）
  generators.py        # 主流程：解析 -> 反射 -> 渲染
  parsers.py           # OpenAPI 读取与中间模型
  db_introspect.py     # DB 结构反射
  word_render.py       # API: python-docx / DB: docxtpl
  api_doc_service.py   # 接口文档核心逻辑（可独立调用）
  db_doc_service.py    # 数据库文档核心逻辑（可独立调用）
  requirements.txt
```

---

## 常见问题


---

## 打包（PyInstaller）

Windows 示例：

```bash
pip install pyinstaller
pyinstaller -F -w app.py --name Spec2Doc
```

产物位于 `dist/`。

---

## Roadmap（建议）

* [ ] 完整接口详情输出：参数表、请求体 schema 展开、响应 schema 展开
* [ ] 错误码 / 权限 / 认证说明自动汇总
* [ ] 表字段注释、索引、外键关系更完整展示
* [ ] ER 图导出（graphviz/mermaid）
* [ ] 模板管理与预览、导出多份文档（接口设计 / 数据库设计分离）

---

## License

