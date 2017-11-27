"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db = require("../nosql-util");
const objectid = require('objectid');
const Joi = require('joi');
module.exports = [
    {
        method: 'GET',
        path: '/cctv',
        config: {
            tags: ['api'],
            description: 'Get All cctv data',
            notes: 'Get All cctv data'
        },
        handler: (request, reply) => {
            db.collection('cctv').find().make((builder) => {
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
        path: '/cctv/{_id}',
        config: {
            tags: ['api'],
            description: 'Get id cctv data',
            notes: 'Get id cctv data',
            validate: {
                params: {
                    _id: Joi.string()
                        .required()
                }
            }
        },
        handler: (request, reply) => {
            db.collection('cctv').find().make((builder) => {
                builder.where("_id", request.params._id);
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
        path: '/cctv/insert',
        config: {
            tags: ['api'],
            description: 'Insert cctv data',
            notes: 'Insert cctv data',
            validate: {
                payload: {
                    format: Joi.string().required(),
                    brand: Joi.string().required(),
                    model: Joi.string().required(),
                }
            }
        },
        handler: (request, reply) => {
            if (request.payload) {
                request.payload._id = objectid();
                db.collection('cctv').insert(request.payload);
                return reply({
                    statusCode: 200,
                    message: "OK",
                    data: "cctv Succeed"
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
        path: '/cctv/update',
        config: {
            tags: ['api'],
            description: 'Update cctv data',
            notes: 'Update cctv data',
            validate: {
                payload: {
                    _id: Joi.string().required(),
                    format: Joi.string(),
                    brand: Joi.string(),
                    model: Joi.string(),
                }
            }
        },
        handler: function (request, reply) {
            if (request.payload) {
                db.collection('cctv').modify(request.payload).make(function (builder) {
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
    },
    {
        method: 'POST',
        path: '/cctv/delete',
        config: {
            tags: ['api'],
            description: 'Delete cctv data',
            notes: 'Delete  cctv data',
            validate: {
                payload: {
                    _id: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => {
            db.collection('cctv').remove().make((builder) => {
                builder.where("_id", request.payload._id);
                builder.callback((err, res) => {
                    if (err) {
                        return reply({
                            statusCode: 500,
                            message: "Can't delete id : " + request.payload._id,
                        });
                    }
                    else {
                        return reply({
                            statusCode: 200,
                            message: "OK",
                        });
                    }
                });
            });
        }
    }
];
//# sourceMappingURL=cctv.js.map