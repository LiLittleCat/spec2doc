---
name: spec2doc
description: "Convert OpenAPI specifications and DDL/SQL into professional Word documents (.docx). Generates API documentation from OpenAPI/Swagger specs and database design documents from DDL statements. Use when the user has an OpenAPI spec file (JSON/YAML) or DDL/SQL and wants to generate a Word document."
user_invocable: true
arguments: "[openapi|ddl] [file-path]"
---

# Spec2Doc - API & Database Documentation Generator

Generate professional Word documents (.docx) from OpenAPI specifications or DDL/SQL statements. Fully self-contained - uses OOXML templates and Python standard library only, no external packages needed.

## Usage

- `/spec2doc openapi <file-path>` - Generate API documentation from OpenAPI spec
- `/spec2doc ddl <file-path>` - Generate database documentation from DDL
- `/spec2doc` - Interactive mode (ask user for input type and file)

## Architecture

```
spec2doc/
├── SKILL.md              # This file
├── docx-js.md            # docx npm library reference (from docx skill)
├── ooxml.md              # OOXML XML patterns reference (from docx skill)
├── scripts/
│   ├── generate.py       # DocxBuilder - self-contained .docx generator
│   ├── document.py       # Document class for editing existing .docx (from docx skill)
│   └── utilities.py      # XMLEditor base class (from docx skill)
├── ooxml/scripts/
│   ├── pack.py           # Pack directory → .docx (from docx skill)
│   └── unpack.py         # Unpack .docx → directory (from docx skill)
└── templates/            # OOXML template files with Chinese styles
    ├── [Content_Types].xml
    ├── _rels/.rels
    ├── docProps/{core,app}.xml
    └── word/{document,styles,settings,fontTable,numbering}.xml
```

## Workflow

### 1. Determine Input

If arguments not provided, ask: "请选择文档类型：(1) OpenAPI 接口文档 (2) DDL 数据库文档，并提供文件路径"

### 2. Read and Parse

Read the input file. Claude parses all content natively - no external parsers needed.

**OpenAPI**: Read JSON/YAML, extract info, servers, paths. Resolve all `$ref` to `components/schemas`. Group endpoints by tags. For each endpoint: method, path, summary, description, parameters, requestBody, responses. Build example JSON from schema if no explicit example. Flatten nested objects with dot notation.

**DDL**: Read SQL, extract CREATE TABLE statements. For each table: name, comment, columns (name, type, nullable, primary key, foreign key, default, comment), indexes. Handle `COMMENT ON` (PostgreSQL), `COMMENT 'xxx'` (MySQL).

### 3. Generate Document

Create a Python script that uses `DocxBuilder` from `scripts/generate.py` to build the document.

**Locate the skill root** (directory containing `scripts/` and `templates/`):
```bash
find ~/.claude/skills -name "generate.py" -path "*/spec2doc/scripts/*" 2>/dev/null | head -1
# Example: /c/Users/user/.claude/skills/spec2doc/scripts/generate.py
# Skill root: /c/Users/user/.claude/skills/spec2doc
```

**Run with PYTHONPATH**:
```bash
PYTHONPATH=/path/to/spec2doc python your_script.py
```

**In your script**:
```python
from scripts.generate import DocxBuilder

builder = DocxBuilder(title="xxx 接口文档", date="2024-01-01")
# ... build content ...
builder.save("output.docx")
```

### 4. Clean Up

Delete the generated Python script after successful generation. Inform user of output file path.

---

## DocxBuilder API Reference

```python
from scripts.generate import DocxBuilder

builder = DocxBuilder(title="Document Title", date="2024-03-13")

# ── Structure ──
builder.add_title("文档标题")             # Title style: 22pt bold centered
builder.add_subtitle("副标题")            # Subtitle: 12pt centered gray
builder.add_heading1("一级标题")          # H1: 16pt bold, outline level 0
builder.add_heading2("二级标题")          # H2: 14pt bold, outline level 1
builder.add_heading3("三级标题")          # H3: 12pt bold, outline level 2
builder.add_toc("目录")                   # Table of Contents field
builder.add_page_break()                  # Page break
builder.add_empty_paragraph()             # Empty line

# ── Text ──
builder.add_paragraph("正文文本")
builder.add_paragraph("粗体居中", bold=True, center=True)
builder.add_paragraph("自定义", color="2563EB", size=24, font="Consolas")

# ── Tables ──
builder.add_table(
    headers=["参数名", "类型", "必填", "说明"],
    rows=[
        ["id", "integer", "是", "用户ID"],                     # Simple strings
        [{"text": "name", "mono": True}, "string", "否", ""],  # Dict for cell options
    ],
    col_widths=[2000, 1500, 800, 5060]  # DXA widths, total ≤ 9360
)

# Key-value table (2 columns)
builder.add_kv_table([
    ("请求方法", "GET", {"color": "059669", "bold": True}),
    ("请求路径", "/api/users", {"mono": True}),
    ("Content-Type", "application/json"),
])

# ── Code Block ──
builder.add_code_block('{\n  "id": 1,\n  "name": "test"\n}')

# ── Save ──
builder.save("output.docx")
```

### Cell Options (dict format)
```python
{"text": "value", "bold": True, "center": True, "mono": True, "color": "FF0000"}
```

---

## Styles Reference

The templates include these pre-defined Chinese styles:

