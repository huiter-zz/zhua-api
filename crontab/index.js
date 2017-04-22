const fs = require('fs');
const path = require('path');
const config = require('config');
const _ = require('lodash');
const logger = require('../utils').getLogger('crontab');
const Process = require('../model').Process;

const cpuInfo = require('../utils').cpuInfo;
const NODE_COMMAND = config.crontab.nodeCommand;
const SHELL_COMMAND = config.crontab.shellCommand;
const comment = 'zhua-page';
const execDir = path.join(__dirname, '../');

if (!NODE_COMMAND || !SHELL_COMMAND) {
  throw new Error('need NODE_COMMAND and SHELL_COMMAND config');
}

const ensure = function () {
  Process.findOneAndUpdate({
      IPv4: cpuInfo.IPv4,
      hostName: cpuInfo.hostName
  }, {
    status: 'free'
  }).then(function(ret) {
    if (ret) return true;
    return Process.create({
        IPv4: cpuInfo.IPv4,
        hostName: cpuInfo.hostName
    });
  })
};
ensure();


require('crontab').load(function(err, crontab) {
  if (err) {
    logger.error('Crontab: load retunr a error %s', err);
  } else {
    let jobs = crontab.jobs({comment: comment});
    _.each(jobs, function(job) {
      let str = job.toString();
      logger.info('Crontab: init remove task %s', str);
      crontab.remove(job);
    });

    let createJob = function(dir, filename, ext) {
      let crontabCommand = '';
      if (ext === '.sh') {
        crontabCommand = 'cd ' + execDir + ' && ' + SHELL_COMMAND + ' ' + dir;
      } else  {
        crontabCommand = 'cd ' + execDir + ' && ' + NODE_COMMAND + ' ' + dir;
      }
      let jobs = crontab.jobs({command: crontabCommand, comment: comment});
      if (jobs.length) {
        logger.info('Crontab: task %s is exist', crontabCommand);
      } else {
        let when = config.crontab && config.crontab[filename];
        if (when) {
          let job = crontab.create(crontabCommand, when, comment);
          logger.info('Crontab: register task %s', job.toString());
        } else {
          logger.error("Don't know what time " + filename +' to run');
        }
      }
    };

    fs.readdir(__dirname, function(err, dirs) {

      dirs.forEach(function(key) {
        let ext = path.extname(key);
        let filename = key.replace(ext, '');
        if (filename !== 'index') {
          let dir = __dirname + '/'+ key;
          createJob(dir, filename, ext);
        }
      });

      crontab.save();
    });
  }
});