"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db = require("../nosql-util");
const objectid = require('objectid');
const Joi = require('joi');
module.exports = [
    {
        method: 'GET',
        path: '/notification',
        config: {
            tags: ['api'],
            description: 'Select all notification  ',
            notes: 'Select all notification '
        },
        handler: function (request, reply) {
            db.collection('notification').find().make((builder) => {
                builder.where('isHide', false);
                builder.sort('timedb', true);
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
        path: '/notification/{dockerNickname}',
        config: {
            tags: ['api'],
            description: 'Get id notification data',
            notes: 'Get id notification data',
            validate: {
                params: {
                    dockerNickname: Joi.string()
                        .required()
                }
            }
        },
        handler: (request, reply) => {
            db.collection('notification').find().make((builder) => {
                builder.where('dockerNickname', request.params.dockerNickname);
                builder.sort('timedb', true);
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
        path: '/notification/sort-statusRead/{dockerNickname}',
        config: {
            tags: ['api'],
            description: 'Get id notification data',
            notes: 'Get id notification data',
            validate: {
                params: {
                    dockerNickname: Joi.string()
                        .required()
                }
            }
        },
        handler: (request, reply) => {
            db.collection('notification').find().make((builder) => {
                builder.where('dockerNickname', request.params.dockerNickname);
                builder.where('isRead', false);
                builder.sort('timedb', true);
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
        path: '/notification/lastest/{dockerNickname}',
        config: {
            tags: ['api'],
            description: 'Get lastest dockerNickname notification data ',
            notes: 'Get  lastest dockerNickname notification data',
            validate: {
                params: {
                    dockerNickname: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => {
            db.collection('notification').find().make((builder) => {
                builder.where('dockerNickname', request.params.dockerNickname);
                builder.sort('timedb', true);
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
        path: '/notification/hide',
        config: {
            tags: ['api'],
            description: 'hide notification',
            notes: 'hide notification',
            validate: {
                payload: {
                    id: Joi.string().required(),
                }
            }
        },
        handler: (request, reply) => {
            db.collection('notification').find().make((builder) => {
                builder.where('id', request.payload.id);
                builder.first();
                builder.callback((err, res) => {
                    if (err) {
                        return reply({
                            statusCode: 400,
                            msg: "Bad request"
                        });
                    }
                    else {
                        db.collection('notification').modify({ isHide: true }).make((builder) => {
                            builder.where('id', request.payload.id);
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
                });
            });
        }
    },
    {
        method: 'GET',
        path: '/notification/sort-hide/{dockerNickname}',
        config: {
            tags: ['api'],
            description: 'Get id notification data',
            notes: 'Get id notification data',
            validate: {
                params: {
                    dockerNickname: Joi.string()
                        .required()
                }
            }
        },
        handler: (request, reply) => {
            db.collection('notification').find().make((builder) => {
                builder.where('dockerNickname', request.params.dockerNickname);
                builder.where('isHide', false);
                builder.sort('timedb', true);
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
        path: '/notification/delete-all',
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
                db.collection('notification').remove().make((builder) => {
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
//# sourceMappingURL=notification.js.map