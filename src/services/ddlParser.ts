import { Parser as MysqlParser } from "sql-ddl-to-json-schema";
import type { CompactJSONFormat } from "sql-ddl-to-json-schema";

// ── Public interfaces ──────────────────────────────────────────────

export interface Column {
  name: string;
  type: string;
  nullable: boolean;
  isPrimary: boolean;
  isForeign: boolean;
  comment?: string;
  default?: string;
}

export interface IndexInfo {
  name: string;
  columns: string[];
  unique: boolean;
}

export interface TableInfo {
  id: string;
  name: string;
  comment?: string;
  columns: Column[];
  indexes?: IndexInfo[];
}

export interface ParsedSchema {
  database: string;
  tables: TableInfo[];
}

// ── Main entry ─────────────────────────────────────────────────────

export function parseDDL(ddl: string): ParsedSchema {
  const trimmed = ddl.trim();
  if (!trimmed) {
    throw new Error("DDL 内容为空");
  }

  // Try library parser first (MySQL / MariaDB)
  try {
    const tables = parseWithLibrary(trimmed);
    if (tables.length > 0) {
      return { database: inferDatabaseName(trimmed), tables };
    }
  } catch {
    // fall through to regex parser
  }

  // Fallback: regex parser (PostgreSQL / SQL Server / SQLite / generic)
  const tables = parseWithRegex(trimmed);
  if (tables.length === 0) {
    throw new Error("未能从 DDL 中解析出任何表结构");
  }
  return { database: inferDatabaseName(trimmed), tables };
}

// ── Library parser (sql-ddl-to-json-schema, MySQL) ─────────────────

function parseWithLibrary(ddl: string): TableInfo[] {
  const parser = new MysqlParser("mysql");
  parser.feed(ddl);
  const compact: CompactJSONFormat[] = parser.toCompactJson();
  return compact.map((t, idx) => compactToTableInfo(t, idx));
}

function formatColumnType(dt: CompactJSONFormat["columns"][0]["type"]): string {
  const base = dt.datatype.toUpperCase();
  if (dt.length !== undefined && dt.length > 0) {
    // blob/text types have huge default lengths — only show for string types
    if (dt.length <= 65535 || /char|binary/i.test(dt.datatype)) {
      return `${base}(${dt.length})`;
    }
    return base;
  }
  if (dt.digits !== undefined) {
    return dt.decimals !== undefined ? `${base}(${dt.digits},${dt.decimals})` : `${base}(${dt.digits})`;
  }
  if (dt.displayWidth !== undefined) {
    return `${base}(${dt.displayWidth})`;
  }
  if (dt.values !== undefined) {
    return `${base}(${dt.values.map((v) => `'${v}'`).join(",")})`;
  }
  return base;
}

function compactToTableInfo(t: CompactJSONFormat, idx: number): TableInfo {
  const pkColumns = new Set(
    (t.primaryKey?.columns ?? []).map((c) => c.column).filter(Boolean),
  );

  const fkColumns = new Set<string>();
  for (const fk of t.foreignKeys ?? []) {
    for (const c of fk.columns) {
      if (c.column) fkColumns.add(c.column);
    }
  }

  const columns: Column[] = (t.columns ?? []).map((col) => {
    const isPrimary = pkColumns.has(col.name) || col.options?.primary === true;
    const isForeign = fkColumns.has(col.name) || col.reference != null;
    const defaultVal = col.options?.default;

    return {
      name: col.name,
      type: formatColumnType(col.type),
      nullable: col.options?.nullable !== false,
      isPrimary,
      isForeign,
      comment: col.options?.comment || undefined,
      default: defaultVal != null ? String(defaultVal) : undefined,
    };
  });

  const indexes: IndexInfo[] = [];
  for (const uk of t.uniqueKeys ?? []) {
    indexes.push({
      name: uk.name || `unique_${indexes.length}`,
      columns: uk.columns.map((c) => c.column ?? "").filter(Boolean),
      unique: true,
    });
  }
  for (const ix of t.indexes ?? []) {
    indexes.push({
      name: ix.name || `index_${indexes.length}`,
      columns: ix.columns.map((c) => c.column ?? "").filter(Boolean),
      unique: false,
    });
  }

  return {
    id: `t${idx + 1}`,
    name: t.name,
    comment: t.options?.comment || undefined,
    columns,
    indexes: indexes.length > 0 ? indexes : undefined,
  };
}

