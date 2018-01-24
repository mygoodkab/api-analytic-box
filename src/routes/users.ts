import * as db from '../nosql-util';
const debug = require('debug');
const objectid = require('objectid');
const Joi = require('joi')
var a = require('debug')('worker:a')

module.exports = [
    {  // Select all user
        method: 'GET',
        path: '/users',
        config: {
            tags: ['api'],
            description: 'Select all user ',
            notes: 'Select all user '
        },
        handler: function (request, reply) {
            db.collectionServer('users').find().make((builder: any) => {
                builder.callback((err: any, res: any) => {
                    reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    })
                })
            })
        }
    },
    {  // Select id user
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
            db.collectionServer('users').find().make((builder: any) => {
                builder.where('_id', request.params.id)
                builder.callback((err: any, res: any) => {
                    reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    })
                })
            })
        }
    },
    {  // Insert user profile
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
            // a('start....')

            if (request.payload) {
                 
                 // a('before query')
                request.payload._id = objectid();
                db.collectionServer('users').find().make((builder: any) => {
                    builder.where('username', request.payload.username);
                    builder.callback((err, res) => {
                           //a('after query')
                        if (res.length != 0) { // duplicate username 
                                //a('condition nodata')
                            reply({
                                statusCode: 400,
                                message: "username's duplicate",

                            })
                        } else {
                               //a('condition data')
                            db.collectionServer('users').insert(request.payload)
                               // a('insert data')
                            reply({
                                statusCode: 200,
                                message: "OK",
                                data: res
                            })
                        }
                    })
                })
            } else reply({
                statusCode: 400,
                message: "Bad Request",
                data: "No payload"
            })
        }

    },
    {  // Change password
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
                        })
                    });
                })
            } else {
                reply({
                    statusCode: 400,
                    message: "Bad Request",
                    data: "No payload"
                })
            }
        }
    },
    {  // Delete 
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
            db.collectionServer('users').remove().make((builder: any) => {
                builder.where("_id", request.payload._id)
                builder.callback((err: any, res: any) => {
                    if (err) {
                        reply({
                            statusCode: 500,
                            message: "Can't delete id : " + request.payload._id,
                        })
                    } else {
                        reply({
                            statusCode: 200,
                            message: "OK",
                        })
                    }

                });
            });
        }
    }
] 