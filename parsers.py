from __future__ import annotations

from pathlib import Path
import yaml
from openapi_core import Spec


def _resolve_ref(spec_path: Spec, node: dict, seen: set[str] | None = None, depth: int = 0) -> dict:
    if not isinstance(node, dict):
        return {}
    if depth > 10:
        return node
    ref = node.get("$ref")
    if not ref or not isinstance(ref, str):
        return node
    if not ref.startswith("#/"):
        return node
    seen = seen or set()
    if ref in seen:
        return node
    seen.add(ref)
    parts = ref.lstrip("#/").split("/")
    cur = spec_path
    try:
        for part in parts:
            cur = cur / part
        resolved = cur.content()
    except Exception:
        return node
    if isinstance(resolved, dict) and "$ref" in resolved:
        resolved = _resolve_ref(spec_path, resolved, seen, depth + 1)
    if not isinstance(resolved, dict):
        return node
    merged = dict(resolved)
    for key, value in node.items():
        if key != "$ref":
            merged[key] = value
    return merged


def _resolve_schema(spec_path: Spec, schema: dict, seen: set[str] | None = None, depth: int = 0) -> dict:
    if not isinstance(schema, dict):
        return {}
    if depth > 10:
        return schema
    resolved = _resolve_ref(spec_path, schema, seen, depth)
    return resolved if isinstance(resolved, dict) else schema


def _merge_allof(schema: dict, spec_path: Spec) -> dict:
    merged: dict = {
        "type": "object",
        "properties": {},
        "required": [],
    }
    for part in schema.get("allOf", []) or []:
        if not isinstance(part, dict):
            continue
        resolved = _normalize_schema(spec_path, part)
        props = resolved.get("properties") or {}
        if isinstance(props, dict):
            merged["properties"].update(props)
        for name in resolved.get("required", []) or []:
            if name not in merged["required"]:
                merged["required"].append(name)
    props = schema.get("properties") or {}
    if isinstance(props, dict):
        merged["properties"].update(props)
    for name in schema.get("required", []) or []:
        if name not in merged["required"]:
            merged["required"].append(name)
    return merged


def _normalize_schema(spec_path: Spec, schema: dict) -> dict:
    if not isinstance(schema, dict):
        return {}
    resolved = _resolve_schema(spec_path, schema)
    if isinstance(resolved, dict) and resolved.get("allOf"):
        return _merge_allof(resolved, spec_path)
    return resolved if isinstance(resolved, dict) else {}


def _schema_type(schema: dict, spec_path: Spec) -> str:
    if not isinstance(schema, dict):
        return ""
    resolved = _normalize_schema(spec_path, schema)
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
    
    resolved = _normalize_schema(spec_path, schema)
    
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
        resolved_prop = _normalize_schema(spec_path, prop)
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
                items_resolved = _normalize_schema(spec_path, items_schema)
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


def _extract_examples_from_media(info: dict) -> list[dict]:
    if not isinstance(info, dict):
        return []
    examples = []
    if "example" in info:
        examples.append({
            "name": "example",
            "summary": "",
            "description": "",
            "value": info.get("example"),
            "externalValue": info.get("externalValue", ""),
        })
    examples_obj = info.get("examples") or {}
    if isinstance(examples_obj, dict):
        for name, ex in examples_obj.items():
            if isinstance(ex, dict):
                examples.append({
                    "name": str(name),
                    "summary": ex.get("summary", ""),
                    "description": ex.get("description", ""),
                    "value": ex.get("value"),
                    "externalValue": ex.get("externalValue", ""),
                })
            else:
                examples.append({
                    "name": str(name),
                    "summary": "",
                    "description": "",
                    "value": ex,
                    "externalValue": "",
                })
    return examples


