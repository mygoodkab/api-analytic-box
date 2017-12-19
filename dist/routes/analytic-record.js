"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db = require("../nosql-util");
const util_1 = require("../util");
const objectid = require('objectid');
const Joi = require('joi');
const crypto = require('crypto');
const pathSep = require('path');
module.exports = [
    {
        method: 'POST',
        path: '/analytics-record/record',
        config: {
            tags: ['api'],
            description: 'analytics record data and return hash',
            notes: 'analytics record data and return hash',
            validate: {
                payload: {
                    ts: Joi.string().required(),
                    dockerNickname: Joi.string().required(),
                    outputType: Joi.string().required(),
                    fileType: Joi.string().required(),
                    metadata: Joi.any()
                }
            }
        },
        handler: (request, reply) => {
            const id = objectid();
            const payload = request.payload;
            payload.ts = parseInt(payload.ts, 10);
            payload.id = id;
            payload.fileType = payload.fileType.toLowerCase();
            if (payload && (payload.outputType == 'cropping' || payload.outputType == 'detection' || payload.outputType == 'recognition' || payload.outputType == 'counting')) {
                let str = payload.ts + payload.dockerNickname + payload.outputType + payload.fileType + JSON.stringify(payload.metadata);
                let hash = crypto.createHmac('sha256', str).digest('base64');
                hash = hash.replace(/[^a-zA-Z ]/g, "");
                db.collection('analytics-record').insert(payload).callback((err) => {
                    if (err) {
                        return reply({
                            statusCode: 400,
                            msg: "Bad Request",
                            data: err
                        });
                    }
                    else {
                        return reply({
                            statusCode: 200,
                            msg: "OK Insert success",
                            data: hash
                        });
                    }
                });
            }
            else {
                return reply({
                    statusCode: 400,
                    msg: "Bad Request",
                    data: "Please check 'outputType'"
                });
            }
        }
    },
    {
        method: 'GET',
        path: '/analytics-record/get',
        config: {
            tags: ['api'],
            description: 'Get analytics record data',
            notes: 'Get analytics record data and',
        },
        handler: (request, reply) => {
            db.collection('analytics-record').find().make((builder) => {
                builder.sort('ts', true);
                builder.callback((err, res) => {
                    if (err) {
                        return reply({
                            statusCode: 400,
                            msg: "Bad Request",
                            data: err
                        });
                    }
                    else {
                        return reply({
                            statusCode: 200,
                            msg: "OK",
                            data: res
                        });
                    }
                });
            });
        }
    },
    {
        method: 'GET',
        path: '/analytics-record/get/{_nickname}',
        config: {
            tags: ['api'],
            description: 'Get analytics record data',
            notes: 'Get analytics record data and',
            validate: {
                params: {
                    _nickname: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => {
            db.collection('analytics-record').find().make((builder) => {
                const params = request.params;
                builder.where('dockerNickname', params._nickname);
                builder.sort('ts', true);
                builder.callback((err, res) => {
                    if (err) {
                        return reply({
                            statusCode: 400,
                            msg: "Bad Request",
                            data: err
                        });
                    }
                    else {
                        return reply({
                            statusCode: 200,
                            msg: "OK",
                            data: res
                        });
                    }
                });
            });
        }
    },
    {
        method: 'GET',
        path: '/analytics-record/get/{_nickname}/{_num}',
        config: {
            tags: ['api'],
            description: 'Get analytics record data limit by num',
            notes: 'Get analytics record data and limit by num',
            validate: {
                params: {
                    _nickname: Joi.string().required(),
                    _num: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => {
            db.collection('analytics-record').find().make((builder) => {
                const params = request.params;
                builder.where('dockerNickname', params._nickname);
                builder.limit(params._num);
                builder.sort('ts', true);
                builder.callback((err, res) => {
                    if (err) {
                        return reply({
                            statusCode: 400,
                            msg: "Bad Request",
                            data: err
                        });
                    }
                    else {
                        return reply({
                            statusCode: 200,
                            msg: "OK",
                            data: res
                        });
                    }
                });
            });
        }
    },
    {
        method: 'POST',
        path: '/analytics-record/get/time',
        config: {
            tags: ['api'],
            description: 'Get analytics record data',
            notes: 'Get analytics record data and',
            validate: {
                payload: {
                    _time: Joi.any(),
                    _nickname: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => {
            const payload = request.payload;
            db.collection('analytics-record').find().make((builder) => {
                builder.where('dockerNickname', payload._nickname);
                builder.between('ts', 1513146685761, 1513146764330);
                builder.callback((err, res) => {
                    if (err) {
                        return reply({
                            statusCode: 400,
                            msg: "Bad Request",
                            data: err
                        });
                    }
                    else {
                        return reply({
                            statusCode: 200,
                            msg: "OK",
                            data: res,
                        });
                    }
                });
            });
        }
    },
    {
        method: 'GET',
        path: '/analytics-record/image/{_id}',
        config: {
            tags: ['api'],
            description: 'Get image for UI',
            notes: 'Get image ',
            validate: {
                params: {
                    _id: Joi.string().required().description("id anaytics-redord")
                }
            }
        },
        handler: (request, reply) => {
            db.collection('analytics-record').find().make((builder) => {
                builder.where("id", request.params._id);
                builder.first();
                builder.callback((err, res) => {
                    if (!res) {
                        return reply({
                            statusCode: 404,
                            message: "Bad Request",
                            data: "Data not found"
                        });
                    }
                    else if (res.fileType == "png" || res.fileType == "jpg" || res.fileType == "jpeg") {
                        let str = res.ts + res.dockerNickname + res.outputType + res.fileType + JSON.stringify(res.metadata);
                        let hash = crypto.createHmac('sha256', str).digest('base64');
                        hash = hash.replace(/[^a-zA-Z ]/g, "");
                        let path = util_1.Util.dockerAnalyticsCameraPath() + res.dockerNickname + pathSep.sep + "output" + pathSep.sep + hash + "." + res.fileType;
                        console.log(str);
                        console.log("test : " + hash);
                        console.log("hash : " + res.hash);
                        return reply.file(path, {
                            filename: res.name + '.' + res.fileType,
                            mode: 'inline',
                            confine: false
                        });
                    }
                    else {
                        return reply({
                            statusCode: 404,
                            message: "Bad Request",
                            data: "Invail file type"
                        });
                    }
                });
            });
        }
    },
    {
        method: 'POST',
        path: '/analytics-record/delete-all',
        config: {
            tags: ['api'],
            description: 'delete all',
            notes: 'delete all',
            validate: {
                payload: {
                    pass: Joi.string().required(),
                }
            }
        },
        handler: (request, reply) => {
            if (request.payload.pass == "pass") {
                db.collection('analytics-record').remove().make((builder) => {
                    builder.callback((err, res) => {
                        if (err) {
                            return reply({
                                statusCode: 400,
                                msg: "Bad request"
                            });
                        }
                        else {
                            return reply({
                                statusCode: 200,
                                msg: "OK"
                            });
                        }
                    });
                });
            }
            else {
                return reply({
                    statusCode: 400,
                    msg: "Bad request"
                });
            }
        }
    }
];
//# sourceMappingURL=analytic-record.js.map