import { Parser } from "node-sql-parser";

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

// ── Internal types ─────────────────────────────────────────────────

type AST = any;

const DIALECTS = ["MySQL", "Postgresql", "TransactSQL", "Sqlite"] as const;
type Dialect = (typeof DIALECTS)[number];

// ── Main entry ─────────────────────────────────────────────────────

export function parseDDL(ddl: string): ParsedSchema {
  const trimmed = ddl.trim();
  if (!trimmed) {
    throw new Error("DDL 内容为空");
  }

  const cleaned = stripUnsupportedStatements(trimmed);

  for (const dialect of DIALECTS) {
    try {
      const tables = tryParse(cleaned, dialect);
      if (tables.length > 0) {
        mergeCommentOn(trimmed, tables);
        mergeAlterTableConstraints(trimmed, tables);
        return { database: inferDatabaseName(trimmed), tables };
      }
    } catch {
      // try next dialect
    }
  }

  throw new Error("未能从 DDL 中解析出任何表结构");
}

/**
 * Strip statements that node-sql-parser cannot handle
 * (e.g. SET NAMES, SET CHARACTER SET — session-level, not structural DDL).
 */
function stripUnsupportedStatements(ddl: string): string {
  return ddl.replace(/^\s*SET\s+(?:NAMES|CHARACTER\s+SET)\s+[^;]*;\s*$/gim, "");
}

// ── AST-based parsing ──────────────────────────────────────────────

function tryParse(ddl: string, dialect: Dialect): TableInfo[] {
  const parser = new Parser();
  const ast = parser.astify(ddl, { database: dialect });
  const stmts: AST[] = Array.isArray(ast) ? ast : [ast];

  const tables: TableInfo[] = [];
  let idx = 0;

  for (const stmt of stmts) {
    if (stmt.type === "create" && stmt.keyword === "table") {
      idx++;
      tables.push(astToTableInfo(stmt, idx));
    }
  }

  return tables;
}

function astToTableInfo(stmt: AST, idx: number): TableInfo {
  const tableName = extractTableName(stmt);
  const defs: AST[] = stmt.create_definitions ?? [];

  // First pass: collect PK/FK column names from table-level constraints & indexes
  const pkCols = new Set<string>();
  const fkCols = new Set<string>();
  const indexes: IndexInfo[] = [];

  for (const def of defs) {
    if (def.resource === "constraint") {
      processConstraint(def, pkCols, fkCols, indexes);
    } else if (def.resource === "index") {
      processIndex(def, indexes);
    }
  }

  // Second pass: process column definitions
  const columns: Column[] = [];
  for (const def of defs) {
    if (def.resource === "column") {
      const col = processColumn(def, pkCols, fkCols);
      if (col) columns.push(col);
    }
  }

  const comment = extractTableComment(stmt.table_options);

  return {
    id: `t${idx}`,
    name: tableName,
    comment,
    columns,
    indexes: indexes.length > 0 ? indexes : undefined,
  };
}

// ── Column processing ──────────────────────────────────────────────

function processColumn(def: AST, pkCols: Set<string>, fkCols: Set<string>): Column | null {
  const name = getColumnName(def.column);
  if (!name) return null;

  const type = formatType(def.definition);
  const nameLower = name.toLowerCase();

  return {
    name,
    type,
    nullable: def.nullable?.type !== "not null",
    isPrimary: !!def.primary_key || !!def.primary || pkCols.has(nameLower),
    isForeign: !!def.reference_definition || fkCols.has(nameLower),
    comment: extractStringValue(def.comment?.value),
    default: extractDefaultValue(def.default_val),
  };
}

// ── Constraint & index processing ──────────────────────────────────

function processConstraint(
  def: AST,
  pkCols: Set<string>,
  fkCols: Set<string>,
  indexes: IndexInfo[],
): void {
  const ctype = String(def.constraint_type ?? "").toLowerCase();
  const cols = extractDefColumns(def.definition);

  if (ctype === "primary key") {
    for (const c of cols) pkCols.add(c.toLowerCase());
  } else if (ctype === "foreign key") {
    for (const c of cols) fkCols.add(c.toLowerCase());
  } else if (ctype.includes("unique")) {
    indexes.push({
      name: def.constraint || def.index || `unique_${indexes.length}`,
      columns: cols,
      unique: true,
    });
  }
}

function processIndex(def: AST, indexes: IndexInfo[]): void {
  const cols = extractDefColumns(def.definition);
  indexes.push({
    name: def.index || `index_${indexes.length}`,
    columns: cols,
    unique: false,
  });
}

// ── Name & value extraction helpers ────────────────────────────────

function getColumnName(ref: AST): string {
  if (!ref) return "";
  const col = ref.column;
  if (typeof col === "string") return col;
  if (col?.expr?.value != null) return String(col.expr.value);
  if (col?.value != null) return String(col.value);
  return "";
}

