from __future__ import annotations

from pathlib import Path
import yaml

def load_openapi_from_text(text: str) -> dict:
    if not text.strip():
        raise ValueError("OpenAPI 内容为空")
    try:
        data = yaml.safe_load(text)
    except Exception as exc:
        raise ValueError(f"OpenAPI 解析失败: {exc}") from exc
    if not isinstance(data, dict):
        raise ValueError("OpenAPI 内容不是有效对象")
    return data


def load_openapi(path: str) -> dict:
    p = Path(path).expanduser().resolve()
    text = p.read_text(encoding="utf-8")
    return load_openapi_from_text(text)


def build_api_model(spec: dict) -> dict:
    # 这里先做一个非常“够用”的 MVP：提取 endpoints 列表
    paths = spec.get("paths", {}) or {}
    endpoints = []

    for url, methods in paths.items():
        if not isinstance(methods, dict):
            continue
        for method, op in methods.items():
            if method.lower() not in ("get", "post", "put", "patch", "delete", "head", "options"):
                continue
            op = op or {}
            endpoints.append({
                "method": method.upper(),
                "path": url,
                "summary": op.get("summary", ""),
                "description": op.get("description", ""),
                "operationId": op.get("operationId", ""),
                "tags": op.get("tags", []),
                "parameters": op.get("parameters", []),
                "requestBody": op.get("requestBody", {}),
                "responses": op.get("responses", {}),
                "security": op.get("security", []),
            })

    info = spec.get("info", {}) or {}
    return {
        "title": info.get("title", "API"),
        "version": info.get("version", ""),
        "endpoints": endpoints,
    }
