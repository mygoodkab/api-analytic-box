import * as db from '../nosql-util';
import { Util } from '../util';
const objectid = require('objectid');
const Joi = require('joi')
const crypto = require('crypto');

module.exports = [

    { // insert  record
        method: 'POST',
        path: '/analytics-record/record',
        config: {
            tags: ['api'],
            description: 'analytics record data and return hash',
            notes: 'analytics record data and return hash',
            validate: {
                payload: {
                    ts: Joi.string().required(),
                    dockerNickname: Joi.string().required(),
                    outputType: Joi.string().required(),
                    metadata: Joi.any()
                }
            }
        },
        handler: (request, reply) => {
            const id = objectid()
            const payload = request.payload;
            payload.id = id
            if (payload) {
                const hash = crypto.createHmac('sha256', JSON.stringify(payload))
                    .digest('hex');
                db.collection('analytics-record').insert(payload).callback((err) => {
                    if (err) {
                        return reply({
                            statusCode: 400,
                            msg: "Bad Request",
                            data: err
                        })
                    } else {
                        return reply({
                            statusCode: 200,
                            msg: "OK Insert success",
                            data: hash
                        })
                    }
                })
            } else {
                return reply({
                    statusCode: 400,
                    msg: "Bad Request",
                    data: "No data in payload"
                })
            }

        }

    },
    { // Get analytic-record
        method: 'GET',
        path: '/analytics-record/get',
        config: {
            tags: ['api'],
            description: 'Get analytics record data',
            notes: 'Get analytics record data and',

        },
        handler: (request, reply) => {
            db.collection('analytics-record').find().make((builder) => {
                builder.callback((err, res) => {
                    if (err) {
                        return reply({
                            statusCode: 400,
                            msg: "Bad Request",
                            data: err
                        })
                    } else {
                        return reply({
                            statusCode: 200,
                            msg: "OK",
                            data: res

                        })
                    }
                })
            })

        }
    },
    { // Delete all
        method: 'POST',
        path: '/analytics-record/delete-all',
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
        handler:  (request, reply) => {
            if (request.payload.pass == "pass") {
                db.collection('analytics-record').remove().make((builder) => {
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
            }else{
                return reply({
                    statusCode: 400,
                    msg: "Bad request"
                })
            }

        }
    }
]