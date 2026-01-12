from __future__ import annotations

from pathlib import Path
from datetime import datetime
from typing import Callable, Optional
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


def _emit(log: Optional[Callable[[str], None]], msg: str) -> None:
    if log:
        log(msg)


def _format_parameters(params: list[dict]) -> str:
    if not params:
        return ""
    buckets: dict[str, list[str]] = {}
    for p in params:
        name = p.get("name") if isinstance(p, dict) else ""
        loc = p.get("in") if isinstance(p, dict) else ""
        if not name or not loc:
            continue
        buckets.setdefault(loc, []).append(str(name))
    parts = []
    for key in ("path", "query", "header", "cookie"):
        names = buckets.get(key, [])
        if names:
            parts.append(f"{key}=" + ",".join(names))
    return "；".join(parts)


def generate_api_doc(
    openapi_path: str,
    openapi_text: str,
    template_path: str | None,
    output_dir: str,
    log: Optional[Callable[[str], None]] = None,
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
    endpoints = api_model.get("endpoints", []) or []
    _emit(log, f"解析 OpenAPI 完成：{len(endpoints)} 个接口")
    for ep in endpoints:
        method = ep.get("method", "")
        path = ep.get("path", "")
        title = ep.get("summary") or ep.get("operationId") or ""
        title_part = f" - {title}" if title else ""
        _emit(log, f"接口：{method} {path}{title_part}")

        param_desc = _format_parameters(ep.get("parameters", []) or [])
        _emit(log, f"  参数：{param_desc or '无'}")

        req_fields = [f.get("name", "") for f in ep.get("req_fields", []) if f.get("name")]
        resp_fields = [f.get("name", "") for f in ep.get("resp_fields", []) if f.get("name")]
        _emit(log, f"  请求体字段：{'、'.join(req_fields) if req_fields else '无'}")
        _emit(log, f"  返回字段：{'、'.join(resp_fields) if resp_fields else '无'}")

    _emit(log, "渲染 Word…")
    ts = datetime.now().strftime("%Y%m%d%H%M%S")
    output_filename = f"Spec2Doc_接口设计文档_{ts}.docx"
    return render_word_docs(
        api_model=api_model,
        db_model={},
        template_path=template_path or None,
        output_dir=str(out_dir),
        include_api=True,
        include_db=False,
        output_filename=output_filename,
    )
