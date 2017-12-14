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
            payload.ts = Date.now();
            payload.id = id;
            payload.fileType = payload.fileType.toLowerCase();
            if (payload && (payload.outputType == 'cropping' || payload.outputType == 'detecting' || payload.outputType == 'recognition' || payload.outputType == 'counting')) {
                const hash = crypto.createHmac('sha256', JSON.stringify(payload)).digest('base64');
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
        method: 'POST',
        path: '/analytics-record/get/nickname-limit/',
        config: {
            tags: ['api'],
            description: 'Get analytics record data limit by num',
            notes: 'Get analytics record data and limit by num',
            validate: {
                payload: {
                    _nickname: Joi.string().required(),
                    _num: Joi.number().required()
                }
            }
        },
        handler: (request, reply) => {
            db.collection('analytics-record').find().make((builder) => {
                const payload = request.payload;
                builder.where('dockerNickname', payload._nickname);
                builder.limit(payload._num);
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
                    _id: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => {
            db.collection('analytics-record').find().make((builder) => {
                builder.where("id", request.params._id);
                builder.first();
                builder.callback((err, res) => {
                    if (res.length == 0) {
                        return reply({
                            statusCode: 404,
                            message: "Bad Request",
                            data: "Data not found"
                        });
                    }
                    else if (res.fileType != "png" || res.fileType != "jpg" || res.fileType != "jpeg") {
                        return reply({
                            statusCode: 404,
                            message: "Bad Request",
                            data: "Invail file type"
                        });
                    }
                    else {
                        const hash = crypto.createHmac('sha256', JSON.stringify(res)).digest('base64');
                        let path = util_1.Util.dockerAnalyticsCameraPath() + res.dockerNickname + pathSep.sep + "output" + pathSep.sep + hash + "." + res.fileType;
                        reply("test : " + hash);
                        return reply.file(path, {
                            filename: res.name + '.' + res.fileType,
                            mode: 'inline',
                            confine: false
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