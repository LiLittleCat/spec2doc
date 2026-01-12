from __future__ import annotations

from pathlib import Path
from datetime import datetime
import re

from db_introspect import reflect_db_schema
from word_render import render_word_docs

_INVALID_XML_RE = re.compile(r"[\x00-\x08\x0B\x0C\x0E-\x1F]")


def _sanitize_text(text: str) -> str:
    # 清理 Word XML 不支持的控制字符，避免打开时报错
    return _INVALID_XML_RE.sub("", text)


def _sanitize_value(value):
    if isinstance(value, str):
        return _sanitize_text(value)
    if isinstance(value, list):
        return [_sanitize_value(v) for v in value]
    if isinstance(value, dict):
        return {k: _sanitize_value(v) for k, v in value.items()}
    return value


def generate_db_doc(
    db_url: str,
    ddl_path: str,
    ddl_text: str,
    template_path: str | None,
    output_dir: str,
) -> list[str]:
    out_dir = Path(output_dir).expanduser().resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    db_model = {}
    if db_url:
        db_model = _sanitize_value(reflect_db_schema(db_url))
    elif ddl_path or ddl_text:
        # 预留：后续可用 sqlglot 解析 DDL 生成 db_model
        db_model = {}

    ts = datetime.now().strftime("%Y%m%d%H%M%S")
    output_filename = f"Spec2Doc_数据库设计文档_{ts}.docx"
    return render_word_docs(
        api_model={"title": "数据库", "version": "", "endpoints": []},
        db_model=db_model,
        template_path=template_path or None,
        output_dir=str(out_dir),
        include_api=False,
        include_db=True,
        output_filename=output_filename,
    )
