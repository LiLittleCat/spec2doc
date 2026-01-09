from __future__ import annotations

from sqlalchemy import create_engine, inspect


def reflect_db_schema(db_url: str) -> dict:
    engine = create_engine(db_url)
    insp = inspect(engine)

    tables = []
    for tname in insp.get_table_names():
        cols = []
        for c in insp.get_columns(tname):
            cols.append({
                "name": c.get("name"),
                "type": str(c.get("type")),
                "nullable": bool(c.get("nullable", True)),
                "default": c.get("default"),
            })

        pk = insp.get_pk_constraint(tname) or {}
        fks = insp.get_foreign_keys(tname) or []
        indexes = insp.get_indexes(tname) or []

        tables.append({
            "name": tname,
            "columns": cols,
            "pk": pk.get("constrained_columns", []),
            "foreign_keys": fks,
            "indexes": indexes,
        })

    return {"tables": tables}
