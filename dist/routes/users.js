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
const Boom = require("boom");
const util_1 = require("../util");
const debug = require('debug');
const objectid = require('objectid');
const Joi = require('joi');
var a = require('debug')('worker:a');
const { MONGODB } = require('../util');
module.exports = [
    {
        method: 'GET',
        path: '/users',
        config: {
            tags: ['api'],
            description: 'Select all user ',
            notes: 'Select all user '
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            let dbm = util_1.Util.getDb(request);
            try {
                const res = yield dbm.collection('user').find().toArray();
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: res
                });
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
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
            db.collectionServer('users').find().make((builder) => {
                builder.where('_id', request.params.id);
                builder.callback((err, res) => {
                    reply({
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
                db.collectionServer('users').find().make((builder) => {
                    builder.where('username', request.payload.username);
                    builder.callback((err, res) => {
                        if (res.length != 0) {
                            reply({
                                statusCode: 400,
                                message: "username's duplicate",
                            });
                        }
                        else {
                            db.collectionServer('users').insert(request.payload);
                            reply({
                                statusCode: 200,
                                message: "OK",
                                data: res
                            });
                        }
                    });
                });
            }
            else
                reply({
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
                db.collectionServer('users').modify(request.payload).make(function (builder) {
                    builder.where("_id", request.payload._id);
                    builder.callback(function (err, res) {
                        reply({
                            statusCode: 200,
                            message: "OK",
                            data: "Update Succeed"
                        });
                    });
                });
            }
            else {
                reply({
                    statusCode: 400,
                    message: "Bad Request",
                    data: "No payload"
                });
            }
        }
    },
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
            db.collectionServer('users').remove().make((builder) => {
                builder.where("_id", request.payload._id);
                builder.callback((err, res) => {
                    if (err) {
                        reply({
                            statusCode: 500,
                            message: "Can't delete id : " + request.payload._id,
                        });
                    }
                    else {
                        reply({
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