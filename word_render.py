from __future__ import annotations

from pathlib import Path
from typing import Optional
from copy import deepcopy

def render_word_docs(
    api_model: dict | None,
    db_model: dict | None,
    template_path: Optional[str],
    output_dir: str,
    include_api: bool = True,
    include_db: bool = True,
    output_filename: Optional[str] = None,
) -> list[str]:
    out_dir = Path(output_dir).resolve()
    out_files: list[str] = []
    api_model = api_model or {}
    db_model = db_model or {}

    if template_path:
        # 模板驱动：排版最好、最适合推广
        from docxtpl import DocxTemplate

        tpl = DocxTemplate(template_path)
        context = {
            "api": api_model,
            "db": db_model,
        }
        tpl.render(context)

        out_path = out_dir / (output_filename or "Spec2Doc_设计文档.docx")
        tpl.save(str(out_path))
        if include_api:
            _fill_endpoint_tables(str(out_path), api_model.get("endpoints", []))
        out_files.append(str(out_path))
        return out_files

    # 无模板：先生成一个“简版文档”证明流程通了
    from docx import Document

    doc = Document()
    if include_db and not include_api:
        title = "数据库设计文档"
    else:
        title = f"{api_model.get('title', 'API')} 设计文档"
    doc.add_heading(title, level=0)

    # API section
    if include_api:
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
    if include_db:
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

    out_path = out_dir / (output_filename or "Spec2Doc_简版.docx")
    doc.save(str(out_path))
    out_files.append(str(out_path))
    return out_files


def _fill_endpoint_tables(docx_path: str, endpoints: list[dict]) -> None:
    from docx import Document

    doc = Document(docx_path)
    tables = list(doc.tables)
    t_idx = 0
    
    tables_to_remove = []  # 记录需要删除的空表
    
    for ep in endpoints:
        # 处理参数表格
        param_table, t_idx = _find_table_with_token(tables, "__PARAM_NAME__", t_idx)
        if param_table is not None:
            param_rows = _build_param_rows(ep)
            if not param_rows:
                tables_to_remove.append(param_table)
            else:
                _fill_table_rows(param_table, "__PARAM_NAME__", param_rows)
        
        # 处理请求体表格
        req_table, t_idx = _find_table_with_token(tables, "__REQ_NAME__", t_idx)
        if req_table is not None:
            req_rows = _build_req_rows(ep)
            if not req_rows:
                tables_to_remove.append(req_table)
            else:
                _fill_table_rows(req_table, "__REQ_NAME__", req_rows)
        
        # 处理请求体嵌套结构
        req_nested = ep.get("req_nested", {})
        for nested_path in sorted(req_nested.keys()):
            nested_info = req_nested[nested_path]
            nested_table, t_idx = _find_table_with_token(tables, "__NESTED_NAME__", t_idx)
            if nested_table is not None:
                nested_rows = _build_nested_rows(nested_info)
                if nested_rows:
                    # 更新表格前的标题（如果有）
                    _fill_table_rows(nested_table, "__NESTED_NAME__", nested_rows)
                else:
                    tables_to_remove.append(nested_table)
        
        # 处理响应表格
        resp_table, t_idx = _find_table_with_token(tables, "__RESP_NAME__", t_idx)
        if resp_table is not None:
            resp_rows = _build_resp_rows(ep)
            if not resp_rows:
                tables_to_remove.append(resp_table)
            else:
                _fill_table_rows(resp_table, "__RESP_NAME__", resp_rows)
        
        # 处理响应嵌套结构
        resp_nested = ep.get("resp_nested", {})
        for nested_path in sorted(resp_nested.keys()):
            nested_info = resp_nested[nested_path]
            nested_table, t_idx = _find_table_with_token(tables, "__NESTED_NAME__", t_idx)
            if nested_table is not None:
                nested_rows = _build_nested_rows(nested_info)
                if nested_rows:
                    _fill_table_rows(nested_table, "__NESTED_NAME__", nested_rows)
                else:
                    tables_to_remove.append(nested_table)
    
    # 删除所有空表
    for table in tables_to_remove:
        table._element.getparent().remove(table._element)
    
    doc.save(docx_path)


def _find_table_with_token(tables: list, token: str, start_idx: int) -> tuple[Optional[object], int]:
    for i in range(start_idx, len(tables)):
        table = tables[i]
        for row in table.rows:
            for cell in row.cells:
                if token in cell.text:
                    return table, i + 1
    return None, len(tables)


def _fill_table_rows(table, token: str, rows: list[dict]) -> None:
    tpl_idx = None
    for i, row in enumerate(table.rows):
        if any(token in cell.text for cell in row.cells):
            tpl_idx = i
            break
    if tpl_idx is None:
        return

    tpl_tr = table.rows[tpl_idx]._tr
    if not rows:
        table._tbl.remove(tpl_tr)
        return

    for data in rows:
        new_tr = deepcopy(tpl_tr)
        table._tbl.append(new_tr)
        new_row = table.rows[-1]
        _apply_row_values(new_row, data)

    table._tbl.remove(tpl_tr)


def _apply_row_values(row, data: dict) -> None:
    for cell in row.cells:
        text = cell.text
        for key, value in data.items():
            if key in text:
                cell.text = str(value)


def _build_req_rows(ep: dict) -> list[dict]:
    rows = []
    for f in ep.get("req_fields", []) or []:
        rows.append({
            "__REQ_NAME__": f.get("name", ""),
            "__REQ_TYPE__": f.get("type", ""),
            "__REQ_REQUIRED__": "Y" if f.get("required") else "N",
            "__REQ_DESC__": f.get("description", ""),
        })
    return rows


def _build_resp_rows(ep: dict) -> list[dict]:
    rows = []
    for f in ep.get("resp_fields", []) or []:
        rows.append({
            "__RESP_NAME__": f.get("name", ""),
            "__RESP_TYPE__": f.get("type", ""),
            "__RESP_REQUIRED__": "Y" if f.get("required") else "N",
            "__RESP_DESC__": f.get("description", ""),
        })
    return rows


def _build_param_rows(ep: dict) -> list[dict]:
    """构建参数表格行（包括 query、path、header、cookie 等参数）"""
    rows = []
    for f in ep.get("param_fields", []) or []:
        rows.append({
            "__PARAM_NAME__": f.get("name", ""),
            "__PARAM_TYPE__": f.get("type", ""),
            "__PARAM_REQUIRED__": "Y" if f.get("required") else "N",
            "__PARAM_DESC__": f.get("description", ""),
        })
    return rows


def _build_nested_rows(nested_info: dict) -> list[dict]:
    """构建嵌套结构表格行"""
    rows = []
    for f in nested_info.get("fields", []) or []:
        rows.append({
            "__NESTED_NAME__": f.get("name", ""),
            "__NESTED_TYPE__": f.get("type", ""),
            "__NESTED_REQUIRED__": "Y" if f.get("required") else "N",
            "__NESTED_DESC__": f.get("description", ""),
        })
    return rows
