from __future__ import annotations

from pathlib import Path
from typing import Optional

def render_word_docs(api_model: dict, db_model: dict, template_path: Optional[str], output_dir: str) -> list[str]:
    out_dir = Path(output_dir).resolve()
    out_files: list[str] = []

    if template_path:
        # 模板驱动：排版最好、最适合推广
        from docxtpl import DocxTemplate

        tpl = DocxTemplate(template_path)
        context = {
            "api": api_model,
            "db": db_model,
        }
        tpl.render(context)

        out_path = out_dir / "Spec2Doc_设计文档.docx"
        tpl.save(str(out_path))
        out_files.append(str(out_path))
        return out_files

    # 无模板：先生成一个“简版文档”证明流程通了
    from docx import Document

    doc = Document()
    doc.add_heading(f"{api_model.get('title', 'API')} 设计文档", level=0)

    # API section
    doc.add_heading("接口设计", level=1)
    eps = api_model.get("endpoints", [])
    doc.add_paragraph(f"接口数量：{len(eps)}")

    for ep in eps[:200]:  # 防止太大先截断，可自行改
        doc.add_heading(f"{ep['method']} {ep['path']}", level=2)
        if ep.get("summary"):
            doc.add_paragraph(f"摘要：{ep['summary']}")
        if ep.get("operationId"):
            doc.add_paragraph(f"operationId：{ep['operationId']}")

    # DB section
    doc.add_heading("数据库设计", level=1)
    tables = db_model.get("tables", [])
    doc.add_paragraph(f"表数量：{len(tables)}")

    for t in tables[:200]:
        doc.add_heading(f"表：{t['name']}", level=2)
        table = doc.add_table(rows=1, cols=4)
        hdr = table.rows[0].cells
        hdr[0].text = "字段"
        hdr[1].text = "类型"
        hdr[2].text = "可空"
        hdr[3].text = "默认值"
        for c in t.get("columns", []):
            row = table.add_row().cells
            row[0].text = str(c.get("name", ""))
            row[1].text = str(c.get("type", ""))
            row[2].text = "YES" if c.get("nullable", True) else "NO"
            row[3].text = str(c.get("default", "") or "")

    out_path = out_dir / "Spec2Doc_简版.docx"
    doc.save(str(out_path))
    out_files.append(str(out_path))
    return out_files
