from __future__ import annotations

from pathlib import Path
import re

from parsers import load_openapi, load_openapi_from_text, build_api_model
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


def generate_api_doc(
    openapi_path: str,
    openapi_text: str,
    template_path: str | None,
    output_dir: str,
) -> list[str]:
    out_dir = Path(output_dir).expanduser().resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    if openapi_text.strip():
        spec = load_openapi_from_text(openapi_text)
    elif openapi_path:
        spec = load_openapi(openapi_path)
    else:
        raise ValueError("缺少 OpenAPI 文件或内容")

    api_model = _sanitize_value(build_api_model(spec))
    return render_word_docs(
        api_model=api_model,
        db_model={},
        template_path=template_path or None,
        output_dir=str(out_dir),
        include_api=True,
        include_db=False,
    )
