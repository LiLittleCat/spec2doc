use crate::db::connection;
use crate::db::types::{ConnectionConfig, ParsedSchema, SshConfig};

#[tauri::command]
pub async fn test_db_connection(
    config: ConnectionConfig,
    ssh_config: Option<SshConfig>,
    ssh_enabled: bool,
) -> Result<String, String> {
    connection::test_connection(&config, ssh_config.as_ref(), ssh_enabled).await
}

#[tauri::command]
pub async fn fetch_db_schema(
    config: ConnectionConfig,
    ssh_config: Option<SshConfig>,
    ssh_enabled: bool,
) -> Result<ParsedSchema, String> {
    connection::fetch_schema(&config, ssh_config.as_ref(), ssh_enabled).await
}
