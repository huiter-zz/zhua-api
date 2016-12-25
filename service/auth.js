const User = require('../model').User;

const loadUserFromBasicAuth = function *(headers) {
  let parseBasicAuth = function(authorization) {
    if (!authorization) {
      return;
    }
    let parts = authorization.split(' ');
    /* istanbul ignore if */
    if (parts.length !== 2) {
      return;
    }
    let _credentials = new Buffer(parts[1], 'base64').toString().split(':');
    let email = (_credentials[0] || '').toLowerCase();
    _credentials.splice(0, 1);
    return {
      email: email,
      password: _credentials.length > 1 ? _credentials.join(':') : _credentials[0]
    };
  };
  let auth = parseBasicAuth(headers.authorization);
  if (auth) {
      let user = yield User.findOne({ email: auth.email });
      if (!user) {
        return Promise.resolve();
      }
      let isMatch = yield user.comparePassword(auth.password);

      if (!isMatch) {
        return Promise.resolve();
      }

      return Promise.resolve(user);
  } else {
    return Promise.resolve();
  }
};

module.exports = function *(next) {
    let user = yield loadUserFromBasicAuth(this.headers);
    if (user) {
        this.user = user;
        return yield next;
    } else {
        let session = yield this.session;
        if (!session || !session.uid) {
            this.status = 400;
            this.body = {
                errcode: -2,
                errmsg: '您没有权限执行此操作，请先登录'
            };
            return;
        } else {
            user = yield User.findById(session.uid);
            /* istanbul ignore if */
            if (!user) {
                this.status = 400;
                this.body = {
                    errcode: -2,
                    errmsg: '您没有权限执行此操作，请先登录'
                };
                return;
            } else {
                this.user = user;
                yield next;
            }
        }
    }
};
