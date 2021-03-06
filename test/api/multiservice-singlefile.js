var request = require('supertest');
var chai    = require('chai');
var expect  = chai.expect;

module.exports = [
    function (server, done) {
        expect(server).to.not.be.null;
        if(server) {
            request(server)
                .get('/service1/hello')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    expect(err).to.be.null;
                    expect(res.body).to.have.keys("hello", "ts");
                    expect(res.body.hello).to.equal("world");
                    if(done) done();
                });
        } else {
            if(done) done();
        }
    },
    function (server, done) {
        expect(server).to.not.be.null;
        if(server) {
            request(server)
                .get('/service2/hello')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    expect(err).to.be.null;
                    expect(res.body).to.have.keys("hello", "ts");
                    expect(res.body.hello).to.equal("world");
                    if(done) done();
                });
        } else {
            if(done) done();
        }
    }

];