var path = require('path');
var formidable = require('formidable');
var StringDecoder = require('string_decoder').StringDecoder;
var typeis = require('type-is');

formidable.IncomingForm.prototype.handlePart = function(part) {
  var self = this;

  if (part.filename === undefined) {
    var value = '' , decoder = new StringDecoder(this.encoding);

    part.on('data', function(buffer) {
      self._fieldsSize += buffer.length;
      if (self._fieldsSize > self.maxFieldsSize) {
        self._error(new Error('maxFieldsSize exceeded, received '+self._fieldsSize+' bytes of field data'));
        return;
      }
      value += decoder.write(buffer);
    });

    part.on('end', function() {
      self.emit('field', part.name, value);
    });
    return;
  }

  this._flushing++;

  var ext = path.extname(part.filename);
  var file = {
    name: part.filename,
    type: part.mime,
    hash: self.hash,
    ext  : ext,
    size : 0,
    binaryBuff: undefined
  };

  this.emit('fileBegin', part.name, file);

  var _buff = '';

  part.on('data', function(buffer) {
    if (buffer.length === 0) {
      return;
    }
    self.pause();
    file.size += buffer.length;
    _buff += buffer.toString('binary');
    self.resume();
  });

  part.on('end', function() {
    file.binaryBuff = _buff;
    self._flushing--;
    self.emit('file', part.name, file);
    self._maybeEnd();
  });
};

exports = module.exports = formParser;

function formParser(options) {
  options = options || {};
  return function *(next) {
    if (!typeis.hasBody(this.req) || this.req._body) {
      return yield next;
    }
    var _multipart = multipart(options);

    if(typeis(this.req) === 'multipart/form-data'){ // form 表单提交 图片
      let ret = yield _multipart(this.req);
      this.request.files = ret.fields;
      this.request.files = ret.files;
      yield next;
    } else {
      yield next;
    }
  };
}

// 表单
function multipart(options){
  options = extend({
    uploadDir: '/dev/null',
    keepExtensions: true,
    hash: 'md5'
  }, options);
  return function multipartParser(req) {
    var form = new formidable.IncomingForm(), data = [] , done;

    Object.keys(options).forEach(function(key){
      form[key] = options[key];
    });
    return new Promise(function(resolve, reject) {
      form.parse(req, function(err, fields, files){
        if (err) {
          reject(err);
        } else {
          resolve({fields: fields, files: files});
        }
      });
    });
  };
}

function extend(source, target){
  if (!source) source = {};
  if (!target) return source;
  for(var k in target){
    source[k] = target[k];
  }
  return source;
}