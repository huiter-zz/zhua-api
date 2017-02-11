const workerFarm = require('worker-farm');
const moment = require('moment');
const workers    = workerFarm(require.resolve('../service/snapshot'));
const os 		 = require('os');
const Process = require('../model').Process;
const logger = require('../utils').getLogger('snapshot');

const cpuLen = os.cpus().length;

const getMacIP = function () {
	let IPv4,hostName;
	hostName = os.hostname();
	for(let i=0; i<os.networkInterfaces().en0.length; i++) {
	    if(os.networkInterfaces().en0[i].family=='IPv4') {
	        IPv4 = os.networkInterfaces().en0[i].address;
	    }
	}
	return {IPv4: IPv4, hostName: hostName};
}

const getUbuntuIP = function () {
	let IPv4,hostName;
	hostName = os.hostname();
	for(let i=0; i<os.networkInterfaces().eth0.length; i++){
	    if(os.networkInterfaces().eth0[i].family=='IPv4'){
	        IPv4 = os.networkInterfaces().eth0[i].address;
	    }
	}
	return {IPv4: IPv4, hostName: hostName};
}

var info = getMacIP();
if (!info.IPv4 || !info.hostName) {
	info = getUbuntuIP();
}

const ensure = function () {
	return Process.findOne({
	    IPv4: info.IPv4,
	    hostName: info.hostName
	}).then(function(ret) {
		if (ret) return true;
		return Process.create({
	    	IPv4: info.IPv4,
	    	hostName: info.hostName
		});
	})
};

const lock = function() {
	return Process.update({
	    IPv4: info.IPv4,
	    hostName: info.hostName,
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
	    IPv4: info.IPv4,
	    hostName: info.hostName
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

const main = function () {
	ensure().then(function() {
		return lock();
	}).then(function() {
		var ret = 0;
		for (var i = 0; i < cpuLen; i++) {
			workers(function(err, outp) {
				if (++ret === cpuLen) {
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

main();
