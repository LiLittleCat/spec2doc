use crate::db::connection::build_mysql_url;
use crate::db::types::*;
use sqlx::mysql::MySqlPoolOptions;
use sqlx::Row;

pub async fn extract(
    config: &ConnectionConfig,
    host: &str,
    port: u16,
) -> Result<ParsedSchema, String> {
    let url = build_mysql_url(config, host, port);
    let pool = MySqlPoolOptions::new()
        .max_connections(2)
        .acquire_timeout(std::time::Duration::from_secs(10))
        .connect(&url)
        .await
        .map_err(|e| format!("MySQL connection failed: {e}"))?;

    // Get tables
    let table_rows = sqlx::query(
        "SELECT TABLE_NAME, TABLE_COMMENT \
         FROM information_schema.TABLES \
         WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' \
         ORDER BY TABLE_NAME",
    )
    .bind(&config.database)
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Failed to query tables: {e}"))?;

    let mut tables = Vec::new();

    for (idx, row) in table_rows.iter().enumerate() {
        let table_name: String = row.get("TABLE_NAME");
        let table_comment: Option<String> = row.get("TABLE_COMMENT");
        let table_comment = table_comment.filter(|c| !c.is_empty());

        // Get columns
        let col_rows = sqlx::query(
            "SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, \
             COLUMN_COMMENT, COLUMN_KEY, EXTRA \
             FROM information_schema.COLUMNS \
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? \
             ORDER BY ORDINAL_POSITION",
        )
        .bind(&config.database)
        .bind(&table_name)
        .fetch_all(&pool)
        .await
        .map_err(|e| format!("Failed to query columns for {table_name}: {e}"))?;

        let mut columns = Vec::new();
        for col_row in &col_rows {
            let name: String = col_row.get("COLUMN_NAME");
            let col_type: String = col_row.get("COLUMN_TYPE");
            let nullable: String = col_row.get("IS_NULLABLE");
            let default: Option<String> = col_row.get("COLUMN_DEFAULT");
            let comment: Option<String> = col_row.get("COLUMN_COMMENT");
            let column_key: String = col_row.get("COLUMN_KEY");

            columns.push(Column {
                name,
                col_type: col_type.to_uppercase(),
                nullable: nullable == "YES",
                is_primary: column_key == "PRI",
                is_foreign: column_key == "MUL",
                comment: comment.filter(|c| !c.is_empty()),
                default,
            });
        }

        // Get indexes
        let idx_rows = sqlx::query(
            "SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE \
             FROM information_schema.STATISTICS \
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? \
             ORDER BY INDEX_NAME, SEQ_IN_INDEX",
        )
        .bind(&config.database)
        .bind(&table_name)
        .fetch_all(&pool)
        .await
        .map_err(|e| format!("Failed to query indexes for {table_name}: {e}"))?;

        let mut indexes: Vec<IndexInfo> = Vec::new();
        for idx_row in &idx_rows {
            let index_name: String = idx_row.get("INDEX_NAME");
            let column_name: String = idx_row.get("COLUMN_NAME");
            let non_unique: i32 = idx_row.get("NON_UNIQUE");

            // Skip PRIMARY key index since we already mark primary columns
            if index_name == "PRIMARY" {
                continue;
            }

            if let Some(existing) = indexes.iter_mut().find(|i| i.name == index_name) {
                existing.columns.push(column_name);
            } else {
                indexes.push(IndexInfo {
                    name: index_name,
                    columns: vec![column_name],
                    unique: non_unique == 0,
                });
            }
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
