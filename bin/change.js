const Page = require('../model').Page;

Page.update({
	retryTimes: {
		$exists: false
	}
}, {retryTimes: 0}, {multi: true}).then(function(ret){
	console.log('update retryTimes success ', ret);
	return Page.update({
		canFetchTime: {
			$exists: false
		}
	}, {canFetchTime: Date.now()}, {multi: true});
}).then(function(ret) {
	console.log('update canFetchTime complete ', ret);
	return Page.update({
		status: {
			$exists: false
		}
	}, {status: 'normal'}, {multi: true});	
}).then(function(ret) {
	console.log('update status complete ', ret);
	process.exit();
});
