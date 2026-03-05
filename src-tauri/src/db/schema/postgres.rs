use crate::db::connection::build_postgres_url;
use crate::db::types::*;
use sqlx::postgres::PgPoolOptions;
use sqlx::Row;

pub async fn extract(
    config: &ConnectionConfig,
    host: &str,
    port: u16,
) -> Result<ParsedSchema, String> {
    let url = build_postgres_url(config, host, port);
    let pool = PgPoolOptions::new()
        .max_connections(1)
        .acquire_timeout(std::time::Duration::from_secs(10))
        .connect(&url)
        .await
        .map_err(|e| format!("PostgreSQL connection failed: {e}"))?;

    // Get tables in public schema
    let table_rows = sqlx::query(
        "SELECT c.relname AS table_name, \
                obj_description(c.oid) AS table_comment \
         FROM pg_class c \
         JOIN pg_namespace n ON n.oid = c.relnamespace \
         WHERE n.nspname = 'public' \
           AND c.relkind = 'r' \
         ORDER BY c.relname",
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Failed to query tables: {e}"))?;

    let mut tables = Vec::new();

    for (idx, row) in table_rows.iter().enumerate() {
        let table_name: String = row.get("table_name");
        let table_comment: Option<String> = row.get("table_comment");
        let table_comment = table_comment.filter(|c| !c.is_empty());

        // Get columns with type, nullable, default, comment, primary key
        let col_rows = sqlx::query(
            "SELECT a.attname AS column_name, \
                    format_type(a.atttypid, a.atttypmod) AS column_type, \
                    NOT a.attnotnull AS nullable, \
                    pg_get_expr(d.adbin, d.adrelid) AS column_default, \
                    col_description(a.attrelid, a.attnum) AS column_comment, \
                    EXISTS ( \
                        SELECT 1 FROM pg_index i \
                        WHERE i.indrelid = a.attrelid \
                          AND a.attnum = ANY(i.indkey) \
                          AND i.indisprimary \
                    ) AS is_primary \
             FROM pg_attribute a \
             JOIN pg_class c ON c.oid = a.attrelid \
             JOIN pg_namespace n ON n.oid = c.relnamespace \
             LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum \
             WHERE n.nspname = 'public' \
               AND c.relname = $1 \
               AND a.attnum > 0 \
               AND NOT a.attisdropped \
             ORDER BY a.attnum",
        )
        .bind(&table_name)
        .fetch_all(&pool)
        .await
        .map_err(|e| format!("Failed to query columns for {table_name}: {e}"))?;

        // Get foreign key columns
        let fk_rows = sqlx::query(
            "SELECT kcu.column_name \
             FROM information_schema.table_constraints tc \
             JOIN information_schema.key_column_usage kcu \
               ON tc.constraint_name = kcu.constraint_name \
              AND tc.table_schema = kcu.table_schema \
             WHERE tc.constraint_type = 'FOREIGN KEY' \
               AND tc.table_schema = 'public' \
               AND tc.table_name = $1",
        )
        .bind(&table_name)
        .fetch_all(&pool)
        .await
        .map_err(|e| format!("Failed to query foreign keys for {table_name}: {e}"))?;

        let fk_cols: std::collections::HashSet<String> = fk_rows
            .iter()
            .map(|r| {
                let col: String = r.get("column_name");
                col.to_lowercase()
            })
            .collect();

        let mut columns = Vec::new();
        for col_row in &col_rows {
            let name: String = col_row.get("column_name");
            let col_type: String = col_row.get("column_type");
            let nullable: bool = col_row.get("nullable");
            let default: Option<String> = col_row.get("column_default");
            let comment: Option<String> = col_row.get("column_comment");
            let is_primary: bool = col_row.get("is_primary");

            columns.push(Column {
                is_foreign: fk_cols.contains(&name.to_lowercase()),
                name,
                col_type: col_type.to_uppercase(),
                nullable,
                is_primary,
                comment: comment.filter(|c| !c.is_empty()),
                default,
            });
        }

        // Get indexes (non-primary, non-unique constraint)
        let idx_rows = sqlx::query(
            "SELECT i.relname AS index_name, \
                    ix.indisunique AS is_unique, \
                    array_agg(a.attname ORDER BY k.n) AS columns \
             FROM pg_index ix \
             JOIN pg_class t ON t.oid = ix.indrelid \
             JOIN pg_class i ON i.oid = ix.indexrelid \
             JOIN pg_namespace n ON n.oid = t.relnamespace \
             CROSS JOIN LATERAL unnest(ix.indkey) WITH ORDINALITY AS k(attnum, n) \
             JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum \
             WHERE n.nspname = 'public' \
               AND t.relname = $1 \
               AND NOT ix.indisprimary \
             GROUP BY i.relname, ix.indisunique \
             ORDER BY i.relname",
        )
        .bind(&table_name)
        .fetch_all(&pool)
        .await
        .map_err(|e| format!("Failed to query indexes for {table_name}: {e}"))?;

        let mut indexes = Vec::new();
        for idx_row in &idx_rows {
            let index_name: String = idx_row.get("index_name");
            let is_unique: bool = idx_row.get("is_unique");
            let columns: Vec<String> = idx_row.get("columns");

            indexes.push(IndexInfo {
                name: index_name,
                columns,
                unique: is_unique,
            });
        }

        tables.push(TableInfo {
            id: format!("t{}", idx + 1),
            name: table_name,
            comment: table_comment,
            columns,
            indexes: if indexes.is_empty() {
                None
            } else {
                Some(indexes)
            },
        });
    }

    pool.close().await;

    Ok(ParsedSchema {
        database: config.database.clone(),
        tables,
    })
}
