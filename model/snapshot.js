/**
 * 页面快照连接
 */
'use strict';

var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var config = require('config');

var schema = module.exports = new mongoose.Schema({
	pid: { type: mongoose.Schema.Types.ObjectId, ref: 'Page', required: true},
	url: { type: String, required: true },
	createdTime: {type: Date, default: Date.now }
});

/* istanbul ignore else */
if (!schema.options.toJSON) {
  schema.options.toJSON = {};
}

schema.options.toJSON.transform = function (doc, ret) {
  delete ret.__v;
  delete ret._id;
  ret.createdTime = ret.createdTime && ret.createdTime.valueOf();
};