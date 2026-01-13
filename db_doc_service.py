from __future__ import annotations

from pathlib import Path
from datetime import datetime
import re

import sqlglot
from sqlglot import exp

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


def parse_ddl_to_model(ddl_text: str) -> dict:
    """使用 sqlglot 解析 DDL 文本，提取表结构信息"""
    tables = []
    
    try:
        # 解析 DDL，使用 MySQL 方言
        statements = sqlglot.parse(ddl_text, dialect="mysql")
        
        for stmt in statements:
            if not isinstance(stmt, exp.Create):
                continue
            
            # 只处理 CREATE TABLE 语句
            if stmt.kind != "TABLE":
                continue
            
            # stmt.this 是 Schema，Schema.this 是 Table
            schema = stmt.this
            table_name = ""
            if schema and hasattr(schema, 'this') and schema.this:
                table_name = schema.this.name if hasattr(schema.this, 'name') else str(schema.this)
            table_comment = ""
            columns = []
            pk_columns = []
            indexes = []
            
            # 提取表级别的 COMMENT (使用 SchemaCommentProperty)
            for prop in stmt.find_all(exp.SchemaCommentProperty):
                if prop.this:
                    table_comment = prop.this.this if hasattr(prop.this, 'this') else str(prop.this)
                    # 去除引号
                    table_comment = table_comment.strip("'\"")
                    break
            
            # 提取列定义
            schema = stmt.this
            if schema and hasattr(schema, 'expressions'):
                for col_def in schema.expressions:
                    if isinstance(col_def, exp.ColumnDef):
                        col_name = col_def.name
                        col_type = ""
                        nullable = True
                        default = None
                        comment = ""
                        is_pk = False
                        
                        # 提取列类型
                        if col_def.kind:
                            col_type = col_def.kind.sql(dialect="mysql")
                        
                        # 提取列约束
                        for constraint in col_def.constraints:
                            if isinstance(constraint.kind, exp.NotNullColumnConstraint):
                                nullable = False
                            elif isinstance(constraint.kind, exp.PrimaryKeyColumnConstraint):
                                is_pk = True
                                pk_columns.append(col_name)
                            elif isinstance(constraint.kind, exp.DefaultColumnConstraint):
                                if constraint.kind.this:
                                    default = constraint.kind.this.sql(dialect="mysql")
                            elif isinstance(constraint.kind, exp.CommentColumnConstraint):
                                if constraint.kind.this:
                                    comment = constraint.kind.this.this if hasattr(constraint.kind.this, 'this') else str(constraint.kind.this)
                                    comment = comment.strip("'\"")
                        
                        columns.append({
                            "name": col_name,
                            "type": col_type,
                            "nullable": nullable,
                            "default": default,
                            "comment": comment,
                            "is_pk": is_pk,
                        })
                    
                    # 提取表级主键约束
                    elif isinstance(col_def, exp.PrimaryKey):
                        for pk_col in col_def.expressions:
                            pk_name = pk_col.name if hasattr(pk_col, 'name') else str(pk_col)
                            if pk_name not in pk_columns:
                                pk_columns.append(pk_name)
                    
                    # 提取索引
                    elif isinstance(col_def, (exp.Index, exp.UniqueColumnConstraint)):
                        idx_cols = []
                        for idx_col in col_def.expressions:
                            idx_cols.append(idx_col.name if hasattr(idx_col, 'name') else str(idx_col))
                        if idx_cols:
                            indexes.append({
                                "columns": idx_cols,
                                "unique": isinstance(col_def, exp.UniqueColumnConstraint),
                            })
            
            # 更新列的主键标记
            for col in columns:
                if col["name"] in pk_columns:
                    col["is_pk"] = True
            
            tables.append({
                "name": table_name,
                "comment": table_comment,
                "columns": columns,
                "pk": pk_columns,
                "indexes": indexes,
                "foreign_keys": [],
            })
    
    except Exception as e:
        print(f"DDL 解析错误: {e}")
        return {"tables": []}
    
    return {"tables": tables}


def generate_db_doc(
    db_url: str,
    ddl_path: str,
    ddl_text: str,
    template_path: str | None,
    output_dir: str,
    output_filename: str | None = None,
) -> list[str]:
    out_dir = Path(output_dir).expanduser().resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    db_model = {}
    if db_url:
        db_model = _sanitize_value(reflect_db_schema(db_url))
    elif ddl_path or ddl_text:
        # 使用 sqlglot 解析 DDL 生成 db_model
        ddl_content = ddl_text
        if ddl_path and not ddl_text:
            ddl_content = Path(ddl_path).read_text(encoding="utf-8")
        db_model = _sanitize_value(parse_ddl_to_model(ddl_content))

    if not output_filename:
        ts = datetime.now().strftime("%Y%m%d%H%M%S")
        output_filename = f"Spec2Doc_数据库设计文档_{ts}.docx"
        if ddl_path:
            stem = Path(ddl_path).stem
            if stem:
                output_filename = f"{stem}.docx"
    return render_word_docs(
        api_model={"title": "数据库", "version": "", "endpoints": []},
        db_model=db_model,
        template_path=template_path or None,
        output_dir=str(out_dir),
        include_api=False,
        include_db=True,
        output_filename=output_filename,
    )
