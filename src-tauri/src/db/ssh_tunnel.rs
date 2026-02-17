use crate::db::types::SshConfig;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

pub struct SshTunnel {
    pub local_host: String,
    pub local_port: u16,
    shutdown: Arc<AtomicBool>,
    _handle: Option<std::thread::JoinHandle<()>>,
}

impl SshTunnel {
    /// Establish an SSH tunnel that forwards local_port -> remote_host:remote_port
    /// through the SSH server specified in `ssh_config`.
    pub async fn establish(
        ssh_config: &SshConfig,
        remote_host: &str,
        remote_port: u16,
    ) -> Result<Self, String> {
        let ssh_host = ssh_config.host.clone();
        let ssh_port: u16 = ssh_config.port.parse().unwrap_or(22);
        let ssh_username = ssh_config.username.clone();
        let auth_type = ssh_config.auth_type.clone();
        let ssh_password = ssh_config.password.clone();
        let private_key_path = ssh_config.private_key.clone();
        let remote_host = remote_host.to_string();

        // Bind a local listener on a random port
        let listener = TcpListener::bind("127.0.0.1:0")
            .map_err(|e| format!("Failed to bind local port: {e}"))?;
        let local_addr = listener
            .local_addr()
            .map_err(|e| format!("Failed to get local address: {e}"))?;
        let local_port = local_addr.port();

        // Test SSH connectivity first (in a blocking thread)
        let test_ssh_host = ssh_host.clone();
        let test_ssh_port = ssh_port;
        let test_ssh_username = ssh_username.clone();
        let test_auth_type = auth_type.clone();
        let test_ssh_password = ssh_password.clone();
        let test_private_key_path = private_key_path.clone();

        tokio::task::spawn_blocking(move || {
            let addr: std::net::SocketAddr = format!("{test_ssh_host}:{test_ssh_port}")
                .parse()
                .map_err(|_| format!("Invalid SSH address: {test_ssh_host}:{test_ssh_port}"))?;
            let tcp = TcpStream::connect_timeout(&addr, std::time::Duration::from_secs(10))
                .map_err(|e| format!("SSH connection failed: {e}"))?;

            let mut sess =
                ssh2::Session::new().map_err(|e| format!("SSH session creation failed: {e}"))?;
            sess.set_tcp_stream(tcp);
            sess.handshake()
                .map_err(|e| format!("SSH handshake failed: {e}"))?;

            if test_auth_type == "privateKey" && !test_private_key_path.is_empty() {
                sess.userauth_pubkey_file(
                    &test_ssh_username,
                    None,
                    std::path::Path::new(&test_private_key_path),
                    None,
                )
                .map_err(|e| format!("SSH key authentication failed: {e}"))?;
            } else {
                sess.userauth_password(&test_ssh_username, &test_ssh_password)
                    .map_err(|e| format!("SSH password authentication failed: {e}"))?;
            }

            Ok::<_, String>(())
        })
        .await
        .map_err(|e| format!("SSH test thread failed: {e}"))??;

        let shutdown = Arc::new(AtomicBool::new(false));
        let shutdown_clone = shutdown.clone();

        // Spawn a background OS thread for the tunnel (runs indefinitely until shutdown)
        let handle = std::thread::spawn(move || {
            // Connect to SSH server
            let addr: std::net::SocketAddr =
                match format!("{ssh_host}:{ssh_port}").parse() {
                    Ok(a) => a,
                    Err(_) => return,
                };
            let tcp = match TcpStream::connect_timeout(&addr, std::time::Duration::from_secs(10)) {
                Ok(tcp) => tcp,
                Err(e) => {
                    eprintln!("SSH tunnel connection failed: {e}");
                    return;
                }
            };

            let mut sess = match ssh2::Session::new() {
                Ok(s) => s,
                Err(e) => {
                    eprintln!("SSH session creation failed: {e}");
                    return;
                }
            };

            sess.set_tcp_stream(tcp);
            if let Err(e) = sess.handshake() {
                eprintln!("SSH handshake failed: {e}");
                return;
            }

            // Authenticate
            let auth_result = if auth_type == "privateKey" && !private_key_path.is_empty() {
                sess.userauth_pubkey_file(
                    &ssh_username,
                    None,
                    std::path::Path::new(&private_key_path),
                    None,
                )
            } else {
                sess.userauth_password(&ssh_username, &ssh_password)
            };

            if let Err(e) = auth_result {
                eprintln!("SSH authentication failed: {e}");
                return;
            }

            // Accept local connections and forward them
            listener.set_nonblocking(true).ok();

            while !shutdown_clone.load(Ordering::Relaxed) {
                match listener.accept() {
                    Ok((mut local_stream, _)) => {
                        // Open a direct-tcpip channel to the remote database
                        sess.set_blocking(true);
                        match sess.channel_direct_tcpip(&remote_host, remote_port, None) {
                            Ok(mut channel) => {
                                local_stream
                                    .set_read_timeout(Some(std::time::Duration::from_millis(100)))
                                    .ok();
                                sess.set_blocking(false);

                                let mut local_buf = [0u8; 8192];
                                let mut remote_buf = [0u8; 8192];

                                loop {
                                    if shutdown_clone.load(Ordering::Relaxed) {
                                        break;
                                    }

                                    // Local -> Remote
                                    match local_stream.read(&mut local_buf) {
                                        Ok(0) => break,
                                        Ok(n) => {
                                            if channel.write_all(&local_buf[..n]).is_err() {
                                                break;
                                            }
                                            channel.flush().ok();
                                        }
                                        Err(ref e)
                                            if e.kind() == std::io::ErrorKind::WouldBlock
                                                || e.kind() == std::io::ErrorKind::TimedOut =>
                                        {
                                            // No data, continue
                                        }
                                        Err(_) => break,
                                    }

                                    // Remote -> Local
                                    match channel.read(&mut remote_buf) {
                                        Ok(0) => break,
                                        Ok(n) => {
                                            if local_stream.write_all(&remote_buf[..n]).is_err() {
                                                break;
                                            }
                                            local_stream.flush().ok();
                                        }
                                        Err(ref e)
                                            if e.kind() == std::io::ErrorKind::WouldBlock =>
                                        {
                                            // No data, continue
                                        }
                                        Err(_) => break,
                                    }
                                }

                                channel.close().ok();
                                channel.wait_close().ok();
                            }
                            Err(e) => {
                                eprintln!("SSH channel failed: {e}");
                            }
                        }
                    }
                    Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                        std::thread::sleep(std::time::Duration::from_millis(50));
                    }
                    Err(_) => break,
                }
            }
        });

        // Give the tunnel thread a moment to start
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;

        Ok(SshTunnel {
            local_host: "127.0.0.1".to_string(),
            local_port,
            shutdown,
            _handle: Some(handle),
        })
    }
}

impl Drop for SshTunnel {
    fn drop(&mut self) {
        self.shutdown.store(true, Ordering::Relaxed);
        // Connect to the listener to unblock accept() so the thread can exit
        let _ = TcpStream::connect(format!("127.0.0.1:{}", self.local_port));
    }
}
