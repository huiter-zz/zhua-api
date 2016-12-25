const fs = require('fs');
const path = require('path');
const config = require('config');
const _ = require('lodash');
const logger = require('../utils').getLogger('crontab');


var NODE_COMMAND = config.crontab.nodeCommand;
var SHELL_COMMAND = config.crontab.shellCommand;
var comment = 'zhua-page';
var execDir = path.join(__dirname, '../');

if(!NODE_COMMAND || !SHELL_COMMAND) {
  throw new Error('need NODE_COMMAND and SHELL_COMMAND config');
}

require('crontab').load(function(err, crontab){
  if(err) {
    logger.error('Crontab: load retunr a error %s', err);
  }else {
    var jobs = crontab.jobs({comment: comment});
    _.each(jobs, function(job){
      var str = job.toString();
      logger.info('Crontab: init remove task %s', str);
      crontab.remove(job);
    });

    var createJob = function(dir, filename, ext){
      var crontabCommand = '';
      if(ext === '.sh') {
        crontabCommand = 'cd ' + execDir + ' && ' + SHELL_COMMAND + ' ' + dir;
      }else  {
        crontabCommand = 'cd ' + execDir + ' && ' + NODE_COMMAND + ' ' + dir;
      }
      var jobs = crontab.jobs({command: crontabCommand, comment: comment});
      if(jobs.length) {
        logger.info('Crontab: task %s is exist', crontabCommand);
      }else {
        var when = config.crontab && config.crontab[filename];
        if(when) {
          var job = crontab.create(crontabCommand, when, comment);
          logger.info('Crontab: register task %s', job.toString());
        }else {
          logger.error("Don't know what time " + filename +' to run');
        }
      }
    };


    fs.readdir(__dirname, function(err, dirs){

      dirs.forEach(function(key) {
        var ext = path.extname(key);
        var filename = key.replace(ext, '');
        if (filename !== 'index') {
          var dir = __dirname + '/'+ key;
          createJob(dir, filename, ext);
        }
      });

      crontab.save();
    });

  }
});