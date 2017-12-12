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
                    metadata: Joi.any()
                }
            }
        },
        handler: (request, reply) => {
            const id = objectid();
            const payload = request.payload;
            payload.id = id;
            if (payload) {
                const hash = crypto.createHmac('sha256', JSON.stringify(payload))
                    .digest('hex');
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
                    data: "No data in payload"
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
        path: '/analytics-record/get/{nickname}',
        config: {
            tags: ['api'],
            description: 'Get analytics record data',
            notes: 'Get analytics record data and',
            validate: {
                params: {
                    nickname: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => {
            db.collection('analytics-record').find().make((builder) => {
                const payload = request.payload;
                builder.where('dockerNickname', payload.nickname);
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
        path: '/analytics-record/image/{id}',
        config: {
            tags: ['api'],
            description: 'Get image for UI',
            notes: 'Get image ',
            validate: {
                params: {
                    id: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => {
            db.collection('analytics-record').find().make((builder) => {
                builder.where("id", request.params.id);
                builder.callback((err, res) => {
                    if (res.length == 0) {
                        return reply({
                            statusCode: 404,
                            message: "Bad Request",
                            data: "Data not found"
                        });
                    }
                    else {
                        res = res[0];
                        var contentType;
                        switch (res.fileType) {
                            case "pdf":
                                contentType = 'application/pdf';
                                break;
                            case "ppt":
                                contentType = 'application/vnd.ms-powerpoint';
                                break;
                            case "pptx":
                                contentType = 'application/vnd.openxmlformats-officedocument.preplyentationml.preplyentation';
                                break;
                            case "xls":
                                contentType = 'application/vnd.ms-excel';
                                break;
                            case "xlsx":
                                contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                                break;
                            case "doc":
                                contentType = 'application/msword';
                                break;
                            case "docx":
                                contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                                break;
                            case "csv":
                                contentType = 'application/octet-stream';
                                break;
                        }
                        let path = util_1.Util.uploadImagePath() + res.refInfo + pathSep.sep + res.storeName;
                        console.log('Getting image . . . . . success');
                        return reply.file(path, {
                            filename: res.name + '.' + res.fileType,
                            mode: 'inline',
                            confine: false
                        }).type(contentType);
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