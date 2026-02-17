use crate::db::connection::connect_sqlserver;
use crate::db::types::*;
use tiberius::Row;

pub async fn extract(
    config: &ConnectionConfig,
    host: &str,
    port: u16,
) -> Result<ParsedSchema, String> {
    let mut client = connect_sqlserver(config, host, port).await?;

    // Get tables
    let table_rows = client
        .query(
            "SELECT t.TABLE_NAME, \
                    ep.value AS TABLE_COMMENT \
             FROM INFORMATION_SCHEMA.TABLES t \
             LEFT JOIN sys.extended_properties ep \
               ON ep.major_id = OBJECT_ID(t.TABLE_SCHEMA + '.' + t.TABLE_NAME) \
              AND ep.minor_id = 0 \
              AND ep.name = 'MS_Description' \
             WHERE t.TABLE_TYPE = 'BASE TABLE' \
               AND t.TABLE_CATALOG = @P1 \
             ORDER BY t.TABLE_NAME",
            &[&config.database],
        )
        .await
        .map_err(|e| format!("Failed to query tables: {e}"))?
        .into_results()
        .await
        .map_err(|e| format!("Failed to fetch table results: {e}"))?;

    let table_rows = table_rows.into_iter().next().unwrap_or_default();
    let mut tables = Vec::new();

    for (idx, row) in table_rows.iter().enumerate() {
        let table_name = get_str(&row, "TABLE_NAME");
        let table_comment = get_opt_str(&row, "TABLE_COMMENT");

        // Get columns
        let col_results = client
            .query(
                "SELECT c.COLUMN_NAME, \
                        c.DATA_TYPE + CASE \
                            WHEN c.CHARACTER_MAXIMUM_LENGTH IS NOT NULL \
                            THEN '(' + CAST(c.CHARACTER_MAXIMUM_LENGTH AS VARCHAR) + ')' \
                            WHEN c.NUMERIC_PRECISION IS NOT NULL AND c.NUMERIC_SCALE IS NOT NULL AND c.NUMERIC_SCALE > 0 \
                            THEN '(' + CAST(c.NUMERIC_PRECISION AS VARCHAR) + ',' + CAST(c.NUMERIC_SCALE AS VARCHAR) + ')' \
                            ELSE '' \
                        END AS COLUMN_TYPE, \
                        c.IS_NULLABLE, \
                        c.COLUMN_DEFAULT, \
                        ep.value AS COLUMN_COMMENT, \
                        CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END AS IS_PRIMARY, \
                        CASE WHEN fk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END AS IS_FOREIGN \
                 FROM INFORMATION_SCHEMA.COLUMNS c \
                 LEFT JOIN sys.extended_properties ep \
                   ON ep.major_id = OBJECT_ID(c.TABLE_SCHEMA + '.' + c.TABLE_NAME) \
                  AND ep.minor_id = c.ORDINAL_POSITION \
                  AND ep.name = 'MS_Description' \
                 LEFT JOIN ( \
                     SELECT ku.TABLE_NAME, ku.COLUMN_NAME \
                     FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc \
                     JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku \
                       ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME \
                     WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY' \
                 ) pk ON pk.TABLE_NAME = c.TABLE_NAME AND pk.COLUMN_NAME = c.COLUMN_NAME \
                 LEFT JOIN ( \
                     SELECT ku.TABLE_NAME, ku.COLUMN_NAME \
                     FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc \
                     JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku \
                       ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME \
                     WHERE tc.CONSTRAINT_TYPE = 'FOREIGN KEY' \
                 ) fk ON fk.TABLE_NAME = c.TABLE_NAME AND fk.COLUMN_NAME = c.COLUMN_NAME \
                 WHERE c.TABLE_NAME = @P1 AND c.TABLE_CATALOG = @P2 \
                 ORDER BY c.ORDINAL_POSITION",
                &[&table_name, &config.database],
            )
            .await
            .map_err(|e| format!("Failed to query columns for {table_name}: {e}"))?
            .into_results()
            .await
            .map_err(|e| format!("Failed to fetch column results for {table_name}: {e}"))?;

        let col_rows = col_results.into_iter().next().unwrap_or_default();
        let mut columns = Vec::new();
        for col_row in &col_rows {
            let name = get_str(col_row, "COLUMN_NAME");
            let col_type = get_str(col_row, "COLUMN_TYPE");
            let nullable_str = get_str(col_row, "IS_NULLABLE");
            let default = get_opt_str(col_row, "COLUMN_DEFAULT");
            let comment = get_opt_str(col_row, "COLUMN_COMMENT");
            let is_primary: i32 = col_row
                .try_get("IS_PRIMARY")
                .ok()
                .flatten()
                .unwrap_or(0);
            let is_foreign: i32 = col_row
                .try_get("IS_FOREIGN")
                .ok()
                .flatten()
                .unwrap_or(0);

            columns.push(Column {
                name,
                col_type: col_type.to_uppercase(),
                nullable: nullable_str == "YES",
                is_primary: is_primary == 1,
                is_foreign: is_foreign == 1,
                comment,
                default,
            });
        }

        // Get indexes
        let idx_results = client
            .query(
                "SELECT i.name AS INDEX_NAME, \
                        i.is_unique AS IS_UNIQUE, \
                        COL_NAME(ic.object_id, ic.column_id) AS COLUMN_NAME \
                 FROM sys.indexes i \
                 JOIN sys.index_columns ic \
                   ON i.object_id = ic.object_id AND i.index_id = ic.index_id \
                 WHERE i.object_id = OBJECT_ID(@P1) \
                   AND i.is_primary_key = 0 \
                   AND i.type > 0 \
                 ORDER BY i.name, ic.key_ordinal",
                &[&table_name],
            )
            .await
            .map_err(|e| format!("Failed to query indexes for {table_name}: {e}"))?
            .into_results()
            .await
            .map_err(|e| format!("Failed to fetch index results for {table_name}: {e}"))?;

        let idx_rows = idx_results.into_iter().next().unwrap_or_default();
        let mut indexes: Vec<IndexInfo> = Vec::new();
        for idx_row in &idx_rows {
            let index_name = get_str(idx_row, "INDEX_NAME");
            let column_name = get_str(idx_row, "COLUMN_NAME");
            let is_unique: bool = idx_row
                .try_get("IS_UNIQUE")
                .ok()
                .flatten()
                .unwrap_or(false);

            if let Some(existing) = indexes.iter_mut().find(|i| i.name == index_name) {
                existing.columns.push(column_name);
            } else {
                indexes.push(IndexInfo {
                    name: index_name,
                    columns: vec![column_name],
                    unique: is_unique,
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

    Ok(ParsedSchema {
        database: config.database.clone(),
        tables,
    })
}

fn get_str(row: &Row, col: &str) -> String {
    row.try_get::<&str, _>(col)
        .ok()
        .flatten()
        .unwrap_or("")
        .to_string()
}

fn get_opt_str(row: &Row, col: &str) -> Option<String> {
    row.try_get::<&str, _>(col)
        .ok()
        .flatten()
        .map(|s| s.to_string())
        .filter(|s| !s.is_empty())
}
