"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db = require("../nosql-util");
const objectid = require('objectid');
const Joi = require('joi');
module.exports = [
    {
        method: 'GET',
        path: '/rules',
        config: {
            tags: ['api'],
            description: 'Select all rules ',
            notes: 'Select all rules '
        },
        handler: function (request, reply) {
            db.collection('rules').find().make((builder) => {
                builder.callback((err, res) => {
                    if (res.length == 0) {
                        return reply({
                            statusCode: 500,
                            message: "No data",
                            data: "-"
                        });
                    }
                    else {
                        return reply({
                            statusCode: 200,
                            message: "OK",
                            data: res
                        });
                    }
                });
            });
        }
    },
    {
        method: 'GET',
        path: '/rules/{id}',
        config: {
            tags: ['api'],
            description: 'Get id rules data',
            notes: 'Get id rules data',
            validate: {
                params: {
                    id: Joi.string()
                        .required()
                        .description('id feature'),
                }
            }
        },
        handler: (request, reply) => {
            db.collection('rules').find().make((builder) => {
                builder.where('id', request.params.id);
                builder.first();
                builder.callback((err, res) => {
                    if (!res) {
                        return reply({
                            statusCode: 500,
                            message: "No data",
                            data: "-"
                        });
                    }
                    else {
                        return reply({
                            statusCode: 200,
                            message: "OK",
                            data: res
                        });
                    }
                });
            });
        }
    },
    {
        method: 'GET',
        path: '/rules/dockerNickname/{id}',
        config: {
            tags: ['api'],
            description: 'Get id rules data',
            notes: 'Get id rules data',
            validate: {
                params: {
                    id: Joi.string()
                        .required()
                }
            }
        },
        handler: (request, reply) => {
            db.collection('rules').find().make((builder) => {
                builder.where('dockerNickname', request.params.id);
                builder.first();
                builder.callback((err, res) => {
                    if (!res) {
                        return reply({
                            statusCode: 500,
                            message: "No data",
                            data: "-"
                        });
                    }
                    else {
                        return reply({
                            statusCode: 200,
                            message: "OK",
                            data: res
                        });
                    }
                });
            });
        }
    },
    {
        method: 'POST',
        path: '/rules/insert',
        config: {
            tags: ['api'],
            description: 'Insert rules data',
            notes: 'Insert rules data',
            validate: {
                payload: {
                    dockerNickname: Joi.string().required(),
                    rule: Joi.array().required(),
                }
            }
        },
        handler: (request, reply) => {
            let payload = request.payload;
            if (payload) {
                payload.id = objectid();
                let validate = payload.rule[0];
                if (typeof validate.type == "undefined" && typeof validate.day == "undefined" && typeof validate.timeStart == "undefined" && typeof validate.timeEnd == "undefined" && typeof validate.condition == "undefined") {
                    badRequest("Invaid  Payload");
                }
                else {
                    db.collection('rules').insert(request.payload).callback((err, res) => {
                        if (err) {
                            badRequest("can't insert");
                        }
                        else {
                            return reply({
                                statusCode: 200,
                                message: "OK",
                                data: "Create rule Succeed"
                            });
                        }
                    });
                }
            }
            else {
                badRequest("no payload");
            }
            function badRequest(msg) {
                return reply({
                    statusCode: 400,
                    message: "Bad Request",
                    data: msg
                });
            }
        }
    },
    {
        method: 'POST',
        path: '/rules/delete-all',
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
                db.collection('rules').remove().make((builder) => {
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
//# sourceMappingURL=rule.js.map