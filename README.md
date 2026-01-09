# Spec2Doc

Spec2Doc 是一个**规范驱动的文档生成器**：从 **OpenAPI 规范** + **数据库结构（连接反射 / DDL）** 自动生成标准化的 **接口设计** 与 **数据库设计** Word 文档（`.docx`）。  
目标：减少重复写文档的时间，让输出更统一、更易推广。

---

## 功能概览

- ✅ 导入 OpenAPI（YAML/JSON）
- ✅ 连接数据库并反射表结构（SQLAlchemy Inspector）
- ✅ 生成 Word 文档
  - 推荐：使用 **docxtpl 模板**渲染（排版/样式由模板控制，更像“人工写的”）
  - 备选：无模板时使用 **python-docx** 生成简版文档
- ✅ GUI 桌面应用（PySide6 / Qt）
- ✅ 生成过程后台线程执行，带日志与进度条

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

1. 选择 OpenAPI 文件
2. 填写 DB URL（或选择 DDL 文件）
3. 选择 Word 模板（可选）
4. 选择输出目录
5. 点击「一键生成 Word」

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
* 表格行循环：在表格行第一格放 `{% for c in t.columns %}`，最后一格放 `{% endfor %}`，该行会自动复制多行。

> 建议：在渲染前把 context 输出为 `context.debug.json` 方便调试字段名是否对齐。

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

