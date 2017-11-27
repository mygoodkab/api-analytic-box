"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db = require("../nosql-util");
const moment = require('moment');
const objectid = require('objectid');
const Joi = require('joi');
module.exports = [
    {
        method: 'GET',
        path: '/performance',
        config: {
            tags: ['api'],
            description: 'Get performance data',
            notes: 'Get performance data'
        },
        handler: (request, reply) => {
            db.collection('performance').find().make((builder) => {
                builder.callback((err, res) => {
                    return reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    });
                });
            });
        }
    },
    {
        method: 'GET',
        path: '/performance/latest',
        config: {
            tags: ['api'],
            description: 'Get performance latest data',
            notes: 'Get performance latest data'
        },
        handler: (request, reply) => {
            db.collection('performance').find().make((builder) => {
                builder.sort("time", false);
                builder.callback((err, res) => {
                    return reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    });
                });
            });
        }
    },
    {
        method: 'POST',
        path: '/performance/insert',
        config: {
            tags: ['api'],
            description: 'Insert performance data',
            notes: 'Insert performance data',
            validate: {
                payload: {
                    cpu: Joi.number().required(),
                    memory: Joi.number().required(),
                    disk: Joi.number().required(),
                    total: Joi.number().required(),
                    storage: Joi.number().required()
                }
            }
        },
        handler: function (request, reply) {
            if (request.payload) {
                request.payload._id = objectid();
                request.payload.time = moment().valueOf();
                db.collection('performance').insert(request.payload);
                return reply({
                    statusCode: 200,
                    message: "OK",
                    data: "Insert Succeed"
                });
            }
            else
                return reply({
                    statusCode: 400,
                    message: "Bad Request",
                    data: "No payload"
                });
        }
    },
    {
        method: 'POST',
        path: '/performance/update',
        config: {
            tags: ['api'],
            description: 'Update performance data',
            notes: 'Update performance data',
            validate: {
                payload: {
                    _id: Joi.string().required(),
                    memory: Joi.number(),
                    cpu: Joi.number(),
                    disk: Joi.number(),
                    total: Joi.number(),
                    storage: Joi.number()
                }
            }
        },
        handler: function (request, reply) {
            if (request.payload) {
                db.collection('performance').modify(request.payload).make(function (builder) {
                    builder.where("_id", request.payload._id);
                    builder.callback(function (err, res) {
                        return reply({
                            statusCode: 200,
                            message: "OK",
                            data: "Update Succeed"
                        });
                    });
                });
            }
            else {
                return reply({
                    statusCode: 400,
                    message: "Bad Request",
                    data: "No payload"
                });
            }
        }
    }
];
//# sourceMappingURL=perfomance.js.map