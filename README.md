# Spec2Doc

![Spec2Doc Logo](assets/logo.svg)

Spec2Doc 是一个**规范驱动的文档生成器**：从 **OpenAPI 规范** + **数据库结构（连接反射 / DDL）** 自动生成标准化的 **接口设计** 与 **数据库设计** Word 文档（`.docx`）。  
目标：减少重复写文档的时间，让输出更统一、更易推广。

---

## 功能概览

- ✅ 导入 OpenAPI（YAML/JSON）
- ✅ 连接数据库并反射表结构（SQLAlchemy Inspector）
- ✅ 生成 Word 文档
  - 推荐：使用 **docxtpl 模板**渲染（排版/样式由模板控制，更像“人工写的”）
  - 备选：无模板时使用 **python-docx** 生成简版文档
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

## Word 模板（docxtpl）如何对接

Spec2Doc 使用 `docxtpl` 渲染 `.docx` 模板：模板中写 Jinja2 占位符/循环语句，程序传入 `context` 数据字典。

程序会向模板提供（示例）：

```json
{
  "api": {
    "title": "API",
    "version": "1.0.0",
    "endpoints": [
      {
        "method": "GET",
        "path": "/users",
        "summary": "list users",
        "operationId": "listUsers",
        "parameters": [],
        "requestBody": {},
        "responses": {},
        "security": []
      }
    ]
  },
  "db": {
    "tables": [
      {
        "name": "user",
        "columns": [
          {"name": "id", "type": "BIGINT", "nullable": false, "default": null}
        ],
        "pk": ["id"],
        "indexes": [],
        "foreign_keys": []
      }
    ]
  }
}
```

模板里可以使用：

* 变量：`{{ api.title }}`、`{{ api.version }}`
* 循环：`{% for ep in api.endpoints %} ... {% endfor %}`
* 自定义字段：`{{ api.<key> }}`、`{{ ep.<key> }}`

自定义字段填写方式（GUI「自定义字段」区域）：
- 每行一条 key/value（如 `server=设备管理后台服务`）
- 模板里用：`{{ ep.server }}` / `{{ api.server }}`

### 模板变量清单

**顶层变量**
- `api`：接口模型
- `db`：数据库模型

**接口模型（api）**
- `api.title`：接口文档标题
- `api.version`：版本号（来自 OpenAPI info.version）
- `api.endpoints`：接口列表

**接口项（ep）**
- `ep.method`：HTTP 方法（GET/POST/PUT/...）
- `ep.path`：接口路径
- `ep.summary`：摘要
- `ep.description`：描述
- `ep.operationId`：操作 ID
- `ep.tags`：标签数组
- `ep.parameters`：原始 OpenAPI parameters（未展开）
- `ep.requestBody`：原始 OpenAPI requestBody
- `ep.responses`：原始 OpenAPI responses
- `ep.security`：原始 OpenAPI security
- `ep.request_content_type`：请求体 content-type（取第一个）
- `ep.req_fields`：请求参数字段（由 schema 推导）
- `ep.resp_fields`：响应参数字段（由 schema 推导）
- `ep.param_fields`：parameters 字段（query/path/header/cookie）
- `ep.req_nested` / `ep.resp_nested`：嵌套结构字段集合（按路径分组）

**字段项（f in ep.req_fields / ep.resp_fields）**
- `f.name`：字段名
- `f.type`：字段类型（$ref 会简化为类型名）
- `f.required`：是否必填
- `f.description`：字段描述

**数据库模型（db）**
- `db.tables`：表列表

**表项（t in db.tables）**
- `t.name`：表名
- `t.columns`：字段列表
- `t.pk`：主键字段名数组
- `t.indexes`：索引列表（SQLAlchemy inspector 原始结构）
- `t.foreign_keys`：外键列表（SQLAlchemy inspector 原始结构）

**字段项（c in t.columns）**
- `c.name`：字段名
- `c.type`：字段类型（字符串）
- `c.nullable`：是否可空
- `c.default`：默认值

> 说明：若 OpenAPI 未提供 requestBody/responses 或 schema 无字段信息，`req_fields`/`resp_fields` 可能为空。

**接口参数表的推荐方式（避免表格错列）：**
- 在「请求参数（parameters）」表格中保留一行样例，内容为占位符：  
  `__PARAM_NAME__` / `__PARAM_TYPE__` / `__PARAM_REQUIRED__` / `__PARAM_DESC__`
- 在「请求参数」表格中保留一行样例，内容为占位符：  
  `__REQ_NAME__` / `__REQ_TYPE__` / `__REQ_REQUIRED__` / `__REQ_DESC__`
- 在「返回参数」表格中保留一行样例，内容为占位符：  
  `__RESP_NAME__` / `__RESP_TYPE__` / `__RESP_REQUIRED__` / `__RESP_DESC__`
- 嵌套结构表格占位符：  
  `__REQ_NESTED_NAME__` / `__REQ_NESTED_TYPE__` / `__REQ_NESTED_REQUIRED__` / `__REQ_NESTED_DESC__`  
  `__RESP_NESTED_NAME__` / `__RESP_NESTED_TYPE__` / `__RESP_NESTED_REQUIRED__` / `__RESP_NESTED_DESC__`
- 程序渲染后会自动复制该行并填充字段，不再依赖 docxtpl 的表格行循环。

> 建议：模板可参考 `template.docx`，如需扩展字段，保持占位符一致即可。

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
  word_render.py       # docxtpl/python-docx 输出
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

