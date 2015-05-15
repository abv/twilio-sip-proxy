var sip = require('sip'),
    proxy = require('sip/proxy'),
    digest = require('sip/digest');

var Proxy = function(conf){
    var digest_context = conf.digest_context;
    var twilio_sip_uri = conf.sip_uri;
    var getPassword = conf.getPassword;
    var onCancel = conf.onCancel;

    var update_request_uri = function(rq){
      var uri = sip.parseUri(rq.uri);
      uri.host = twilio_sip_address;
      rq.uri = sip.stringifyUri(uri);
      return rq;
    }

    var get_request_username = function(rq){
      return sip.parseUri(rq.headers.from.uri).user;
    }
    
    proxy.start({
        logger: {
            recv: function(m) {
                if (m.method == "CANCEL" && onCancel) {
                    onCancel(null, m.headers['call-id']);
                }
            },
        }
    }, function(rq) {
      try {
        rq = update_request_uri(rq);
        switch(rq.method) {
          case "REGISTER":
          case "SUBSCRIBE":
            proxy.send(sip.makeResponse(rq, 403, 'Forbidden'));
            break;
          case "INVITE":
            proxy.send(sip.makeResponse(rq, 100, 'Trying'));
            var username = get_request_username(rq);
            getPassword(username, function(err, password){
                if (err) {
                    proxy.send(sip.makeResponse(rq, err.code || 500, err.toString()));
                } else {
                    var authenticated = digest.authenticateRequest(digest_context, rq, {
                        user: username, 
                        password: password
                    });
                    if (!authenticated) {
                        var resp = sip.makeResponse(rq, 407, 'Proxy Authentication Required');
                        var challenge = digest.challenge(digest_context, resp);
                        proxy.send(chanllenge);
                    } else {
                        proxy.send(rq);
                    }
                }
            });
            break;
          default:
            proxy.send(sip.makeResponse(rq, 100, 'Trying'));
            proxy.send(rq);
            break;
          }
        } catch (err) {
          proxy.send(sip.makeResponse(rq, 500, "Server Internal Error"));
        }
    });
}

module.exports = Proxy;