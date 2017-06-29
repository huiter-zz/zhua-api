const _ = require('lodash');
const path = require('path');
const Pageres = require('pageres');


const url = 'http://guoku.com';
const setting = {};

const main = function () {
        let size = _.isEmpty(setting.size) ? ['1024x768'] : setting.size;
        let options = {
                delay: +setting.delay || 1
        };
        options.filename = 'image';
        console.log('开始抓取');
        console.log(options);
        const pageres = new Pageres({
                delay: 1,
                timeout: 120,
                format: 'png'
        });
        pageres.src(url, size, options)
            .dest(path.join(__dirname, './'))
            .run()
            .then(function(ret) {
        		process.exit();
            });
}

main();