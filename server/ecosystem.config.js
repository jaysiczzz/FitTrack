module.exports = {
  apps: [
    {
      name: 'fittrack-api',
      script: './dist/app.js',
      instances: process.env.CLUSTER_INSTANCES || 'max',
      exec_mode: 'cluster',
      max_memory_restart: '800M',
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 10000,
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
