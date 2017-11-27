import * as db from '../nosql-util';
const Joi = require('joi');
const objectid = require('objectid');
module.exports = [
    {
        method: "GET",
        path: "/network",
        config: {
            tags: ['api'],
            description: 'Get network config',
            notes: 'Get network config'
        },
        handler: (request, reply) => {
            db.collection('network').find().make((builder: any) => {
                builder.callback((err: any, res: any) => {
                    if (err) {
                        return reply({
                            statusCode: 400,
                            message: "Bad Request",
                            data: "No payload"
                        })
                    } else {
                        return reply({
                            statusCode: 200,
                            message: "OK",
                            data: res
                        })
                    }

                })

            })
        }

    },
    {
        method: 'POST',
        path: '/network/insert',
        config: {
            tags: ['api'],
            description: 'Insert network',
            notes: 'Insert network ',
            validate: {
                payload: {
                    subnetMask: Joi.string().required(),
                    staticIp: Joi.string().required(),
                    gateway: Joi.string().required(),
                }
            }
        },
        handler: function (request, reply) {
            if (request.payload) {
                request.payload._id = objectid();
                db.collection('network').insert(request.payload)
                return reply({
                    statusCode: 200,
                    message: "OK",
                    data: "Insert Succeed"
                })
            } else return reply({
                statusCode: 400,
                message: "Bad Request",
                data: "No payload"
            })
        }
    },
    {
        method: "POST",
        path: "/network/update",
        config: {
            tags: ['api'],
            description: 'Insert image',
            notes: 'Insert image ',
            validate: {
                payload: {
                    _id: Joi.string().required(),
                    subnetMask: Joi.string(),
                    staticIp: Joi.string(),
                    gateway: Joi.string(),
                }
            }
        },
        handler: (request, reply) => {
            db.collection('network').modify(request.payload).make((builder: any) => {
                builder.where("_id", request.payload._id);
                builder.callback((err: any, res: any) => {
                    if (err) {
                        return reply({
                            statusCode: 400,
                            message: "Bad Request",
                            data: "No payload"
                        })
                    } else {
                        return reply({
                            statusCode: 200,
                            message: "OK",
                            data: "Update Success"
                        })
                    }

                })
            })

        }
    },
    {
        method: 'POST',
        path: '/network/delete',
        config: {
            tags: ['api'],
            description: 'Delete network data',
            notes: 'Delete  network data',
            validate: {
                payload: {
                    _id: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => {
            db.collection('network').remove().make((builder: any) => {
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
];