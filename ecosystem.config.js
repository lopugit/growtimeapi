module.exports = {
  apps : [
		{
			name: 'dev-growtimeapi',
			script: 'node/index.js',
			args: '--level dev',
			instances: 1,
			autorestart: true,
			watch: true,
			max_memory_restart: '600M',
		},
		{
			name: 'growtimeapi',
			script: 'node/index.js',
			args: '--level prod',
			instances: 2,
			autorestart: true,
			watch: false,
			max_memory_restart: '600M',
		}
	]
};
