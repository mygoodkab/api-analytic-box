"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const db = require("../nosql-util");
const util_1 = require("../util");
const Boom = require("boom");
const mongoObjectId = require('mongodb').ObjectId;
const requestPath = require('request');
const objectid = require('objectid');
const Joi = require('joi');
const pathSep = require('path');
var child_process = require('child_process');
var fork = require('child_process').fork;
var net = require('net');
const { exec } = require('child_process');
var debug = require('debug')('worker:a');
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
                path: '/v1.24/containers/' + request.payload._nickname + '/logs?follow=false&stdout=true&stderr=true&since=0&timestamps=false&tail=50',
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
                    reply({
                        statusCode: 400,
                        msg: "Can't get log ",
                        data: err
                    });
                }
                else {
                    reply({
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
                    reply({
                        statusCode: 400,
                        msg: "Can't get state ",
                        data: err
                    });
                }
                else {
                    reply({
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
        path: '/docker/command/mongo',
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
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            let dbm = util_1.Util.getDb(request);
            let payload = request.payload;
            try {
                if (payload && (payload._command == "stop" || payload._command == "start")) {
                    const resAssignAnalytics = yield dbm.collection('assignAnalytics').findOne({ _id: payload._assignAnayticsId });
                    if (typeof resAssignAnalytics == 'undefined') {
                        reply(Boom.badRequest("Can't query data in assignAnaytics by " + payload._assignAnayticsId));
                    }
                    else {
                        const nickname = resAssignAnalytics.nickname;
                        let cmd;
                        if (payload._command == "start") {
                            cmd = "curl --unix-socket /opt/vam/vam-microservice-relay.sock http:/magic/relay/execute/analytics/status/" + nickname + "/up";
                            console.log("full command string=>", cmd);
                        }
                        else {
                            cmd = "curl --unix-socket /opt/vam/vam-microservice-relay.sock http:/magic/relay/execute/analytics/status/" + nickname + "/down";
                            console.log("full command string=>", cmd);
                        }
                        exec(cmd, (error, stdout, stderr) => __awaiter(this, void 0, void 0, function* () {
                            if (error) {
                                console.error(`exec error: ${error}`);
                            }
                            else if (stdout) {
                                console.log("respone cmd curl=>", stdout);
                                if (payload._command == 'start') {
                                    const update = yield dbm.collection('assignAnalytics').updateOne({ _id: payload._assignAnayticsId }, { $set: { status: payload._command } });
                                    reply({
                                        statusCode: 200,
                                        message: "OK",
                                        data: "update status success && run cmd start success"
                                    });
                                }
                                else {
                                    const update = yield dbm.collection('assignAnalytics').updateOne({ _id: payload._assignAnayticsId }, { $set: { status: payload._command, stopTime: Date.now() } });
                                    reply({
                                        statusCode: 200,
                                        message: "OK",
                                        data: "update status success && run cmd  stop success"
                                    });
                                }
                            }
                        }));
                    }
                }
                else {
                    reply(Boom.badRequest("Please check your command"));
                }
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
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
            let dbm = util_1.Util.getDb(request);
            let payload = request.payload;
            try {
            }
            catch (error) {
            }
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
                                                reply({
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
                                                reply({
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
                reply({
                    statusCode: 400,
                    msg: "Bad request",
                    data: msg
                });
            }
        }
    }
];
//# sourceMappingURL=docker.js.map