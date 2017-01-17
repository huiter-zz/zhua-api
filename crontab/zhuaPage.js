const workerFarm = require('worker-farm');
const moment = require('moment');
const workers    = workerFarm(require.resolve('../service/snapshot'));
const os 		 = require('os');
var ret          = 0;
const cpuLen = os.cpus().length;
var time = moment().endOf('day').valueOf();
for (var i = 0; i < cpuLen; i++) {
	workers(time, function(err, outp) {
		if (++ret === cpuLen) {
			workerFarm.end(workers);
		}
	});
}
