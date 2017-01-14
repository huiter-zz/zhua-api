/**
 * 用户财产余额信息
 */
'use strict';

var mongoose = require('mongoose');

var schema = module.exports = new mongoose.Schema({
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true},
  cash: {type: Number, default: 0}, // 剩余充值余额
  gift: {type: Number, default: 0} // 剩余赠送金额
});

/* istanbul ignore else */
if (!schema.options.toJSON) {
  schema.options.toJSON = {};
}

schema.options.toJSON.transform = function (doc, ret) {
  delete ret.__v;
  delete ret._id;
};
