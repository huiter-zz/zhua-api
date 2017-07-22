const config = require('config');
const MongoStore = require('koa-generic-session-mongo');


module.exports = new MongoStore({
  	db: config.mongodb.database,
  	collection: 'sessions',
  	host: config.mongodb.host,
  	port: config.mongodb.port || 27017,
  	user: config.mongodb.user,
  	password: config.mongodb.password,
});