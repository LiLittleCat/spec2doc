use crate::db::types::*;
use sqlx::sqlite::SqlitePoolOptions;
use sqlx::Row;

pub async fn extract(config: &ConnectionConfig) -> Result<ParsedSchema, String> {
    let db_path = &config.database;
    if db_path.is_empty() {
        return Err("SQLite database file path is required".to_string());
    }

    let url = format!("sqlite:{}", db_path);
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .acquire_timeout(std::time::Duration::from_secs(10))
        .connect(&url)
        .await
        .map_err(|e| format!("SQLite connection failed: {e}"))?;

    // Get tables from sqlite_master
    let table_rows = sqlx::query(
        "SELECT name FROM sqlite_master \
         WHERE type = 'table' AND name NOT LIKE 'sqlite_%' \
         ORDER BY name",
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Failed to query tables: {e}"))?;

    let mut tables = Vec::new();

    for (idx, row) in table_rows.iter().enumerate() {
        let table_name: String = row.get("name");

        // Get columns via PRAGMA table_info
        let col_rows =
            sqlx::query(&format!("PRAGMA table_info(\"{}\")", table_name.replace('"', "\"\"")))
                .fetch_all(&pool)
                .await
                .map_err(|e| format!("Failed to query columns for {table_name}: {e}"))?;

        let mut columns = Vec::new();
        for col_row in &col_rows {
            let name: String = col_row.get("name");
            let col_type: String = col_row.get("type");
            let notnull: i32 = col_row.get("notnull");
            let default_val: Option<String> = col_row.get("dflt_value");
            let pk: i32 = col_row.get("pk");

            columns.push(Column {
                name,
                col_type: col_type.to_uppercase(),
                nullable: notnull == 0 && pk == 0,
                is_primary: pk > 0,
                is_foreign: false, // Will be updated below
                comment: None,    // SQLite has no native column comments
                default: default_val,
            });
        }

        // Get foreign keys via PRAGMA foreign_key_list
        let fk_rows = sqlx::query(&format!(
            "PRAGMA foreign_key_list(\"{}\")",
            table_name.replace('"', "\"\"")
        ))
        .fetch_all(&pool)
        .await
        .unwrap_or_default();

        let fk_cols: std::collections::HashSet<String> = fk_rows
            .iter()
            .map(|r| {
                let col: String = r.get("from");
                col.to_lowercase()
            })
            .collect();

        // Mark foreign key columns
        for col in &mut columns {
            if fk_cols.contains(&col.name.to_lowercase()) {
                col.is_foreign = true;
            }
        }

        // Get indexes via PRAGMA index_list
        let idx_rows = sqlx::query(&format!(
            "PRAGMA index_list(\"{}\")",
            table_name.replace('"', "\"\"")
        ))
        .fetch_all(&pool)
        .await
        .unwrap_or_default();

        let mut indexes = Vec::new();
        for idx_row in &idx_rows {
            let index_name: String = idx_row.get("name");
            let unique: i32 = idx_row.get("unique");
            let origin: String = idx_row.get("origin");

            // Skip auto-created indexes for PRIMARY KEY
            if origin == "pk" {
                continue;
            }

            // Get index columns
            let info_rows = sqlx::query(&format!(
                "PRAGMA index_info(\"{}\")",
                index_name.replace('"', "\"\"")
            ))
            .fetch_all(&pool)
            .await
            .unwrap_or_default();

            let cols: Vec<String> = info_rows.iter().map(|r| r.get("name")).collect();

            if !cols.is_empty() {
                indexes.push(IndexInfo {
                    name: index_name,
                    columns: cols,
                    unique: unique == 1,
                });
            }
        }

        tables.push(TableInfo {
            id: format!("t{}", idx + 1),
            name: table_name,
            comment: None,
            columns,
            indexes: if indexes.is_empty() {
                None
            } else {
                Some(indexes)
            },
        });
    }

    pool.close().await;

    // Derive database name from file path
    let db_name = std::path::Path::new(db_path)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("sqlite")
        .to_string();

    Ok(ParsedSchema {
        database: db_name,
        tables,
    })
}
