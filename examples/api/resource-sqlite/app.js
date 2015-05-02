'use strict';
var Hyper = require('../../../index.js');

// !-- FOR TESTS
var options = {};
try {
    options = JSON.parse(process.env.HYPER_OPTIONS);
} catch(err){}
// --!

// load config and routes
var hyper = new Hyper(options);

// load config and routes
var app = hyper();

app.load({
    routes: [{
        api: "/hello",
        method: {
            get: function world($done, hello)
            {
                hello.world()
                    .then(function(data){
                        $done(data);
                    });
            }
        }
    }]
});

app.resource('hello', require('./resource.hello.js'));

app.start();

// !-- FOR TESTS
module.exports = app;
// --!
