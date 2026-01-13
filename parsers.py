from __future__ import annotations

from pathlib import Path
import yaml
from openapi_core import Spec


def _resolve_schema(spec_path: Spec, schema: dict, seen: set[str] | None = None, depth: int = 0) -> dict:
    if not isinstance(schema, dict):
        return {}
    if depth > 10:
        return schema
    ref = schema.get("$ref")
    if not ref:
        return schema
    if not ref.startswith("#/"):
        return schema
    seen = seen or set()
    if ref in seen:
        return schema
    seen.add(ref)
    parts = ref.lstrip("#/").split("/")
    node = spec_path
    try:
        for part in parts:
            node = node / part
        resolved = node.content()
    except Exception:
        return schema
    if isinstance(resolved, dict) and "$ref" in resolved:
        return _resolve_schema(spec_path, resolved, seen, depth + 1)
    return resolved if isinstance(resolved, dict) else schema


def _schema_type(schema: dict, spec_path: Spec) -> str:
    if not isinstance(schema, dict):
        return ""
    resolved = _resolve_schema(spec_path, schema)
    t = resolved.get("type", "")
    if t == "array":
        item_type = _schema_type(resolved.get("items", {}), spec_path)
        return f"array<{item_type}>" if item_type else "array"
    if t:
        return t
    if "$ref" in schema:
        return schema["$ref"].split("/")[-1]
    return ""


def _schema_to_fields(schema: dict, spec_path: Spec, parent_path: str = "") -> tuple[list[dict], dict]:
    """
    从 schema 提取字段列表和嵌套结构
    
    Returns:
        (fields, nested_schemas)
        - fields: 当前层级的字段列表
        - nested_schemas: {"path": {"fields": [...], "type": "object/array", "description": "..."}}
    """
    if not isinstance(schema, dict):
        return [], {}
    
    resolved = _resolve_schema(spec_path, schema)
    
    # 处理数组类型 - 递归处理数组项
    if resolved.get("type") == "array":
        items_schema = resolved.get("items", {})
        if isinstance(items_schema, dict):
            return _schema_to_fields(items_schema, spec_path, parent_path)
        return [], {}
    
    props = resolved.get("properties") or {}
    if not isinstance(props, dict) or not props:
        return [], {}
    
    required = set(resolved.get("required", []) or [])
    fields = []
    nested_schemas = {}
    
    for name, prop in props.items():
        if not isinstance(prop, dict):
            continue
        
        field_type = _schema_type(prop, spec_path)
        field_desc = prop.get("description", "")
        
        fields.append({
            "name": name,
            "type": field_type,
            "required": name in required,
            "description": field_desc,
        })
        
        # 检查是否有嵌套结构（object 或 array）
        resolved_prop = _resolve_schema(spec_path, prop)
        prop_type = resolved_prop.get("type", "")
        
        if prop_type == "object":
            # 嵌套对象
            child_path = f"{parent_path}.{name}" if parent_path else name
            child_fields, child_nested = _schema_to_fields(prop, spec_path, child_path)
            if child_fields:
                nested_schemas[child_path] = {
                    "fields": child_fields,
                    "type": "object",
                    "description": field_desc or f"{name} 对象字段",
                    "parent_field": name
                }
                nested_schemas.update(child_nested)
        
        elif prop_type == "array":
            # 数组类型 - 检查数组项是否是对象
            items_schema = resolved_prop.get("items", {})
            if isinstance(items_schema, dict):
                items_resolved = _resolve_schema(spec_path, items_schema)
                if items_resolved.get("type") == "object":
                    child_path = f"{parent_path}.{name}[]" if parent_path else f"{name}[]"
                    child_fields, child_nested = _schema_to_fields(items_schema, spec_path, child_path)
                    if child_fields:
                        nested_schemas[child_path] = {
                            "fields": child_fields,
                            "type": "array",
                            "description": field_desc or f"{name} 数组项字段",
                            "parent_field": name
                        }
                        nested_schemas.update(child_nested)
    
    return fields, nested_schemas


def _extract_request_info(op: dict, spec_path: Spec) -> tuple[str, list[dict], dict]:
    body = op.get("requestBody") or {}
    content = body.get("content") or {}
    if not isinstance(content, dict) or not content:
        return "", [], {}
    content_type, info = next(iter(content.items()))
    schema = (info or {}).get("schema") or {}
    fields, nested = _schema_to_fields(schema, spec_path)
    return content_type, fields, nested


def _extract_parameters(params: list) -> list[dict]:
    """将 OpenAPI parameters 数组转换为结构化字段列表"""
    if not params or not isinstance(params, list):
        return []
    fields = []
    for p in params:
        if not isinstance(p, dict):
            continue
        name = p.get("name", "")
        if not name:
            continue
        param_in = p.get("in", "")
        schema = p.get("schema", {})
        param_type = ""
        if isinstance(schema, dict):
            param_type = schema.get("type", "")
        fields.append({
            "name": name,
            "type": param_type,
            "in": param_in,
            "required": p.get("required", False),
            "description": p.get("description", ""),
        })
    return fields


def _extract_response_fields(op: dict, spec_path: Spec) -> tuple[list[dict], dict]:
    responses = op.get("responses") or {}
    if not isinstance(responses, dict) or not responses:
        return [], {}
    resp = responses.get("200") or responses.get("201") or responses.get("default") or next(iter(responses.values()))
    content = (resp or {}).get("content") or {}
    if not isinstance(content, dict) or not content:
        return [], {}
    _, info = next(iter(content.items()))
    schema = (info or {}).get("schema") or {}
    resolved_schema = _resolve_schema(spec_path, schema)
    
    # 尝试提取 data 字段（常见的响应包装）
    if isinstance(resolved_schema, dict) and resolved_schema.get("type") == "object":
        data_schema = (resolved_schema.get("properties") or {}).get("data")
        if isinstance(data_schema, dict):
            data_resolved = _resolve_schema(spec_path, data_schema)
            if isinstance(data_resolved, dict) and data_resolved.get("properties"):
                return _schema_to_fields(data_resolved, spec_path)
    
    return _schema_to_fields(schema, spec_path)

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
    spec_path = Spec.from_dict(spec)
    paths = spec.get("paths", {}) or {}
    endpoints = []

    for url, methods in paths.items():
        if not isinstance(methods, dict):
            continue
        for method, op in methods.items():
            if method.lower() not in ("get", "post", "put", "patch", "delete", "head", "options"):
                continue
            op = op or {}
            request_content_type, req_fields, req_nested = _extract_request_info(op, spec_path)
            resp_fields, resp_nested = _extract_response_fields(op, spec_path)
            param_fields = _extract_parameters(op.get("parameters", []))
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
                "req_nested": req_nested,
                "resp_fields": resp_fields,
                "resp_nested": resp_nested,
                "param_fields": param_fields,
            })

    info = spec.get("info", {}) or {}
    return {
        "title": info.get("title", "API"),
        "version": info.get("version", ""),
        "endpoints": endpoints,
    }
