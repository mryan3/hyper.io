'use strict';
var Hyper = require('../../../index.js');

// !-- FOR TESTS
var options = {};
try {
    options = JSON.parse(process.env.HYPER_OPTIONS);
} catch(err){}
// --!

// Load config and routes
var app = new Hyper(options);

// Start web server
app.start();

// !-- FOR TESTS
module.exports = app;
// --!
