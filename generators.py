from __future__ import annotations

from pathlib import Path
import re
from typing import Callable

from models import AppInputs
from api_doc_service import generate_api_doc
from db_doc_service import generate_db_doc


def _split_paths(value: str) -> list[str]:
    if not value:
        return []
    parts = []
    for raw in re.split(r"[;\r\n]+", value):
        item = raw.strip().strip("\"")
        if item:
            parts.append(item)
    return parts


def _build_output_filename(stem: str, used: dict[str, int], fallback: str) -> str:
    base = stem or fallback
    count = used.get(base, 0) + 1
    used[base] = count
    suffix = f"_{count}" if count > 1 else ""
    return f"{base}{suffix}.docx"


def generate_docs(inputs: AppInputs, progress: Callable[[int, str], None]) -> dict:
    out_dir = Path(inputs.output_dir).expanduser().resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    if inputs.mode == "api":
        files = []
        if inputs.openapi_text.strip():
            progress(5, "读取 OpenAPI…")
            files = generate_api_doc(
                openapi_path="",
                openapi_text=inputs.openapi_text,
                template_path=inputs.template_path or None,
                output_dir=str(out_dir),
                log=lambda msg: progress(30, msg),
            )
            progress(100, "完成")
            return {"files": files}

        openapi_paths = _split_paths(inputs.openapi_path)
        used_names: dict[str, int] = {}
        total = len(openapi_paths)
        for idx, path in enumerate(openapi_paths, start=1):
            progress(5, f"读取 OpenAPI ({idx}/{total})…")
            stem = Path(path).stem
            output_filename = _build_output_filename(stem, used_names, "Spec2Doc_接口设计文档")
            files.extend(generate_api_doc(
                openapi_path=path,
                openapi_text="",
                template_path=inputs.template_path or None,
                output_dir=str(out_dir),
                log=lambda msg: progress(30, msg),
                output_filename=output_filename,
            ))
        progress(100, "完成")
        return {"files": files}

    progress(10, "准备数据库文档…")
    if inputs.use_db and inputs.db_url:
        progress(30, "连接数据库并反射结构…")
    elif inputs.use_ddl and (inputs.ddl_path or inputs.ddl_text):
        progress(35, "检测到 DDL（当前骨架未实现 DDL 解析，可后续补上）")

    progress(70, "渲染 Word…")
    files = []
    if inputs.use_ddl and inputs.ddl_path and not inputs.db_url and not inputs.ddl_text:
        ddl_paths = _split_paths(inputs.ddl_path)
        used_names: dict[str, int] = {}
        total = len(ddl_paths)
        for idx, path in enumerate(ddl_paths, start=1):
            progress(70, f"渲染 Word ({idx}/{total})…")
            stem = Path(path).stem
            output_filename = _build_output_filename(stem, used_names, "Spec2Doc_数据库设计文档")
            files.extend(generate_db_doc(
                db_url="",
                ddl_path=path,
                ddl_text="",
                template_path=inputs.template_path or None,
                output_dir=str(out_dir),
                output_filename=output_filename,
            ))
    else:
        files = generate_db_doc(
            db_url=inputs.db_url if inputs.use_db else "",
            ddl_path=inputs.ddl_path if inputs.use_ddl else "",
            ddl_text=inputs.ddl_text if inputs.use_ddl else "",
            template_path=inputs.template_path or None,
            output_dir=str(out_dir),
        )

    progress(100, "完成")
    return {"files": files}