def _extract_content_items(content: dict, spec_path: Spec) -> list[dict]:
    if not isinstance(content, dict):
        return []
    items = []
    for content_type, info in content.items():
        if not isinstance(info, dict):
            continue
        schema = info.get("schema") or {}
        fields, nested = _schema_to_fields(schema, spec_path)
        items.append({
            "content_type": content_type,
            "schema": schema if isinstance(schema, dict) else {},
            "fields": fields,
            "nested": nested,
            "examples": _extract_examples_from_media(info),
        })
    return items


def _extract_request_bodies(op: dict, spec_path: Spec) -> dict:
    body = op.get("requestBody") or {}
    if isinstance(body, dict) and "$ref" in body:
        body = _resolve_ref(spec_path, body)
    if not isinstance(body, dict):
        return {"required": False, "description": "", "content": []}
    content = body.get("content") or {}
    return {
        "required": bool(body.get("required", False)),
        "description": body.get("description", "") if isinstance(body.get("description"), str) else "",
        "content": _extract_content_items(content, spec_path),
    }


def _extract_responses(op: dict, spec_path: Spec) -> list[dict]:
    responses = op.get("responses") or {}
    if not isinstance(responses, dict):
        return []
    result = []
    for status_code, resp in responses.items():
        resp_obj = resp
        if isinstance(resp_obj, dict) and "$ref" in resp_obj:
            resp_obj = _resolve_ref(spec_path, resp_obj)
        if not isinstance(resp_obj, dict):
            continue
        content = resp_obj.get("content") or {}
        result.append({
            "status": str(status_code),
            "description": resp_obj.get("description", ""),
            "headers": resp_obj.get("headers", {}) if isinstance(resp_obj.get("headers"), dict) else {},
            "content": _extract_content_items(content, spec_path),
        })
    return result


