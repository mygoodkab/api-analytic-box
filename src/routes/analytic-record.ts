import * as db from '../nosql-util';
import { Util } from '../util';
const objectid = require('objectid');
const Joi = require('joi')
const crypto = require('crypto');

module.exports = [

    { // Get all record
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

    }
]