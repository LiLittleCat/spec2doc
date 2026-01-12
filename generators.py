from __future__ import annotations

from pathlib import Path
from typing import Callable

from models import AppInputs
from api_doc_service import generate_api_doc
from db_doc_service import generate_db_doc


def generate_docs(inputs: AppInputs, progress: Callable[[int, str], None]) -> dict:
    out_dir = Path(inputs.output_dir).expanduser().resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    if inputs.mode == "api":
        progress(5, "读取 OpenAPI…")
        files = generate_api_doc(
            openapi_path=inputs.openapi_path,
            openapi_text=inputs.openapi_text,
            template_path=inputs.template_path or None,
            output_dir=str(out_dir),
        )
        progress(100, "完成")
        return {"files": files}

    progress(10, "准备数据库文档…")
    if inputs.use_db and inputs.db_url:
        progress(30, "连接数据库并反射结构…")
    elif inputs.use_ddl and (inputs.ddl_path or inputs.ddl_text):
        progress(35, "检测到 DDL（当前骨架未实现 DDL 解析，可后续补上）")

    progress(70, "渲染 Word…")
    files = generate_db_doc(
        db_url=inputs.db_url if inputs.use_db else "",
        ddl_path=inputs.ddl_path if inputs.use_ddl else "",
        ddl_text=inputs.ddl_text if inputs.use_ddl else "",
        template_path=inputs.template_path or None,
        output_dir=str(out_dir),
    )

    progress(100, "完成")
    return {"files": files}
