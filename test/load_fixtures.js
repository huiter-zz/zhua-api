const async = require('async');
const path = require('path');
const lingo = require('lingo');
const DB = require('../model');


var fixtures = module.exports = require('require-directory')(module, path.join(__dirname, 'fixtures'));

var load = function(done) {
  async.each(Object.keys(fixtures), function(key, callback) {
    var modelName = lingo.capitalize(key);
    if(!DB[modelName]) return callback();
    DB[modelName].create(fixtures[key], function(err, ret){
      if(err){
        console.log('load',err);
      }
      callback(err, ret);
    });
  }, done);
};

var clear = function(deepClean, done) {
  if (typeof deepClean === 'function') {
    done = deepClean;
    deepClean = null;
  }
  if (deepClean === true) {
    return DB.connection.db.dropDatabase(function(err){
      if(err){
        console.log('clear', err);
      }
      done(arguments);
    });
  }

  async.each(Object.keys(fixtures), function(key, callback) {
    var modelName = lingo.capitalize(key);
    if(!DB[modelName]) return callback();
    DB[modelName].remove(function(err, ret){
      if(err){
        console.log('clear', err);
      }
      callback(err, ret);
    });
  }, done);
};

if (require.main === module) {
  if (process.env.NODE_ENV === 'production') {
    console.warn('Cannot load test data in the production env.');
    process.exit(1);
  }
  setTimeout(function() {
    console.log('Clearing database...');
    clear(false, function() {
      console.log('Loading database...');
      load(function() {
        console.log('Done!');
        process.exit(0);
      });
    });
  }, 500);
} else {
  clear();
  beforeEach(load);
  afterEach(clear);
}
