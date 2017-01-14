/**
 * 用户信息
 */
'use strict';

var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var config = require('config');

var schema = module.exports = new mongoose.Schema({
  email: { type: String, unique: true, required: true},
  emailLower: {type: String, unique: true},
  password: {type: String, required: true},
  nickname: {type: String, required: true},
  avatar: {type: String},
  phone: {type: Number},
  invitationCode: {type: String, unique: true, required: true}, // 自己的邀请码
  referrals: {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User'}, // 引码对应的用户 ID
    code: String, // 注册时填写的邀请码
    isPay: {type: Boolean},
    amount: {type: Number} // 被邀请用户充值金额
  },
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
