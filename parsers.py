from __future__ import annotations

from pathlib import Path
import yaml


def _schema_type(schema: dict) -> str:
    if not isinstance(schema, dict):
        return ""
    if "$ref" in schema:
        return schema["$ref"].split("/")[-1]
    t = schema.get("type", "")
    if t == "array":
        item_type = _schema_type(schema.get("items", {}))
        return f"array<{item_type}>" if item_type else "array"
    return t or ""


def _schema_to_fields(schema: dict) -> list[dict]:
    if not isinstance(schema, dict):
        return []
    if schema.get("type") == "array":
        return _schema_to_fields(schema.get("items", {}))
    props = schema.get("properties") or {}
    if not isinstance(props, dict) or not props:
        return []
    required = set(schema.get("required", []) or [])
    fields = []
    for name, prop in props.items():
        fields.append({
            "name": name,
            "type": _schema_type(prop),
            "required": name in required,
            "description": prop.get("description", "") if isinstance(prop, dict) else "",
        })
    return fields


def _extract_request_info(op: dict) -> tuple[str, list[dict]]:
    body = op.get("requestBody") or {}
    content = body.get("content") or {}
    if not isinstance(content, dict) or not content:
        return "", []
    content_type, info = next(iter(content.items()))
    schema = (info or {}).get("schema") or {}
    return content_type, _schema_to_fields(schema)


def _extract_response_fields(op: dict) -> list[dict]:
    responses = op.get("responses") or {}
    if not isinstance(responses, dict) or not responses:
        return []
    resp = responses.get("200") or responses.get("201") or responses.get("default") or next(iter(responses.values()))
    content = (resp or {}).get("content") or {}
    if not isinstance(content, dict) or not content:
        return []
    _, info = next(iter(content.items()))
    schema = (info or {}).get("schema") or {}
    if isinstance(schema, dict) and schema.get("type") == "object":
        data_schema = (schema.get("properties") or {}).get("data")
        if isinstance(data_schema, dict) and data_schema.get("properties"):
            return _schema_to_fields(data_schema)
    return _schema_to_fields(schema)

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
            request_content_type, req_fields = _extract_request_info(op)
            resp_fields = _extract_response_fields(op)
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
                "request_content_type": request_content_type,
                "req_fields": req_fields,
                "resp_fields": resp_fields,
            })

    info = spec.get("info", {}) or {}
    return {
        "title": info.get("title", "API"),
        "version": info.get("version", ""),
        "endpoints": endpoints,
    }
