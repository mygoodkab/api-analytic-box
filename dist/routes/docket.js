"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const objectid = require('objectid');
const Joi = require('joi');
const pathSep = require('path');
var child_process = require('child_process');
var fork = require('child_process').fork;
var net = require('net');
module.exports = [
    {
        method: 'POST',
        path: '/log-docker',
        config: {
            tags: ['api'],
            description: 'Get All analytics data',
            notes: 'Get All analytics data',
            validate: {
                payload: {
                    _nickname: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => {
            var client = net.createConnection("/var/run/docker.sock");
            client.on("connect", function () {
                console.log("connect");
                client.write('http:/v1.24/containers/webconfig-dist/logs?stdout=1');
            });
            client.on("data", function (data) {
                console.log(data);
                return reply({
                    statusCode: 200,
                    message: "OK",
                    data: data
                });
            });
        }
    }
];
//# sourceMappingURL=docket.js.map