/**
 * 页面信息
 */
'use strict';

var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var config = require('config');

var schema = module.exports = new mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
	page: { type: String, required: true },
	tags: [String],
	del: {type: Boolean, default: false},
	createdTime: {type: Date, default: Date.now }
});

/* istanbul ignore else */
if (!schema.options.toJSON) {
  schema.options.toJSON = {};
}

schema.options.toJSON.transform = function (doc, ret) {
  ret.id = ret._id;
  delete ret.__v;
  delete ret._id;
  delete ret.del;
  ret.createdTime = ret.createdTime && ret.createdTime.valueOf();
};