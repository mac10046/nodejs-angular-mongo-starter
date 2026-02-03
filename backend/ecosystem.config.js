/**
 * PM2 Ecosystem Configuration
 *
 * Usage:
 * - Start: pm2 start ecosystem.config.js
 * - Start production: pm2 start ecosystem.config.js --env production
 * - Restart: pm2 restart project-api
 * - Stop: pm2 stop project-api
 * - Delete: pm2 delete project-api
 * - View logs: pm2 logs project-api
 * - Monitor: pm2 monit
 * - Dashboard: pm2 plus (requires PM2 Plus account)
 *
 * Log Management:
 * - View all logs: pm2 logs
 * - Flush all logs: pm2 flush
 * - View log files: ls ~/.pm2/logs/
 */

module.exports = {
  apps: [
    {
      // Application name
      name: 'project-api',

      // Entry script
      script: './server.js',

      // Working directory
      cwd: './',

      // Instances (0 = max CPU cores, use 'max' for cluster mode)
      instances: process.env.NODE_ENV === 'production' ? 'max' : 1,

      // Execution mode (cluster or fork)
      exec_mode: process.env.NODE_ENV === 'production' ? 'cluster' : 'fork',

      // Auto restart on crash
      autorestart: true,

      // Watch for file changes (disable in production)
      watch: process.env.NODE_ENV !== 'production',
      ignore_watch: ['node_modules', 'logs', '.git'],

      // Max memory restart threshold
      max_memory_restart: '500M',

      // Restart delay
      restart_delay: 4000,

      // Kill timeout
      kill_timeout: 5000,

      // Max restarts before stopping
      max_restarts: 10,

      // Minimum uptime before considered stable
      min_uptime: '10s',

      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
        LOG_LEVEL: 'debug',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        LOG_LEVEL: 'info',
        ENABLE_FILE_LOGS: 'true',
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5000,
        LOG_LEVEL: 'debug',
      },

      // Log configuration
      log_type: 'json',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Output log file
      output: './logs/pm2-out.log',

      // Error log file
      error: './logs/pm2-error.log',

      // Combine stdout and stderr
      combine_logs: false,

      // Merge logs from all instances (cluster mode)
      merge_logs: true,

      // Time between each restart when in unstable state
      exp_backoff_restart_delay: 100,

      // Source map support
      source_map_support: true,

      // Node.js arguments
      node_args: ['--max-old-space-size=512'],

      // Listen timeout for shutdown
      listen_timeout: 8000,

      // Graceful shutdown
      shutdown_with_message: true,
      wait_ready: true,
    },
  ],

  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/project-name.git',
      path: '/var/www/project-name',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};