// ── Regex fallback parser ──────────────────────────────────────────

function parseWithRegex(ddl: string): TableInfo[] {
  const tables: TableInfo[] = [];
  const tableComments = new Map<string, string>();
  const columnComments = new Map<string, string>();

  // Collect PostgreSQL COMMENT ON statements
  const commentOnTableRe =
    /COMMENT\s+ON\s+TABLE\s+(?:(?:"([^"]+)"|(\w+))\.)?(?:"([^"]+)"|(\w+))\s+IS\s+'((?:[^']|'')*)'/gi;
  for (const m of ddl.matchAll(commentOnTableRe)) {
    const tableName = m[3] || m[4] || "";
    tableComments.set(tableName.toLowerCase(), m[5].replace(/''/g, "'"));
  }

  const commentOnColRe =
    /COMMENT\s+ON\s+COLUMN\s+(?:(?:"([^"]+)"|(\w+))\.)?(?:"([^"]+)"|(\w+))\.(?:"([^"]+)"|(\w+))\s+IS\s+'((?:[^']|'')*)'/gi;
  for (const m of ddl.matchAll(commentOnColRe)) {
    const tableName = m[3] || m[4] || "";
    const colName = m[5] || m[6] || "";
    columnComments.set(
      `${tableName.toLowerCase()}.${colName.toLowerCase()}`,
      m[7].replace(/''/g, "'"),
    );
  }

  // Collect CREATE [UNIQUE] INDEX statements
  const externalIndexes = new Map<string, IndexInfo[]>();
  const createIndexRe =
    /CREATE\s+(UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:"([^"]+)"|`([^`]+)`|\[([^\]]+)\]|(\w+))\s+ON\s+(?:(?:"([^"]+)"|`([^`]+)`|\[([^\]]+)\]|(\w+))\.)?(?:"([^"]+)"|`([^`]+)`|\[([^\]]+)\]|(\w+))\s*\(([^)]+)\)/gi;
  for (const m of ddl.matchAll(createIndexRe)) {
    const isUnique = !!m[1];
    const idxName = m[2] || m[3] || m[4] || m[5] || "";
    const tblName = m[10] || m[11] || m[12] || m[13] || "";
    const colsPart = m[14] || "";
    const cols = colsPart
      .split(",")
      .map((c) => c.trim().replace(/^["'`[\]]+|["'`[\]]+$/g, "").split(/\s/)[0])
      .filter(Boolean);
    const key = tblName.toLowerCase();
    if (!externalIndexes.has(key)) externalIndexes.set(key, []);
    externalIndexes.get(key)!.push({ name: idxName, columns: cols, unique: isUnique });
  }

  // Parse CREATE TABLE statements
  const createTableRe =
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:(?:"([^"]+)"|`([^`]+)`|\[([^\]]+)\]|(\w+))\.)?(?:"([^"]+)"|`([^`]+)`|\[([^\]]+)\]|(\w+))\s*\(([\s\S]*?)\)(?:\s*(?:COMMENT\s*=?\s*'((?:[^']|'')*)'|ENGINE|WITH|TABLESPACE|;|\s*$))?/gi;

  let tableIdx = 0;
  for (const m of ddl.matchAll(createTableRe)) {
    const tableName = m[5] || m[6] || m[7] || m[8] || "";
    const body = m[9] || "";
    const inlineComment = m[10]?.replace(/''/g, "'");

    const tableNameLower = tableName.toLowerCase();
    const comment =
      inlineComment || tableComments.get(tableNameLower) || undefined;

    const defs = splitColumnDefs(body);
    const columns: Column[] = [];
    const indexes: IndexInfo[] = [];
    const pkColumnsFromConstraint = new Set<string>();
    const fkColumnsFromConstraint = new Set<string>();

    // First pass: extract table-level constraints
    for (const def of defs) {
      const trimDef = def.trim();
      if (isConstraintDef(trimDef)) {
        parseConstraint(trimDef, pkColumnsFromConstraint, fkColumnsFromConstraint, indexes);
      }
    }

    // Second pass: parse column definitions
    for (const def of defs) {
      const trimDef = def.trim();
      if (!trimDef || isConstraintDef(trimDef)) continue;

      const col = parseColumnDef(trimDef);
      if (!col) continue;

      if (pkColumnsFromConstraint.has(col.name.toLowerCase())) {
        col.isPrimary = true;
      }
      if (fkColumnsFromConstraint.has(col.name.toLowerCase())) {
        col.isForeign = true;
      }

      // Apply PostgreSQL COMMENT ON COLUMN
      const colCommentKey = `${tableNameLower}.${col.name.toLowerCase()}`;
      if (!col.comment && columnComments.has(colCommentKey)) {
        col.comment = columnComments.get(colCommentKey);
      }

      columns.push(col);
    }

    // Merge external indexes
    const extIdxs = externalIndexes.get(tableNameLower) ?? [];
    indexes.push(...extIdxs);

    tableIdx++;
    tables.push({
      id: `t${tableIdx}`,
      name: tableName,
      comment,
      columns,
      indexes: indexes.length > 0 ? indexes : undefined,
    });
  }

  return tables;
}

/** Split column definitions by commas, respecting parentheses nesting. */
function splitColumnDefs(body: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";

  for (const ch of body) {
    if (ch === "(") {
      depth++;
      current += ch;
    } else if (ch === ")") {
      depth--;
      current += ch;
    } else if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }

  if (current.trim()) {
    parts.push(current);
  }
  return parts;
}

const CONSTRAINT_PREFIXES = /^\s*(?:CONSTRAINT\s+(?:"[^"]+"|`[^`]+`|\[[^\]]+\]|\w+)\s+)?(?:PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE(?:\s+(?:KEY|INDEX))?|INDEX|KEY|CHECK)\s*[( ]/i;

function isConstraintDef(def: string): boolean {
  return CONSTRAINT_PREFIXES.test(def);
}

function parseConstraint(
  def: string,
  pkCols: Set<string>,
  fkCols: Set<string>,
  indexes: IndexInfo[],
): void {
  // PRIMARY KEY
  const pkMatch = def.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
  if (pkMatch) {
    for (const c of extractColumnNames(pkMatch[1])) pkCols.add(c.toLowerCase());
    return;
  }

  // FOREIGN KEY
  const fkMatch = def.match(/FOREIGN\s+KEY\s*\(([^)]+)\)/i);
  if (fkMatch) {
    for (const c of extractColumnNames(fkMatch[1])) fkCols.add(c.toLowerCase());
    return;
  }

  // UNIQUE KEY / UNIQUE INDEX / UNIQUE (...)
  const uqMatch = def.match(/UNIQUE(?:\s+(?:KEY|INDEX))?\s+(?:(?:"([^"]+)"|`([^`]+)`|\[([^\]]+)\]|(\w+))\s*)?\(([^)]+)\)/i);
  if (uqMatch) {
    const name = uqMatch[1] || uqMatch[2] || uqMatch[3] || uqMatch[4] || `unique_${indexes.length}`;
    indexes.push({ name, columns: extractColumnNames(uqMatch[5]), unique: true });
    return;
  }

  // INDEX / KEY
  const ixMatch = def.match(/(?:INDEX|KEY)\s+(?:(?:"([^"]+)"|`([^`]+)`|\[([^\]]+)\]|(\w+))\s*)?\(([^)]+)\)/i);
  if (ixMatch) {
    const name = ixMatch[1] || ixMatch[2] || ixMatch[3] || ixMatch[4] || `index_${indexes.length}`;
    indexes.push({ name, columns: extractColumnNames(ixMatch[5]), unique: false });
  }
}

function extractColumnNames(colList: string): string[] {
  return colList
    .split(",")
    .map((c) => {
      const trimmed = c.trim().replace(/^["'`[\]]+|["'`[\]]+$/g, "");
      // Remove sort direction and length suffix
      return trimmed.split(/[\s(]/)[0];
    })
    .filter(Boolean);
}

/** Keyword boundary that terminates the column type. */
const TYPE_TERMINATOR =
  /\b(?:NOT\s+NULL|NULL|DEFAULT|PRIMARY\s+KEY|COMMENT|REFERENCES|AUTO_INCREMENT|IDENTITY|UNIQUE|CHECK|GENERATED|COLLATE|ON\s+UPDATE|CONSTRAINT|WITH\s+TIME\s+ZONE|WITHOUT\s+TIME\s+ZONE)\b/i;

function parseColumnDef(def: string): Column | null {
  // Match: column_name type ...
  const colMatch = def.match(
    /^\s*(?:"([^"]+)"|`([^`]+)`|\[([^\]]+)\]|(\w+))\s+([\s\S]+)$/,
  );
  if (!colMatch) return null;

  const name = colMatch[1] || colMatch[2] || colMatch[3] || colMatch[4] || "";
  const rest = colMatch[5];

  // Extract type — everything before the first keyword
  const terminatorIdx = rest.search(TYPE_TERMINATOR);
  let rawType =
    terminatorIdx > 0 ? rest.substring(0, terminatorIdx).trim() : rest.trim();

  // Remove trailing commas / semicolons
  rawType = rawType.replace(/[,;]+$/, "").trim();

  // Normalize: keep everything up to the closing paren if there is one
  const typeParen = rawType.match(/^(\S+\s*\([^)]*\))/);
  const colType = typeParen ? typeParen[1].toUpperCase() : rawType.split(/\s/)[0].toUpperCase();

  if (!colType) return null;

  const upperRest = rest.toUpperCase();
  const nullable = !/\bNOT\s+NULL\b/i.test(rest);
  const isPrimary = /\bPRIMARY\s+KEY\b/i.test(rest);
  const isForeign = /\bREFERENCES\b/i.test(rest);

  // DEFAULT value
  let defaultVal: string | undefined;
  const defaultMatch = rest.match(
    /\bDEFAULT\s+('(?:[^']|'')*'|"(?:[^"]|"")*"|\S+)/i,
  );
  if (defaultMatch) {
    defaultVal = defaultMatch[1].replace(/^['"]|['"]$/g, "").replace(/''/g, "'");
  }

  // COMMENT (MySQL inline)
  let comment: string | undefined;
  const commentMatch = rest.match(/\bCOMMENT\s+'((?:[^']|'')*)'/i);
  if (commentMatch) {
    comment = commentMatch[1].replace(/''/g, "'");
  }

  return { name, type: colType, nullable, isPrimary, isForeign, comment, default: defaultVal };
}

// ── Helpers ────────────────────────────────────────────────────────

function inferDatabaseName(ddl: string): string {
  // Try CREATE DATABASE / USE
  const dbMatch = ddl.match(
    /(?:CREATE\s+DATABASE\s+(?:IF\s+NOT\s+EXISTS\s+)?|USE\s+)(?:"([^"]+)"|`([^`]+)`|\[([^\]]+)\]|(\w+))/i,
  );
  if (dbMatch) {
    return dbMatch[1] || dbMatch[2] || dbMatch[3] || dbMatch[4] || "";
  }

  // Try schema prefix on first table: schema.table
  const schemaMatch = ddl.match(
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:"([^"]+)"|`([^`]+)`|\[([^\]]+)\]|(\w+))\./i,
  );
  if (schemaMatch) {
    return schemaMatch[1] || schemaMatch[2] || schemaMatch[3] || schemaMatch[4] || "";
  }

  return "database";
}
