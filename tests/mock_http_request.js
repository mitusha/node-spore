/**
 * port
 * host
 * path
 * request headers
 * http status
 * response headers
 * data
 */

var assert = require('assert');
/**
 *
 */
function createClient(request, port, host) {
    assert.equal(port, request.port);
    assert.equal(host, request.host);
    return {
        _events: {},
        on: function(name, callback) {
            this._events[name] = callback;
        },
        request: function(method, path, headers) {
            assert.equal(method, request.method);
            assert.equal(path, request.path);
            assert.equal(headers.host, request.host);
            if (request.headers)
                assert.deepEqual(headers, request.headers);
            var client = this;
            return {
                _events: {},
                on: function(name, callback) {
                    this._events[name] = callback;
                },
                write: function(data) {
                    this.data = data;
                },
                end: function() {
                    var that = this;
                    if (request.error) {
                        setTimeout(function() {
                            client._events['error'](request.error);
                        }, 100);
                        return;
                    }
                    if (request.payload)
                        assert.equal(this.data, request.payload);
                    setTimeout(function() {
                        that._events.response({
                            statusCode: request.statusCode,
                            headers: request.response_headers,
                            _events: {},
                            on: function(name, callback){
                                this._events[name] = callback;
                                if (name == 'end')
                                {
                                    var that = this;
                                    setTimeout(function() {
                                        var data = request.response_data;
                                        that._events.data(data);
                                        that._events.end();
                                    }, 100);
                                }
                            }
                        });
                    }, 1000);
                }
            };
        }
    };
}

exports.init = function() {
    var mocks = [];
    return {
        http : {
            createClient: function(port, host) {
                var request = mocks.shift();
                return createClient(request, port, host);
            }
        },
        add: function(mock) {
            mocks.push(mock);
        }
    };
};
