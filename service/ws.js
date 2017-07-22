const config = require('config');
const co = require('co');
const url = require('url');
const WebSocket = require('ws');
const queryString = require('query-string');
const store = require('./session-store');
const _ = require('lodash');

const prefix = config.prefix || 'zhua:sess:';

let WS_SERVER = module.exports = {
	sessUidMap: {},
	clients: {},
	server: null,
	wss: null,
	verifyClient: function(info, cb) {
    	let params = url.parse(info.req.url);
	    let query = queryString.parse(params.query) || {};
	    let access_token = query.token;
	    if (!access_token) {
	    	return cb(false, 401, 'token is required');
	    } else {
	    	co(function *() {
	    		return yield store.get(prefix + access_token);
	    	}).then(function(session) {
	    		if (session && session.uid) {
	    			WS_SERVER.sessUidMap[info.req.url] = session.uid;
	    			return cb(true);
	    		} else {
	    			return cb(false, 401, 'access_token invalid');
	    		}
	    	}, function(err) {
	    		console.log(err);
	    		cb(false, 401, 'access_token invalid');
	    	})
	    }
	    
	},
	start: function(server) {
		this.server = server;
		let wss = this.wss = new WebSocket.Server({ server, verifyClient: this.verifyClient });
		let that = this;
		wss.on('connection', function connection(ws, req) {
			if (that.sessUidMap[req.url]) {
				ws.uid = that.sessUidMap[req.url];
				that.clients[ws.uid] = ws;
				delete that.sessUidMap[req.url];
				console.log('user %s connect ws', ws.uid);
				ws.on('error', function(err) {
					console.log('ws on error %s', err.message);
					that.sessUidMap[this.uid].close && that.sessUidMap[this.uid].close();
					delete that.clients[this.uid];
				})

				ws.on('close', function() {
					delete that.clients[this.uid];
					console.log('user %s disconnect ws', this.uid);
				});
			}
		});

	    wss.on('listening', function() {
	    	console.log('12312313');
	        console.log('wss server listen port %s', wss.options.port);
	    });

		wss.on('error', function(err) {
			console.log('wss got a error %s', err.message)
		})
	},
	send: function(uid, message) {
		if (!_.isString(message)) {
			message = JSON.stringify(message);
		}
		if (this.clients[uid]) {
			console.log('ws send message %s to uid %s', message, uid);
			try {
				this.clients[uid].send(message);
			} catch(e) {
				this.clients[uid].close && this.clients[uid].close();
				delete this.clients[uid];
			}
		}
	}
}