def _extract_components(spec: dict, spec_path: Spec) -> dict:
    components = spec.get("components") or {}
    if not isinstance(components, dict):
        return {}
    result: dict = {}

    schemas = components.get("schemas") or {}
    schema_list = []
    if isinstance(schemas, dict):
        for name, schema in schemas.items():
            if not isinstance(schema, dict):
                continue
            resolved = _normalize_schema(spec_path, schema)
            fields, nested = _schema_to_fields(schema, spec_path)
            schema_list.append({
                "name": name,
                "type": _schema_type(schema, spec_path),
                "description": resolved.get("description", ""),
                "fields": fields,
                "nested": nested,
            })
    result["schemas"] = schema_list

    parameters = components.get("parameters") or {}
    param_list = []
    if isinstance(parameters, dict):
        for name, param in parameters.items():
            if not isinstance(param, dict):
                continue
            resolved = _resolve_ref(spec_path, param) if "$ref" in param else param
            if not isinstance(resolved, dict):
                continue
            schema = resolved.get("schema", {})
            param_list.append({
                "name": name,
                "in": resolved.get("in", ""),
                "type": _schema_type(schema, spec_path) if isinstance(schema, dict) else "",
                "description": resolved.get("description", ""),
                "required": resolved.get("required", False),
                "schema": schema if isinstance(schema, dict) else {},
            })
    result["parameters"] = param_list

    responses = components.get("responses") or {}
    response_list = []
    if isinstance(responses, dict):
        for name, resp in responses.items():
            if not isinstance(resp, dict):
                continue
            resolved = _resolve_ref(spec_path, resp) if "$ref" in resp else resp
            if not isinstance(resolved, dict):
                continue
            response_list.append({
                "name": name,
                "description": resolved.get("description", ""),
                "headers": resolved.get("headers", {}) if isinstance(resolved.get("headers"), dict) else {},
                "content": _extract_content_items(resolved.get("content", {}), spec_path),
            })
    result["responses"] = response_list

    request_bodies = components.get("requestBodies") or {}
    request_body_list = []
    if isinstance(request_bodies, dict):
        for name, body in request_bodies.items():
            if not isinstance(body, dict):
                continue
            resolved = _resolve_ref(spec_path, body) if "$ref" in body else body
            if not isinstance(resolved, dict):
                continue
            request_body_list.append({
                "name": name,
                "description": resolved.get("description", ""),
                "required": bool(resolved.get("required", False)),
                "content": _extract_content_items(resolved.get("content", {}), spec_path),
            })
    result["requestBodies"] = request_body_list

    headers = components.get("headers") or {}
    header_list = []
    if isinstance(headers, dict):
        for name, header in headers.items():
            if not isinstance(header, dict):
                continue
            resolved = _resolve_ref(spec_path, header) if "$ref" in header else header
            if not isinstance(resolved, dict):
                continue
            schema = resolved.get("schema", {})
            header_list.append({
                "name": name,
                "type": _schema_type(schema, spec_path) if isinstance(schema, dict) else "",
                "description": resolved.get("description", ""),
                "schema": schema if isinstance(schema, dict) else {},
            })
    result["headers"] = header_list

    security_schemes = components.get("securitySchemes") or {}
    security_list = []
    if isinstance(security_schemes, dict):
        for name, scheme in security_schemes.items():
            if not isinstance(scheme, dict):
                continue
            security_list.append({
                "name": name,
                "type": scheme.get("type", ""),
                "description": scheme.get("description", ""),
                "scheme": scheme.get("scheme", ""),
                "bearerFormat": scheme.get("bearerFormat", ""),
                "flows": scheme.get("flows", {}) if isinstance(scheme.get("flows"), dict) else {},
                "openIdConnectUrl": scheme.get("openIdConnectUrl", ""),
                "in": scheme.get("in", ""),
                "paramName": scheme.get("name", ""),
            })
    result["securitySchemes"] = security_list

    examples = components.get("examples") or {}
    example_list = []
    if isinstance(examples, dict):
        for name, ex in examples.items():
            if isinstance(ex, dict):
                example_list.append({
                    "name": name,
                    "summary": ex.get("summary", ""),
                    "description": ex.get("description", ""),
                    "value": ex.get("value"),
                    "externalValue": ex.get("externalValue", ""),
                })
            else:
                example_list.append({
                    "name": name,
                    "summary": "",
                    "description": "",
                    "value": ex,
                    "externalValue": "",
                })
    result["examples"] = example_list

    links = components.get("links") or {}
    link_list = []
    if isinstance(links, dict):
        for name, link in links.items():
            if not isinstance(link, dict):
                continue
            link_list.append({
                "name": name,
                "description": link.get("description", ""),
                "operationId": link.get("operationId", ""),
                "operationRef": link.get("operationRef", ""),
            })
    result["links"] = link_list

    callbacks = components.get("callbacks") or {}
    callback_list = []
    if isinstance(callbacks, dict):
        for name, cb in callbacks.items():
            if not isinstance(cb, dict):
                continue
            callback_list.append({
                "name": name,
                "expressionKeys": list(cb.keys()),
            })
    result["callbacks"] = callback_list

    return result


def _extract_request_info(op: dict, spec_path: Spec) -> tuple[str, list[dict], dict]:
    body = op.get("requestBody") or {}
    content = body.get("content") or {}
    if not isinstance(content, dict) or not content:
        return "", [], {}
    content_type, info = next(iter(content.items()))
    schema = (info or {}).get("schema") or {}
    fields, nested = _schema_to_fields(schema, spec_path)
    return content_type, fields, nested


def _collect_parameters(path_params: list, op_params: list, spec_path: Spec) -> list[dict]:
    params = []
    for source in (path_params, op_params):
        if not source or not isinstance(source, list):
            continue
        for p in source:
            if not isinstance(p, dict):
                continue
            resolved = _resolve_ref(spec_path, p) if "$ref" in p else p
            if not isinstance(resolved, dict):
                continue
            params.append(resolved)
    # 去重：按 name + in
    seen = set()
    deduped = []
    for p in params:
        name = p.get("name", "")
        param_in = p.get("in", "")
        key = (name, param_in)
        if name and param_in and key in seen:
            continue
        if name and param_in:
            seen.add(key)
        deduped.append(p)
    return deduped


