module.exports = {
  apps: [{
    name: 'werewolf-game',
    script: 'src/server/index.ts',
    interpreter: 'npx',
    interpreter_args: 'tsx',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 5200
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5200,
      FRONTEND_ORIGIN: 'https://traeapp-7gn2vl8qe60xp2ip-2jligvwuq-liiziyes-projects.vercel.app'
    }
  }]
};
