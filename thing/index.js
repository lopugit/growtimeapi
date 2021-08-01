
let cwd = __dirname
let log = console.log
let smarts = require('smarts')()
let shell = require('shelljs')
let exporter = (args={})=>{
	let hosts = [
		'192.168.0.70 backup'
	]
	let thing = {}
	smarts.setsmart(thing, 'nginx.settings',
		[
			{
				server_name: 'beta.api.growtime.com',
				certbot: true,
				protocol: 'http://',
				ips: [
					`${args.host || 'growtime' || 'host.docker.internal'}:9998`,
					...hosts
				]
			},
			{
				server_name: 'growtime.com',
				certbot: true,
				dir: '/things/statics/growtime.com/dist/pwa/',
				rewrite: 'rewrite ^.*$ /;'
			},
			{
				server_name: 'api.growtime.com',
				certbot: true,
				protocol: 'http://',
				ips: [
					`${args.host || 'growtime' || 'host.docker.internal'}:9998`,
					...hosts
				]
			},
			{
				server_name: 'api.growtime.src',
				self_signed: true,
				protocol: 'http://',
				ips: [
					`${args.host || 'growtime' || 'host.docker.internal'}:9998`,
					...hosts
				]
			},
			{
				server_name: 'auth.growtime.src',
				self_signed: true,
				protocol: 'http://',
				ips: [
					`${args.host || 'growtime' || 'host.docker.internal'}:9998`,
					...hosts
				]
			},
		]
	)

	smarts.setsmart(thing, 'ai', (args)=>{
		ostype = shell.exec(`echo $OSTYPE`)
		if(ostype.indexOf("darwin") >= 0){

			// manage growtimeapi program
			let status,
					match = `online`

			let reg = new RegExp(match, 'g')

			// check if running
			status = shell.exec(`pm2 show growtimeapi | grep status`).stdout

			if(status.match(reg) != null){
				log('GrowTimeapi is running')
			} else {
				log('Starting GrowTimeapi')
				log(
					shell.exec(`
						cd ${cwd}/../ ;
						npm run dev ;
					`)
				)
			}
		} else if (ostype.indexOf("linux") >= 0 && shell.exec('which docker').stdout.length > 0) {
			let status,
					match = `Up`

			let reg = new RegExp(match, 'g')

			// check if running
			status = shell.exec(`docker ps -l | grep growtimeapi`).stdout

			if(status.match(reg) != null){
				let time = Date.now()
				log(time)
				log('GrowTimeapi is running')
				log(time)
			} else {
				let time = Date.now()
				log(time)
				log('Starting GrowTimeapi')
				log(time)
				// log(shell.exec(`
				// 	cd ${cwd} ;
				// 	npm run dev ;
				// `))
			}
		}
	})
	return thing
}
module.exports = (args={})=>{
	return exporter(args)
}

exporter()