use crate::db::schema;
use crate::db::ssh_tunnel::SshTunnel;
use crate::db::types::{ConnectionConfig, ParsedSchema, SshConfig};

/// Resolved endpoint after optional SSH tunneling.
struct Endpoint {
    host: String,
    port: u16,
    _tunnel: Option<SshTunnel>,
}

/// Resolve the connection endpoint. If SSH is enabled, establish a tunnel
/// and return the local forwarded address; otherwise use the config directly.
async fn resolve_endpoint(
    config: &ConnectionConfig,
    ssh_config: Option<&SshConfig>,
    ssh_enabled: bool,
) -> Result<Endpoint, String> {
    if ssh_enabled {
        let ssh = ssh_config.ok_or("SSH is enabled but no SSH configuration provided")?;
        let remote_host = if config.host.is_empty() {
            "127.0.0.1"
        } else {
            &config.host
        };
        let remote_port = config.effective_port();

        let tunnel = SshTunnel::establish(ssh, remote_host, remote_port).await?;
        Ok(Endpoint {
            host: tunnel.local_host.clone(),
            port: tunnel.local_port,
            _tunnel: Some(tunnel),
        })
    } else {
        Ok(Endpoint {
            host: if config.host.is_empty() {
                "127.0.0.1".to_string()
            } else {
                config.host.clone()
            },
            port: config.effective_port(),
            _tunnel: None,
        })
    }
}

/// Test a database connection by running `SELECT 1`.
pub async fn test_connection(
    config: &ConnectionConfig,
    ssh_config: Option<&SshConfig>,
    ssh_enabled: bool,
) -> Result<String, String> {
    let endpoint = resolve_endpoint(config, ssh_config, ssh_enabled).await?;

    match config.db_type.as_str() {
        "mysql" => test_mysql(config, &endpoint.host, endpoint.port).await,
        "postgresql" => test_postgres(config, &endpoint.host, endpoint.port).await,
        "sqlserver" => test_sqlserver(config, &endpoint.host, endpoint.port).await,
        "sqlite" => test_sqlite(config).await,
        other => Err(format!("Unsupported database type: {other}")),
    }
}

/// Fetch the full schema from a database.
pub async fn fetch_schema(
    config: &ConnectionConfig,
    ssh_config: Option<&SshConfig>,
    ssh_enabled: bool,
) -> Result<ParsedSchema, String> {
    let endpoint = resolve_endpoint(config, ssh_config, ssh_enabled).await?;

    match config.db_type.as_str() {
        "mysql" => schema::mysql::extract(config, &endpoint.host, endpoint.port).await,
        "postgresql" => schema::postgres::extract(config, &endpoint.host, endpoint.port).await,
        "sqlserver" => schema::sqlserver::extract(config, &endpoint.host, endpoint.port).await,
        "sqlite" => schema::sqlite::extract(config).await,
        other => Err(format!("Unsupported database type: {other}")),
    }
}

// ── MySQL test ──────────────────────────────────────────────────────

async fn test_mysql(
    config: &ConnectionConfig,
    host: &str,
    port: u16,
) -> Result<String, String> {
    let url = build_mysql_url(config, host, port);
    let pool = sqlx::mysql::MySqlPoolOptions::new()
        .max_connections(1)
        .acquire_timeout(std::time::Duration::from_secs(10))
        .connect(&url)
        .await
        .map_err(|e| format!("MySQL connection failed: {e}"))?;

    sqlx::query("SELECT 1")
        .execute(&pool)
        .await
        .map_err(|e| format!("MySQL query failed: {e}"))?;

    pool.close().await;
    Ok("MySQL connection successful".to_string())
}

// ── PostgreSQL test ─────────────────────────────────────────────────

async fn test_postgres(
    config: &ConnectionConfig,
    host: &str,
    port: u16,
) -> Result<String, String> {
    let url = build_postgres_url(config, host, port);
    let pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(1)
        .acquire_timeout(std::time::Duration::from_secs(10))
        .connect(&url)
        .await
        .map_err(|e| format!("PostgreSQL connection failed: {e}"))?;

    sqlx::query("SELECT 1")
        .execute(&pool)
        .await
        .map_err(|e| format!("PostgreSQL query failed: {e}"))?;

    pool.close().await;
    Ok("PostgreSQL connection successful".to_string())
}

// ── SQL Server test ─────────────────────────────────────────────────

async fn test_sqlserver(
    config: &ConnectionConfig,
    host: &str,
    port: u16,
) -> Result<String, String> {
    let mut client = connect_sqlserver(config, host, port).await?;

    tiberius::Query::new("SELECT 1")
        .execute(&mut client)
        .await
        .map_err(|e| format!("SQL Server query failed: {e}"))?;

    Ok("SQL Server connection successful".to_string())
}

// ── SQLite test ─────────────────────────────────────────────────────

async fn test_sqlite(config: &ConnectionConfig) -> Result<String, String> {
    let db_path = &config.database;
    if db_path.is_empty() {
        return Err("SQLite database file path is required".to_string());
    }

    let url = format!("sqlite:{}", db_path);
    let pool = sqlx::sqlite::SqlitePoolOptions::new()
        .max_connections(1)
        .acquire_timeout(std::time::Duration::from_secs(10))
        .connect(&url)
        .await
        .map_err(|e| format!("SQLite connection failed: {e}"))?;

    sqlx::query("SELECT 1")
        .execute(&pool)
        .await
        .map_err(|e| format!("SQLite query failed: {e}"))?;

    pool.close().await;
    Ok("SQLite connection successful".to_string())
}

// ── URL builders ────────────────────────────────────────────────────

pub fn build_mysql_url(config: &ConnectionConfig, host: &str, port: u16) -> String {
    let user = urlencoding::encode(&config.username);
    let pass = urlencoding::encode(&config.password);
    let db = urlencoding::encode(&config.database);
    format!("mysql://{user}:{pass}@{host}:{port}/{db}")
}

pub fn build_postgres_url(config: &ConnectionConfig, host: &str, port: u16) -> String {
    let user = urlencoding::encode(&config.username);
    let pass = urlencoding::encode(&config.password);
    let db = urlencoding::encode(&config.database);
    format!("postgres://{user}:{pass}@{host}:{port}/{db}")
}

pub async fn connect_sqlserver(
    config: &ConnectionConfig,
    host: &str,
    port: u16,
) -> Result<tiberius::Client<tokio_util::compat::Compat<tokio::net::TcpStream>>, String> {
    use tiberius::{AuthMethod, Client, Config};
    use tokio::net::TcpStream;
    use tokio_util::compat::TokioAsyncWriteCompatExt;

    let mut tib_config = Config::new();
    tib_config.host(host);
    tib_config.port(port);
    tib_config.database(&config.database);
    tib_config.authentication(AuthMethod::sql_server(&config.username, &config.password));
    tib_config.trust_cert();

    let tcp = TcpStream::connect(tib_config.get_addr())
        .await
        .map_err(|e| format!("SQL Server TCP connection failed: {e}"))?;
    tcp.set_nodelay(true)
        .map_err(|e| format!("Failed to set TCP_NODELAY: {e}"))?;

    let client = Client::connect(tib_config, tcp.compat_write())
        .await
        .map_err(|e| format!("SQL Server connection failed: {e}"))?;

    Ok(client)
}
