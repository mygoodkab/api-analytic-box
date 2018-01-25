"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');
const Pack = require('./../package');
const util = require('./util');
const autoRoute = { dir: process.cwd() + "/dist/routes" };
const Boom = require('boom');
const optionsSwagger = {
    auth: false,
    info: {
        'title': 'API Documentation',
        'version': Pack.version,
    }
};
const optionsMongo = {
    url: 'mongodb://' + util.MONGODB.URL + ':' + util.MONGODB.PORT + '/admin',
    settings: {
        poolSize: 10
    },
    decorate: true
};
const server = new Hapi.Server();
server.connection({
    port: 8000,
    routes: {
        cors: true,
        files: {
            relativeTo: util_1.Util.uploadRootPath()
        }
    }
});
server.register([
    {
        register: require('hapi-mongodb'),
        options: optionsMongo
    },
    Inert,
    Vision,
    {
        register: require('hapi-auto-route'),
        options: autoRoute
    },
    {
        register: require('hapi-swagger'),
        options: optionsSwagger
    },
], (error) => {
    if (error)
        throw error;
    server.start((err) => {
        if (err) {
            throw err;
        }
        console.log('Server running at:', server.info.uri);
    });
    function validate(decoded, request, callback) {
        return callback(null, true);
    }
});
//# sourceMappingURL=server.js.map