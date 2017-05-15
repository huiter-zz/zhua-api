const Page = require('../model').Page;

Page.update({}, {$set: {
	expectFetchTime: {
		hour: 0,
		minute: 0
	}
}}, {multi: true}).then(function(ret){
	console.log('update status complete ', ret);
	process.exit();
});
