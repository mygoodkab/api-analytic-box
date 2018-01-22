import * as db from '../nosql-util';
const debug = require('debug');
const objectid = require('objectid');
const Joi = require('joi')
var a = require('debug')('worker:a')
var error = debug('app:error');

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
                    return reply({
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
                    return reply({
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

            // error('goes to stderr!');
            // var log = debug('worker:a');
            // log.log = console.log.bind(console); 
            // log('goes to stdout');
            // error('still goes to stderr!');
            // debug.log = console.info.bind(console);
            // error('now goes to stdout via console.info');
            // log('still goes to stdout, but via console.info now');
            // log('start....')

            if (request.payload) {
              //  log('before query')
                request.payload._id = objectid();
                db.collectionServer('users').find().make((builder: any) => {
                    builder.where('username', request.payload.username);
                    builder.callback((err, res) => {
                     //   log('after query')
                        if (res.length != 0) { // duplicate username 
                        //    log('condition nodata')
                            return reply({
                                statusCode: 400,
                                message: "username's duplicate",

                            })
                        } else {
                         //   log('condition data')
                            db.collectionServer('users').insert(request.payload)
                        //    log('insert data')
                            return reply({
                                statusCode: 200,
                                message: "OK",
                                data: res
                            })
                        }
                    })
                })
            } else return reply({
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
                        return reply({
                            statusCode: 200,
                            message: "OK",
                            data: "Update Succeed"
                        })
                    });
                })
            } else {
                return reply({
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
                        return reply({
                            statusCode: 500,
                            message: "Can't delete id : " + request.payload._id,
                        })
                    } else {
                        return reply({
                            statusCode: 200,
                            message: "OK",
                        })
                    }

                });
            });
        }
    }
] 