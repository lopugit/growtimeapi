module.exports = {
  apps : [
		{
			name: 'dev-growtimeapi',
			script: 'node/index.js',
			args: '--level dev',
			autorestart: true,
			watch: ['node', "node/*/node_modules", "node/**/node_modules", "node/node_modules"],
			ignore_watch: []
		},
		{
			name: 'prod-growtimeapi',
			script: 'node/index.js',
			args: '--level prod',
			autorestart: true,
			watch: false,
			max_memory_restart: '600M',
		}
	]
};
