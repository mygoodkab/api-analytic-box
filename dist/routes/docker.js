"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db = require("../nosql-util");
const requestPath = require('request');
const objectid = require('objectid');
const Joi = require('joi');
const pathSep = require('path');
var child_process = require('child_process');
var fork = require('child_process').fork;
var net = require('net');
const { exec } = require('child_process');
module.exports = [
    {
        method: 'POST',
        path: '/docker/log',
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
            const options = {
                socketPath: '/var/run/docker.sock',
                path: '/v1.24/containers/' + request.payload._nickname + '/logs?stdout=1',
            };
            var url = 'http://unix:' + options.socketPath + ':' + options.path;
            var option = {
                url: url,
                headers: {
                    "Host": "http",
                }
            };
            requestPath.get(option, (err, res, body) => {
                if (err) {
                    console.log('Error : ', err);
                    return reply({
                        statusCode: 400,
                        msg: "Can't get log ",
                        data: err
                    });
                }
                else {
                    return reply({
                        statusCode: 200,
                        msg: 'Get log docker success',
                        data: body
                    });
                }
            });
        }
    },
    {
        method: 'POST',
        path: '/docker/state',
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
            const options = {
                socketPath: '/var/run/docker.sock',
                path: '/v1.32/containers/' + request.payload._nickname + '/json?size=false',
            };
            var url = 'http://unix:' + options.socketPath + ':' + options.path;
            var option = {
                url: url,
                headers: {
                    "Host": "http",
                }
            };
            requestPath.get(option, (err, res, body) => {
                if (err) {
                    console.log('Error : ', err);
                    return reply({
                        statusCode: 400,
                        msg: "Can't get state ",
                        data: err
                    });
                }
                else {
                    return reply({
                        statusCode: 200,
                        msg: 'Get state docker success',
                        data: JSON.parse(body)
                    });
                }
            });
        }
    },
    {
        method: 'POST',
        path: '/docker/command',
        config: {
            tags: ['api'],
            description: 'Get All analytics data',
            notes: 'Get All analytics data',
            validate: {
                payload: {
                    _assignAnayticsId: Joi.string().required(),
                    _command: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => {
            let payload = request.payload;
            if (payload && (payload._command == "stop" || payload._command == "start")) {
                db.collection('assignAnalytics').find().make((builder) => {
                    builder.where('_id', payload._assignAnayticsId);
                    builder.first();
                    builder.callback((err, res) => {
                        if (typeof res == 'undefined') {
                            badRequest("Can't query data in assignAnaytics by " + payload._assignAnayticsId);
                        }
                        else {
                            const nickname = res.nickname;
                            let cmd;
                            if (payload._command == "start") {
                                cmd = "curl --unix-socket /opt/vam/vam-microservice-relay.sock http:/magic/relay/execute/analytics/status/" + nickname + "/up";
                                console.log("full command string=>", cmd);
                            }
                            else {
                                cmd = "curl --unix-socket /opt/vam/vam-microservice-relay.sock http:/magic/relay/execute/analytics/status/" + nickname + "/down";
                                console.log("full command string=>", cmd);
                            }
                            exec(cmd, (error, stdout, stderr) => {
                                if (error) {
                                    console.error(`exec error: ${error}`);
                                    badRequest("Error : " + error);
                                }
                                else if (stdout) {
                                    console.log("respone cmd curl=>", stdout);
                                    if (payload._command == 'start') {
                                        db.collection('assignAnalytics').modify({ status: payload._command }).make((builder) => {
                                            builder.where('_id', payload._assignAnayticsId);
                                            builder.callback((err, res) => {
                                                if (err) {
                                                    badRequest("Can't up status");
                                                }
                                                return reply({
                                                    statusCode: 200,
                                                    message: "OK",
                                                    data: "update status success"
                                                });
                                            });
                                        });
                                    }
                                    else {
                                        db.collection('assignAnalytics').modify({ status: payload._command, stopTime: Date.now() }).make((builder) => {
                                            builder.where('_id', payload._assignAnayticsId);
                                            builder.callback((err, res) => {
                                                if (err) {
                                                    badRequest("Can't up status");
                                                }
                                                return reply({
                                                    statusCode: 200,
                                                    message: "OK",
                                                    data: "update status success"
                                                });
                                            });
                                        });
                                    }
                                }
                                else {
                                    badRequest("Command : " + cmd + "\n" + "Stderr : " + stderr);
                                }
                            });
                        }
                    });
                });
            }
            else {
                badRequest("Please check your command");
            }
            function badRequest(msg) {
                return reply({
                    statusCode: 400,
                    msg: "Bad request",
                    data: msg
                });
            }
        }
    }
];
//# sourceMappingURL=docker.js.map