const Hapi = require('hapi');
const Boom = require('boom');
const auth = require('basic-auth');
const unirest = require('unirest');

const server = new Hapi.Server({});

const port = process.argv[2] || 4000;

const config = require('./config.json');

const accreditatePayload = function(payload, cb) {
    unirest.post(config.accreditor.url)
        .headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
        .send(payload)
        .auth({
          user: config.accreditor.user,
          pass: config.accreditor.password,
          sendImmediately: true
        })
        .end(function (response) {
            if (!response.ok) {
                return cb(response.status);
            }

            cb(null, response.body);
        });
};

server.connection({
  port: port
});

server.route({
    method: 'POST',
    path: '/login',
    handler: function (request, reply) {
		const user = auth(request);
        if (!user || !config.users[user.name] || config.users[user.name].password != user.pass) {
            return reply(Boom.unauthorized());
		}

        accreditatePayload({username: user.name}, function(err, result) {
            console.log(err);
            reply(result);
        });
    }
});

server.start((err) => {
    if (err) {
        throw err;
    }

    console.log('server start on port ' + port);
});
