'use strict';

var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var config = require('config');

var schema = module.exports = new mongoose.Schema({
  email: { type: String, unique: true, required: true},
  emailLower: {type: String, unique: true},
  password: {type: String, required: true},
  phone: {type: Number},
  name: {type: String},
  createdTime: {type: Date, default: Date.now }
});

schema.pre('save', function(next) {
  var self = this;
  if(this.isNew && !this.emailLower){
    this.emailLower = this.email.toLowerCase();
  }

  /* istanbul ignore if */
  if (!self.isModified('password')) {
    return next();
  }
  
  bcrypt.hash(self.password, config.bcrypt.rounds, function(err, hash) {
    /* istanbul ignore if */
    if (err) {
      return next(err);
    }
    self.password = hash;
    next();
  });
});

schema.methods.comparePassword = function(candidatePassword) {
  return new Promise(function(resolve, reject){
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
      /* istanbul ignore if */
      if (err) {
        reject(err);
      } else {
        resolve(isMatch);
      }
    });
  }.bind(this));
};

/* istanbul ignore else */
if (!schema.options.toJSON) {
  schema.options.toJSON = {};
}

schema.options.toJSON.transform = function (doc, ret) {
  ret.uid = ret._id;
  delete ret.password;
  delete ret.emailLower;
  delete ret.__v;
  delete ret._id;
  ret.createdTime = ret.createdTime && ret.createdTime.valueOf();
};
