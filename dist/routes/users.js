"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db = require("../nosql-util");
const objectid = require('objectid');
const Joi = require('joi');
module.exports = [
    {
        method: 'GET',
        path: '/users',
        config: {
            tags: ['api'],
            description: 'Select all user ',
            notes: 'Select all user '
        },
        handler: function (request, reply) {
            db.collection('users').find().make((builder) => {
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
        path: '/users/{id}',
        config: {
            tags: ['api'],
            description: 'Select user data by id',
            notes: 'Select user data by id',
            validate: {
                params: {
                    id: Joi.string().required().description('id user != username'),
                }
            }
        },
        handler: function (request, reply) {
            db.collection('users').find().make((builder) => {
                builder.where('_id', request.params.id);
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
        path: '/users/insert',
        config: {
            tags: ['api'],
            description: 'Insert user data',
            notes: 'Insert user data',
            validate: {
                payload: {
                    username: Joi.string().required(),
                    password: Joi.string().required(),
                    type: Joi.string()
                }
            }
        },
        handler: function (request, reply) {
            if (request.payload) {
                request.payload._id = objectid();
                db.collection('users').find().make((builder) => {
                    builder.where('username', request.payload.username);
                    builder.callback((err, res) => {
                        if (res.length != 0) {
                            return reply({
                                statusCode: 400,
                                message: "username's duplicate",
                            });
                        }
                        else {
                            db.collection('users').insert(request.payload);
                            return reply({
                                statusCode: 200,
                                message: "OK",
                                data: res
                            });
                        }
                    });
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
        path: '/users/update',
        config: {
            tags: ['api'],
            description: 'Change password',
            notes: 'Change password',
            validate: {
                payload: {
                    _id: Joi.string().required(),
                    password: Joi.string(),
                }
            }
        },
        handler: function (request, reply) {
            if (request.payload) {
                db.collection('users').modify(request.payload).make(function (builder) {
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
    ,
    {
        method: 'POST',
        path: '/users/delete',
        config: {
            tags: ['api'],
            description: 'Delete users data',
            notes: 'Delete  users data',
            validate: {
                payload: {
                    _id: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => {
            db.collection('users').remove().make((builder) => {
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
//# sourceMappingURL=users.js.map