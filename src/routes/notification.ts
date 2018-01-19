import * as db from '../nosql-util';
const objectid = require('objectid');
const Joi = require('joi')
module.exports = [
    {  // select all rule
        method: 'GET',
        path: '/notification',
        config: {
            tags: ['api'],
            description: 'Select all notification  ',
            notes: 'Select all notification '
        },
        handler: function (request, reply) {
            db.collection('notification').find().make((builder: any) => {
                builder.callback((err: any, res: any) => {
                    if (res.length == 0) {
                        return reply({
                            statusCode: 500,
                            message: "No data",
                            data: "-"
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
    {  // select rule by rule id
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
            db.collection('notification').find().make((builder: any) => {
                builder.where('dockerNickname', request.params.dockerNickname)
                builder.sort('timedb', true)
                builder.callback((err: any, res: any) => {
                    if (!res) {
                        return reply({
                            statusCode: 500,
                            message: "No data",
                            data: "-"
                        })
                    } else {
                        return reply({
                            statusCode: 200,
                            message: "OK",
                            data: res
                        })
                    }

                });
            });
        }
    },
    {  // select rule by dockerNickname and statusRead is false 
        method: 'GET',
        path: '/notification/new/{dockerNickname}',
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
            db.collection('notification').find().make((builder: any) => {
                builder.where('dockerNickname', request.params.dockerNickname)
                builder.where('statusRead', false)
                builder.sort('timedb', true)
                builder.callback((err: any, res: any) => {
                    if (!res) {
                        return reply({
                            statusCode: 500,
                            message: "No data",
                            data: "-"
                        })
                    } else {
                        return reply({
                            statusCode: 200,
                            message: "OK",
                            data: res
                        })
                    }

                });
            });
        }
    },
    {  // select lastest rule by rule id
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
            db.collection('notification').find().make((builder: any) => {
                builder.where('dockerNickname', request.params.dockerNickname)
                builder.sort('timedb', true)
                builder.first()
                builder.callback((err: any, res: any) => {
                    if (!res) {
                        return reply({
                            statusCode: 500,
                            message: "No data",
                            data: "-"
                        })
                    } else {
                        return reply({
                            statusCode: 200,
                            message: "OK",
                            data: res
                        })
                    }

                });
            });
        }
    },
    { // Delete all
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
                            })
                        } else {
                            return reply({
                                statusCode: 200,
                                msg: "OK"
                            })
                        }
                    })
                })
            } else {
                return reply({
                    statusCode: 400,
                    msg: "Bad request"
                })
            }

        }
    }
]