function extractDefColumns(defs: AST[] | undefined): string[] {
  if (!defs) return [];
  return defs.map((d: AST) => getColumnName(d)).filter(Boolean);
}

function extractTableName(stmt: AST): string {
  const table = stmt.table?.[0];
  if (!table) return "";
  const name = table.table;
  if (typeof name === "string") return name;
  if (name?.expr?.value != null) return String(name.expr.value);
  return String(name ?? "");
}

function formatType(definition: AST): string {
  if (!definition) return "UNKNOWN";
  const base = String(definition.dataType ?? "UNKNOWN").toUpperCase();

  if (definition.length != null) {
    if (definition.scale != null) {
      return `${base}(${definition.length},${definition.scale})`;
    }
    return `${base}(${definition.length})`;
  }

  const suffix = definition.suffix != null ? ` ${String(definition.suffix).toUpperCase()}` : "";
  return `${base}${suffix}`;
}

function extractStringValue(val: AST): string | undefined {
  if (val == null) return undefined;
  if (typeof val === "string") return val;
  if (typeof val === "object" && val.value != null) return String(val.value);
  return undefined;
}

function extractDefaultValue(defaultVal: AST): string | undefined {
  if (!defaultVal) return undefined;
  const val = defaultVal.value;
  if (val == null) return undefined;
  if (typeof val !== "object") return String(val);
  if (val.value != null) return String(val.value);
  if (val.type === "null") return "NULL";
  return undefined;
}

function extractTableComment(options: AST[] | undefined): string | undefined {
  if (!options) return undefined;
  for (const opt of options) {
    const kw = String(opt.keyword ?? "").toLowerCase();
    if (kw === "comment") {
      return extractStringValue(opt.value);
    }
  }
  return undefined;
}

// ── PostgreSQL COMMENT ON merging (regex) ──────────────────────────

function mergeCommentOn(ddl: string, tables: TableInfo[]): void {
  const tableMap = new Map(tables.map((t) => [t.name.toLowerCase(), t]));

  // COMMENT ON TABLE [schema.]table IS 'comment'
  const commentOnTableRe =
    /COMMENT\s+ON\s+TABLE\s+(?:(?:"([^"]+)"|(\w+))\.)?(?:"([^"]+)"|(\w+))\s+IS\s+'((?:[^']|'')*)'/gi;
  for (const m of ddl.matchAll(commentOnTableRe)) {
    const tableName = m[3] || m[4] || "";
    const table = tableMap.get(tableName.toLowerCase());
    if (table && !table.comment) {
      table.comment = m[5].replace(/''/g, "'");
    }
  }

  // COMMENT ON COLUMN [schema.]table.column IS 'comment'
  const commentOnColRe =
    /COMMENT\s+ON\s+COLUMN\s+(?:(?:"([^"]+)"|(\w+))\.)?(?:"([^"]+)"|(\w+))\.(?:"([^"]+)"|(\w+))\s+IS\s+'((?:[^']|'')*)'/gi;
  for (const m of ddl.matchAll(commentOnColRe)) {
    const tableName = m[3] || m[4] || "";
    const colName = m[5] || m[6] || "";
    const table = tableMap.get(tableName.toLowerCase());
    if (table) {
      const col = table.columns.find((c) => c.name.toLowerCase() === colName.toLowerCase());
      if (col && !col.comment) {
        col.comment = m[7].replace(/''/g, "'");
      }
    }
  }
}

// ── ALTER TABLE constraint merging (regex) ─────────────────────────

function mergeAlterTableConstraints(ddl: string, tables: TableInfo[]): void {
  const tableMap = new Map(tables.map((t) => [t.name.toLowerCase(), t]));

  // ALTER TABLE [schema.]table ADD CONSTRAINT name PRIMARY KEY (cols)
  const alterPkRe =
    /ALTER\s+TABLE\s+(?:(?:"([^"]+)"|`([^`]+)`|\[([^\]]+)\]|(\w+))\.)?(?:"([^"]+)"|`([^`]+)`|\[([^\]]+)\]|(\w+))\s+ADD\s+CONSTRAINT\s+(?:"[^"]+"|`[^`]+`|\[[^\]]+\]|\w+)\s+PRIMARY\s+KEY\s*\(([^)]+)\)/gi;
  for (const m of ddl.matchAll(alterPkRe)) {
    const tableName = m[5] || m[6] || m[7] || m[8] || "";
    const table = tableMap.get(tableName.toLowerCase());
    if (table) {
      const pkCols = m[9].split(",").map((c) => c.trim().replace(/^["'`[\]]+|["'`[\]]+$/g, ""));
      for (const pkCol of pkCols) {
        const col = table.columns.find((c) => c.name.toLowerCase() === pkCol.toLowerCase());
        if (col) col.isPrimary = true;
      }
    }
  }
}

// ── Database name inference ────────────────────────────────────────

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