| Style | Font | Size | Notes |
|-------|------|------|-------|
| Normal | Microsoft YaHei | 10.5pt (21) | Default body text |
| Title | Microsoft YaHei | 22pt (44) | Bold, centered |
| Subtitle | Microsoft YaHei | 12pt (24) | Centered, gray |
| Heading 1 | Microsoft YaHei | 16pt (32) | Bold, outline 0 |
| Heading 2 | Microsoft YaHei | 14pt (28) | Bold, outline 1 |
| Heading 3 | Microsoft YaHei | 12pt (24) | Bold, outline 2 |
| Table header | Microsoft YaHei | 10pt (20) | Bold, blue bg |
| Table cell | Microsoft YaHei | 10pt (20) | Normal |
| Code | Consolas | 9pt (18) | Gray, indented |

Colors: Text `#333333`, Headings `#1F2937`, Muted `#6B7280`, Header BG `#EFF6FF`, Border `#D1D5DB`

Method colors: GET `#059669`, POST `#2563EB`, PUT `#D97706`, DELETE `#DC2626`, PATCH `#7C3AED`

---

## API Document Structure (OpenAPI)

Build this structure using DocxBuilder:

```
1. Title Page
   add_title("{spec.info.title} 接口文档")
   add_subtitle("版本 {version}")
   add_paragraph(date, center, gray)
   add_paragraph(baseUrl, center, mono)
   add_paragraph(description)
   add_page_break()

2. Table of Contents
   add_toc("目录")
   add_page_break()

3. For each tag group:
   add_heading1("{tagName}")

   For each endpoint:
     add_heading2("{METHOD} {path}")
     add_paragraph(summary + description)

     add_heading3("基本信息")
     add_kv_table([
       ("请求方法", method, {color, bold}),
       ("请求路径", path, {mono}),
       ("Content-Type", contentType),
     ])

     If path/query/header params:
       add_heading3("请求参数")
       add_table(
         headers=["参数名", "类型", "必填", "说明", "示例"],
         col_widths=[1800, 1200, 800, 3760, 1800]
       )

     If requestBody:
       add_heading3("请求体")
       add_table(
         headers=["参数名", "类型", "必填", "说明"],
         col_widths=[2000, 1400, 800, 5160]
       )
       add_code_block(JSON example)

     For each response:
       add_heading3("响应 {statusCode}")
       add_paragraph(description)
       add_table(
         headers=["字段名", "类型", "说明"],
         col_widths=[2200, 1600, 5560]
       )
       add_code_block(JSON example)
```

---

## Database Document Structure (DDL)

```
1. Title Page
   add_title("{database} 数据库设计文档")
   add_paragraph(date, center, gray)
   add_page_break()

2. Table of Contents
   add_toc("目录")
   add_page_break()

3. Table Overview (if > 3 tables)
   add_heading1("表概览")
   add_table(
     headers=["序号", "表名", "说明"],
     col_widths=[800, 3280, 5280]
   )

4. For each table:
   add_heading1("{tableName}")
   add_paragraph(comment)  # if any

   add_heading2("字段信息")
   add_table(
     headers=["列名", "类型", "可空", "主键", "外键", "默认值", "备注"],
     col_widths=[1300, 1400, 700, 700, 700, 1400, 3160],
     rows=[  # for each column:
       [
         {"text": col.name, "mono": True, "bold": col.isPrimary},
         {"text": col.type, "mono": True, "center": True},
         {"text": "是"/"否", "center": True},
         {"text": "是"/"否", "center": True},
         {"text": "是"/"否", "center": True},
         {"text": col.default or "-", "mono": True, "center": True},
         col.comment or "-",
       ]
     ]
   )

   If indexes:
     add_heading2("索引信息")
     add_table(
       headers=["索引名", "类型", "包含列"],
       col_widths=[2800, 1560, 5000],
       rows=[[name, "唯一索引"/"普通索引", columns_joined]]
     )
```

---

## Code Generation Rules

1. **Self-contained**: Embed ALL parsed data as Python constants in the generated script
2. **No external deps**: Only uses `scripts/generate.py` which uses Python standard library
3. **Chinese locale**: Labels in Chinese (是/否, 参数名, 类型, etc.), dates as YYYY-MM-DD
4. **Empty/null values**: Display as "-"
5. **Required/Nullable**: Express as "是" or "否"
6. **JSON examples**: 2-space indent, rendered via `add_code_block()`
7. **$ref resolution**: Fully resolve all OpenAPI references before embedding data
8. **Nested objects**: Flatten with dot notation (e.g., "data.user.name")
9. **allOf/oneOf/anyOf**: Merge schemas
10. **Method colors**: Use `METHOD_COLORS` dict from generate.py
11. **Clean up**: Delete the generated script after successful .docx generation
12. **Output path**: Same directory as input, e.g., `api.yaml` → `api接口文档.docx`

## Editing Existing Documents

If you need to **edit** an existing .docx (not create from scratch), use the OOXML tools:

1. Read `ooxml.md` for XML patterns
2. Unpack: `python ooxml/scripts/unpack.py doc.docx unpacked/`
3. Edit XML with `scripts/document.py` (set `PYTHONPATH` to skill root)
4. Pack: `python ooxml/scripts/pack.py unpacked/ output.docx`

## Error Handling

- File not found → inform user
- Invalid OpenAPI (missing `openapi`/`swagger`, `info`, `paths`) → inform user
- No tables in DDL → inform user
- Script execution error → show error, keep script for debugging
