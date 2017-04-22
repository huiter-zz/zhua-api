'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const config = require('config');
const _ = require('lodash');

const types = {
  register: 'register', // 注册
  login: 'login', // 登录
  updateInfo: 'updateInfo', // 修改新用户信息
  updatePass: 'updatePass', // 修改密码
  addPage: 'addPage', // 添加新页面
  updatePage: 'updatePage', // 修改页面信息
  delPage: 'delPage', // 删除页面
  uploadFile: 'uploadFile', // 上传文件
  cash: 'cash', // 现金充值
  gift: 'gift', // 赠送充值
  adjust: 'adjust', // 调账，admin 角色用户拥有此日志记录
  consume: 'consume' // 消费
};

const typeArray = _.values(types);

const schema = module.exports = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  type: {type: String, enum: typeArray, required: true},
  ip: String,
  data: {},
  createdTime: {type: Date, default: Date.now }
});

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