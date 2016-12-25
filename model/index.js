const models = require('require-directory')(module);
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const config = require('config');
const lingo = require('lingo');


var mongodbConnString = 'mongodb://' + config.mongodb.host + '/' + config.mongodb.database;

const mongodbUser = config.mongodb.username;
const mongodbPass = config.mongodb.password;
/* istanbul ignore if */
if (config.mongodb.replsets && config.mongodb.replsets.length) {
  mongodbConnString = 'mongodb://' + config.mongodb.host;
  config.mongodb.replsets.forEach(function(replset) {
    mongodbConnString += (',' + 'mongodb://' + replset.host);
  });

  mongodbConnString += '/' + config.mongodb.database;
}

/* istanbul ignore if */
if (mongodbUser && mongodbPass) {
  mongoose.connect(mongodbConnString, {
    user: mongodbUser,
    pass: mongodbPass
  });
} else {
  mongoose.connect(mongodbConnString);
}

var self = module.exports = {};

Object.keys(models).forEach(function(key) {
  /* istanbul ignore else */
  if (key !== 'index') {
    var modelName = lingo.capitalize(key);
    self[modelName] = mongoose.model(modelName, models[key]);
  }
});