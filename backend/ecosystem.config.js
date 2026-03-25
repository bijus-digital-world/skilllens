module.exports = {
  apps: [
    {
      name: 'skilllens-api',
      script: 'dist/index.js',
      instances: 'max',       // Use all available CPU cores
      exec_mode: 'cluster',   // Cluster mode for load balancing
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      // Graceful shutdown
      kill_timeout: 10000,
      listen_timeout: 8000,
      shutdown_with_message: true,
      // Logging
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      // Auto-restart on crashes
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 1000,
    },
  ],
}
