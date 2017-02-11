/**
 * 定时任务进程管理
 */

'use strict';

var mongoose = require('mongoose');

var schema = module.exports = new mongoose.Schema({
	IPv4: { type: String },
	hostName: { type: String },
	status: {type: String, enum: ['free', 'busy'], default: 'free'}
});


schema.index({
  IPv4: 1,
  hostName: 1
}, {name: 'index', background: true, unique: true});


/* istanbul ignore else */
if (!schema.options.toJSON) {
  schema.options.toJSON = {};
}

schema.options.toJSON.transform = function (doc, ret) {
  delete ret.__v;
  delete ret._id;
};