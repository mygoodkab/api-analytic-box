"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');
const Pack = require('./../package');
const autoRoute = { dir: process.cwd() + "/dist/routes" };
const options = {
    info: {
        'title': 'API Documentation',
        'version': Pack.version,
    }
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
    Inert,
    Vision,
    {
        register: require('hapi-auto-route'),
        options: autoRoute
    },
    {
        register: require('hapi-swagger'),
        options: options
    }
], (error) => {
    server.start((err) => {
        if (err) {
            throw err;
        }
        console.log('Server running at:', server.info.uri);
    });
});
//# sourceMappingURL=server.js.map