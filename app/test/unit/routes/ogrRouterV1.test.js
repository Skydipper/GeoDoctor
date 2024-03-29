
const logger = require('logger');
const should = require('should');
const assert = require('assert');
const sinon = require('sinon');
const config = require('config');
const ogrRouterV1 = require('routes/api/v1/ogrRouter');
const path = require('path');
const fs = require('fs-extra');


const stat = function (path) {
    return function (callback) {
        fs.stat(path, callback);
    };
};

const unlink = function (file) {
    return function (callback) {
        fs.unlink(file, callback);
    };
};


describe('Check /convert route', () => {

    const ctx = {
        assert() {
            return false;
        },
        request: {
            body: {
                files: {
                    file: {
                        path: path.join('/tmp/valid', 'shape.zip')
                    }
                }
            }
        },
        body: null
    };
    const ctxInvalid = {
        assert() {
            return false;
        },
        request: {
            body: {
                files: {
                    file: {
                        path: path.join('/tmp/invalid', 'invalid.zip')
                    }
                }
            }
        },
        body: null,
        throw(status, message) {
            this.status = status;
            this.body = message;
        }
    };

    const ctxInvalidNotParam = {
        assert(param, status, message) {
            if (!param) {
                this.throw(status, message);
                throw new Error();
            }
        },
        request: {
            body: {
                files: {

                }
            }
        },
        body: null,
        throw(status, message) {
            this.status = status;
            this.body = message;
        }
    };
    const url = '/geodoctor/convert';
    const method = 'POST';
    let func = null;
    before(function* () {

        for (let i = 0, { length } = ogrRouterV1.stack; i < length; i++) {
            if (ogrRouterV1.stack[i].regexp.test(url) && ogrRouterV1.stack[i].methods.indexOf(method) >= 0) {
                func = ogrRouterV1.stack[i].stack[1];
            }
        }

    });

    describe('Invalid files v1', () => {
        beforeEach(function* () {
            logger.debug('Copying file');
            fs.copySync(path.join(__dirname, '../files/invalid.zip'), path.join('/tmp/invalid', 'invalid.zip'));
        });

        it('Convert invalid file', function* () {

            const funcTest = func.bind(ctxInvalid);
            funcTest.should.be.a.Function();
            let resultStat = null;
            try {
                yield funcTest();
                ctxInvalid.status.should.be.equal(400);

                resultStat = yield stat(ctxInvalid.request.body.files.file.path);

            } catch (e) {
                e.should.be.a.Error();
            }
            should(resultStat).be.null();

        });
        afterEach(function* () {
            try {
                yield unlink(path.join('/tmp', 'invalid.zip'));
            } catch (e) {

            }
        });
    });
    describe('Not file param v1', () => {
        it('Check file in body', function* () {

            const funcTest = func.bind(ctxInvalidNotParam);
            funcTest.should.be.a.Function();
            const resultStat = null;
            try {
                yield funcTest();
                ctxInvalid.status.should.be.equal(400);

            } catch (e) {

                e.should.be.a.Error();
            }
            should(resultStat).be.null();
        });
    });
});
