'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const config = require('config');
const _ = require('lodash');

const schema = module.exports = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  type: {type: String, enum: ['register', 'login', 'updateInfo', 'updatePass'], required: true},
  ip: String,
  data: {},
  createdTime: {type: Date, default: Date.now }
});

const types = {
  register: 'register',
  login: 'login',
  updateInfo: 'updateInfo',
  updatePass: 'updatePass'
}
schema.static('types', function (type) {
  return types[type];
});


/**
 * 索引设置
 */
schema.index({
  user: 1,
  createdTime: -1
}, {name: 'logIndex', background: true});

/* istanbul ignore else */
if (!schema.options.toJSON) {
  schema.options.toJSON = {};
}

schema.options.toJSON.transform = function (doc, ret) {
  delete ret.__v;
  delete ret._id;
  ret.createdTime = ret.createdTime && ret.createdTime.valueOf();
};