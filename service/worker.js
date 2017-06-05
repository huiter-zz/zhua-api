const workerFarm = require('worker-farm');
const moment = require('moment');
const workers    = workerFarm(require.resolve('./snapshot'));

const Process = require('../model').Process;
const logger = require('../utils').getLogger('snapshot');
const cpuInfo = require('../utils').cpuInfo;

const lock = function() {
	return Process.update({
	    IPv4: cpuInfo.IPv4,
	    hostName: cpuInfo.hostName,
	    status: 'free'
	}, {
	   	$set: {
	      	status: 'busy'
	    }
	}).then(function(ret) {
  		if (!ret || !ret.n) {
  			return Promise.reject(false);
  		} else {
  			return Promise.resolve(true);
  		}
	});
};

const unlock = function () {
	return Process.update({
	    IPv4: cpuInfo.IPv4,
	    hostName: cpuInfo.hostName
	}, {
	    $set: {
	      	status: 'free'
	    }
	}).then(function(ret) {
  		if (!ret || !ret.n) {
  			return Promise.reject(false);
  		} else {
  			return Promise.resolve(true);
  		}
	});
};

const check = function () {
	return Process.findOne({
	    IPv4: cpuInfo.IPv4,
	    hostName: cpuInfo.hostName
	}).then(function(doc) {
		if (!doc || doc.status === 'free') {
			return false;
		} else {
			return true;
		}
	})
}

const main = function () {
	lock().then(function() {
		var ret = 0;
		for (var i = 0; i < cpuInfo.cpuLen; i++) {
			workers(function(err, outp) {
				if (++ret === cpuInfo.cpuLen) {
					workerFarm.end(workers);
					return unlock().then(function() {
						setTimeout(process.exit, 1000);
					});
				}
			});
		}
	}).catch(function() {
		logger.warn('执行进程未空闲，等待下一次执行');
		setTimeout(process.exit, 1000);
	});
};

module.exports = {
	main: main,
	check: check
}
