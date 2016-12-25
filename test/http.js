const app = require('../bin/www');
GLOBAL.http = require('supertest')(app);