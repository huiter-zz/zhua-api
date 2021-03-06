const _ = require('lodash');
const User = require('../model').User;
const Log = require('../model').Log;
const Property = require('../model').Property;
const utils = require('../utils');
const logger = utils.getLogger('admin');

exports.getUserList = function *() {
    let query = this.request.query || {};
    let page = +query.page || 1;
    let count = +query.count || 30;

    let condition = {
        isAdmin: false
    };
    if (_.isString(query.uid)) {
        query.uid = query.uid.split(',');
    }
    if (query.uid) {
       condition._id = {
            $in: query.uid
       }
    }
    if (query.email) {
        condition.emailLower = query.email.toLowerCase();
    }
    if (query.nickname) {
        condition.nickname = query.nickname;
    }
    if (query.phone) {
        condition.phone = query.phone;
    }
    if (query.keyword) {
        var _reg;
        try {
          _reg = new RegExp(query.keyword, 'i');
        }catch(e){ logger.warn('keyword %s invalid'); }
        condition['$or'] = [
            {email: _reg},
            {nickname: _reg}
        ];
    }

    let list = yield User.find(condition).skip((page - 1) * count).limit(count).sort({createdTime: -1});
    let total = yield User.count(condition);
    let uids = _.map(list, '_id');
    let property = yield Property.find({user: {$in: uids}});
    let propertyObj = {}
    _.each(property, function(item) {
        item = item.toJSON();
        propertyObj[item.user] = {
            cash: item.cash,
            gift: item.gift
        }
    });
    list = _.map(list, function(item) {
        item = item.toJSON();
        if (propertyObj[item.uid]) {
            item.property = propertyObj[item.uid];
        } else {
            propertyObj[item.uid] = {cash: 0, gift: 0};
        }
        return item;
    });
    this.status = 200;
    this.body = {data: list, total: total};
    return;
};

exports.adjustment = function *(next) {
    let uid = this.request.body.uid;
    let type = this.request.body.type; // cash gift
    let amount = +this.request.body.amount;

    if (!uid || uid.length !== 24) {
        this.status = 400;
        this.body = {
            errcode: 40008,
            errmsg: '用户不存在'
        };
        return;
    }

    if (type !== 'cash' && type !== 'gift') {
        this.status = 400;
        this.body = {
            errcode: 40031,
            errmsg: '调账类型不合法'
        };
        return;        
    }

    if (!amount || amount < 0) {
        this.status = 400;
        this.body = {
            errcode: 40032,
            errmsg: '调账金额必须大于 0'
        };
        return;
    }

    let customer = yield User.findById(uid);

    if (!customer) {
        this.status = 400;
        this.body = {
            errcode: 40008,
            errmsg: '用户不存在'
        };
        return;
    }
    let inviteUid = customer.referrals && customer.referrals.user;
    let isPay = customer.referrals && customer.referrals.isPay;

    let user = this.user;
    let updateDoc = {'$inc': {}};
    updateDoc['$inc'][type] = amount;
    let ret;
    try {
        ret = yield Property.findOneAndUpdate({
            user: customer._id
        }, updateDoc);
    } catch(e) {
        logger.error('user %s adjust customer %s type %s amount %s 调账失败 %s', user.email, customer.email, type, amount ,e.message);
    }

    if (!ret) {
        this.status = 400;
        this.body = {
            errcode: 40033,
            errmsg: '调账失败'
        };
        return;
    }

    if (type === 'cash' && inviteUid && !isPay) {
        logger.info('邀请用户 %s 赠送金额 %s', inviteUid, amount);
        try {
            yield User.findOneAndUpdate({
                _id: customer._id
            }, {
                $set: {
                    'referrals.isPay': true,
                    'referrals.amount': amount
                }
            });
            yield Property.findOneAndUpdate({
                user: inviteUid
            }, {
                $inc: {
                    gift: amount
                }
            });
            yield Log.create({
                user: inviteUid,
                type: Log.types('gift'),
                ip: this.cleanIP,
                data: {
                    by: 'invitation',
                    uid: customer._id.toString(),
                    type: type,
                    amount: amount
                }
            });
        } catch(e) {
            logger.error('邀请用户 %s 赠送失败', inviteUid, e.message);
        }
    }

    logger.info('user %s adjust customer %s type %s amount %s', user.email, customer.email, type, amount);
    // admin 写日志
    Log.create({
        user: user._id,
        type: Log.types('adjust'),
        ip: this.cleanIP,
        data: {
            uid: uid,
            type: type,
            amount: amount
        }
    });

    // 被调账用户写日志
    Log.create({
        user: customer._id,
        type: Log.types(type),
        ip: this.cleanIP,
        data: {
            by: 'adjustment',
            uid: user._id.toString(),
            type: type,
            amount: amount
        }
    });
    this.status = 200;
    this.body = {result: 'success'};
    return;
};