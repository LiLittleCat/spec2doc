from __future__ import annotations

from pathlib import Path
from typing import Callable

from ui_main import AppInputs
from parsers import load_openapi, build_api_model
from db_introspect import reflect_db_schema
from word_render import render_word_docs


def generate_docs(inputs: AppInputs, progress: Callable[[int, str], None]) -> dict:
    out_dir = Path(inputs.output_dir).expanduser().resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    progress(5, "读取 OpenAPI…")
    spec = load_openapi(inputs.openapi_path)
    api_model = build_api_model(spec)
    progress(25, f"解析 OpenAPI 完成：{len(api_model.get('endpoints', []))} 个接口")

    db_model = {}
    if inputs.use_db and inputs.db_url:
        progress(35, "连接数据库并反射结构…")
        db_model = reflect_db_schema(inputs.db_url)
        progress(60, f"数据库反射完成：{len(db_model.get('tables', []))} 张表")
    elif inputs.use_ddl and inputs.ddl_path:
        progress(35, "检测到 DDL（当前骨架未实现 DDL 解析，可后续补上）")
        # 这里后面你可以用 sqlglot 把 DDL 变成 db_model

    progress(70, "渲染 Word…")
    files = render_word_docs(
        api_model=api_model,
        db_model=db_model,
        template_path=inputs.template_path or None,
        output_dir=str(out_dir),
    )

    progress(100, "完成")
    return {"files": files}
