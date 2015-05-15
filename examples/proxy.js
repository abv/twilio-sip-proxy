var Proxy = require('../index');

var decrypt_password = function(str) {
    // In the real word, encrypt your password
    return str;
}

var proxy = new Proxy({
    'digest_context' : 'foo',
    'sip_uri' : 'foo.sip.twilio.com',
    'getPassword' : function(username, callback){
        var users = {
            "bob" : "password1",
            "lisa" : "password2"
        };
        if (users[username]) {
            callback(null, decrypt_password(users[username]));
        } else {
            var err = new Error("User not found");
            err.code = 404;
            callback(err);
        }
    },
    'onCancel' : function(err, call_id){
        console.log('The following call canceled: ' + call_id);
    }
});