def _extract_parameter_fields(params: list, spec_path: Spec) -> list[dict]:
    """将 OpenAPI parameters 数组转换为结构化字段列表"""
    if not params or not isinstance(params, list):
        return []
    fields = []
    for p in params:
        if not isinstance(p, dict):
            continue
        name = p.get("name", "")
        param_in = p.get("in", "")
        if not name:
            continue
        schema = p.get("schema", {})
        param_type = _schema_type(schema, spec_path) if isinstance(schema, dict) else ""
        examples = []
        if "example" in p:
            examples.append({"name": "example", "value": p.get("example")})
        examples_obj = p.get("examples") or {}
        if isinstance(examples_obj, dict):
            for ex_name, ex in examples_obj.items():
                if isinstance(ex, dict):
                    examples.append({"name": str(ex_name), "value": ex.get("value")})
                else:
                    examples.append({"name": str(ex_name), "value": ex})
        fields.append({
            "name": name,
            "in": param_in,
            "type": param_type,
            "format": schema.get("format", "") if isinstance(schema, dict) else "",
            "required": p.get("required", False),
            "description": p.get("description", ""),
            "deprecated": p.get("deprecated", False),
            "style": p.get("style", ""),
            "explode": p.get("explode", ""),
            "allowEmptyValue": p.get("allowEmptyValue", ""),
            "example": p.get("example", ""),
            "examples": examples,
            "schema": schema if isinstance(schema, dict) else {},
            "content": p.get("content", {}) if isinstance(p.get("content"), dict) else {},
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
    resolved_schema = _normalize_schema(spec_path, schema)
    
    # 尝试提取 data 字段（常见的响应包装）
    if isinstance(resolved_schema, dict) and resolved_schema.get("type") == "object":
        data_schema = (resolved_schema.get("properties") or {}).get("data")
        if isinstance(data_schema, dict):
            data_resolved = _normalize_schema(spec_path, data_schema)
            if isinstance(data_resolved, dict) and data_resolved.get("properties"):
                return _schema_to_fields(data_resolved, spec_path)
    
    return _schema_to_fields(schema, spec_path)


def _extract_extensions(obj: dict) -> dict:
    if not isinstance(obj, dict):
        return {}
    return {k: v for k, v in obj.items() if isinstance(k, str) and k.startswith("x-")}

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


def _extract_server_prefix(spec: dict) -> str:
    servers = spec.get("servers", []) or []
    if not isinstance(servers, list) or not servers:
        return ""
    first = servers[0]
    if not isinstance(first, dict):
        return ""
    url = first.get("url")
    if not isinstance(url, str) or not url:
        return ""
    if "://" in url:
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            url = parsed.path or ""
        except Exception:
            return ""
    url = "/" + url.lstrip("/")
    url = url.rstrip("/")
    return "" if url == "/" else url


def _normalize_paths(spec: dict) -> dict:
    paths = spec.get("paths", {}) or {}
    if not isinstance(paths, dict) or not paths:
        return spec

    server_prefix = _extract_server_prefix(spec)
    normalized = {}
    changed = False
    for raw_path, methods in paths.items():
        if not isinstance(raw_path, str):
            normalized[raw_path] = methods
            continue

        key = raw_path
        if "://" in key:
            try:
                from urllib.parse import urlparse
                parsed = urlparse(key)
                key = parsed.path or ""
            except Exception:
                pass
        if key.startswith("//"):
            key = "/" + key.lstrip("/")
        if key.startswith("BASEURL"):
            key = key[len("BASEURL"):]
        if server_prefix and key.startswith(server_prefix):
            key = key[len(server_prefix):] or "/"
        if not (key.startswith("/") or key.startswith("x-")):
            key = f"/{key}"
        changed = changed or key != raw_path

        if key in normalized and isinstance(normalized[key], dict) and isinstance(methods, dict):
            for method, info in methods.items():
                if method not in normalized[key]:
                    normalized[key][method] = info
        else:
            normalized[key] = methods

    if not changed:
        return spec
    spec = dict(spec)
    spec["paths"] = normalized
    return spec


def build_api_model(spec: dict) -> dict:
    # 这里先做一个非常“够用”的 MVP：提取 endpoints 列表
    spec = _normalize_paths(spec)
    spec_path = Spec.from_dict(spec)
    paths = spec.get("paths", {}) or {}
    endpoints = []

    for url, path_item in paths.items():
        if not isinstance(path_item, dict):
            continue
        path_item_params = path_item.get("parameters", []) if isinstance(path_item.get("parameters", []), list) else []
        path_item_servers = path_item.get("servers", []) if isinstance(path_item.get("servers", []), list) else []
        path_item_summary = path_item.get("summary", "")
        path_item_description = path_item.get("description", "")
        path_item_extensions = _extract_extensions(path_item)

        for method, op in path_item.items():
            if method.lower() not in ("get", "post", "put", "patch", "delete", "head", "options"):
                continue
            op = op or {}
            parameters = _collect_parameters(path_item_params, op.get("parameters", []), spec_path)
            param_fields = _extract_parameter_fields(parameters, spec_path)
            request_body = _extract_request_bodies(op, spec_path)
            responses_info = _extract_responses(op, spec_path)

            request_content_type = ""
            req_fields = []
            req_nested = {}
            if request_body.get("content"):
                first = request_body["content"][0]
                request_content_type = first.get("content_type", "")
                req_fields = first.get("fields", []) or []
                req_nested = first.get("nested", {}) or {}

            resp_fields, resp_nested = _extract_response_fields(op, spec_path)
            op_servers = op.get("servers", []) if isinstance(op.get("servers", []), list) else []
            op_security = op.get("security", []) if isinstance(op.get("security", []), list) else []
            effective_servers = op_servers or path_item_servers or (spec.get("servers", []) if isinstance(spec.get("servers", []), list) else [])
            effective_security = op_security or (spec.get("security", []) if isinstance(spec.get("security", []), list) else [])

            endpoints.append({
                "method": method.upper(),
                "path": url,
                "summary": op.get("summary", ""),
                "description": op.get("description", ""),
                "operationId": op.get("operationId", ""),
                "tags": op.get("tags", []),
                "parameters": parameters,
                "requestBody": op.get("requestBody", {}),
                "responses": op.get("responses", {}),
                "security": effective_security,
                "request_content_type": request_content_type,
                "req_fields": req_fields,
                "req_nested": req_nested,
                "resp_fields": resp_fields,
                "resp_nested": resp_nested,
                "param_fields": param_fields,
                "request_body": request_body,
                "responses_info": responses_info,
                "servers": effective_servers,
                "deprecated": op.get("deprecated", False),
                "callbacks": op.get("callbacks", {}),
                "externalDocs": op.get("externalDocs", {}),
                "path_item_summary": path_item_summary,
                "path_item_description": path_item_description,
                "path_item_extensions": path_item_extensions,
                "extensions": _extract_extensions(op),
            })

    info = spec.get("info", {}) or {}
    return {
        "openapi": spec.get("openapi", ""),
        "info": info,
        "title": info.get("title", "API"),
        "version": info.get("version", ""),
        "description": info.get("description", ""),
        "servers": spec.get("servers", []) if isinstance(spec.get("servers", []), list) else [],
        "tags": spec.get("tags", []) if isinstance(spec.get("tags", []), list) else [],
        "externalDocs": spec.get("externalDocs", {}) if isinstance(spec.get("externalDocs"), dict) else {},
        "security": spec.get("security", []) if isinstance(spec.get("security", []), list) else [],
        "components": _extract_components(spec, spec_path),
        "extensions": _extract_extensions(spec),
        "endpoints": endpoints,
    }
