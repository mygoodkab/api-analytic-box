import * as db from '../nosql-util';
import { Util } from '../util';
import * as  Boom from 'boom'
const objectid = require('objectid');
const Joi = require('joi')
const { MONGODB } = require('../util')
const mongoObjectId = require('mongodb').ObjectId;
module.exports = [
    {  // select all rule
        method: 'GET',
        path: '/rules',
        config: {
            tags: ['api'],
            description: 'Select all rules ',
            notes: 'Select all rules '
        },
        handler: async (request, reply) => {
            let dbm = Util.getDb(request)
            try {
                const res = await dbm.collection('rules').find().toArray()
                if (res.length > 0) {
                    reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    })
                } else {
                    reply(Boom.notFound("NO data"))
                }

            } catch (error) {
                reply(Boom.badGateway(error))
            }
        }
    },
    {  // select rule by rule id
        method: 'GET',
        path: '/rules/{id}',
        config: {
            tags: ['api'],
            description: 'Get id rules data',
            notes: 'Get id rules data',
            validate: {
                params: {
                    id: Joi.string()
                        .required()
                        .description('id feature'),
                }
            }
        },
        handler: async (request, reply) => {
            let dbm = Util.getDb(request)
            try {
                const res = await dbm.collection('rules').findOne({ _id: mongoObjectId(request.params.id) })
                if (res) {
                    reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    })
                } else {
                    reply(Boom.notFound("NO data"))
                }

            } catch (error) {
                reply(Boom.badGateway(error))
            }
        }
    },
    {  // select rule by assignAnalytics id
        method: 'GET',
        path: '/rules/dockerNickname/{id}',
        config: {
            tags: ['api'],
            description: 'Get id rules data',
            notes: 'Get id rules data',
            validate: {
                params: {
                    id: Joi.string()
                        .required()
                }
            }
        },
        handler: async (request, reply) => {
            let dbm = Util.getDb(request)
            try {
                const res = await dbm.collection('rules').find({ dockerNickname: request.params.id }).toArray()
                if (res.length != 0) {
                    reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    })
                } else {
                    reply(Boom.notFound("NO data"))
                }

            } catch (error) {
                reply(Boom.badGateway(error))
            }
        }
    },
    {  // insert rule
        method: 'POST',
        path: '/rules/insert',
        config: {
            tags: ['api'],
            description: 'Insert rules data',
            notes: 'Insert rules data',
            validate: {
                payload: {
                    dockerNickname: Joi.string().required(),
                    type: Joi.string().required(),
                    dayStart: Joi.string().required(),
                    dayEnd: Joi.string().required(),
                    timeStart: Joi.string().required(),
                    timeEnd: Joi.string().required(),
                    status: Joi.boolean().required(),
                    metadata: Joi.any()
                }
            }
        },
        handler: async (request, reply) => {
            let payload = request.payload
            let dbm = Util.getDb(request)
            try {
                const insert = await dbm.collection('rules').insertOne(payload)
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: "Create rule Success"
                })
            } catch (error) {
                reply(Boom.badGateway(error))
            }

        }
    },
    {  // update rules
        method: 'POST',
        path: '/rules/update',
        config: {
            tags: ['api'],
            description: 'Update rules data',
            notes: 'Update rules data',
            validate: {
                payload: {
                    _id: Joi.string().required(),
                    type: Joi.string().required(),
                    dayStart: Joi.string().required(),
                    dayEnd: Joi.string().required(),
                    timeStart: Joi.string().required(),
                    timeEnd: Joi.string().required(),
                    status: Joi.boolean().required(),
                    metadata: Joi.any()
                }
            }
        },
        handler: async (request, reply) => {
            let dbm = Util.getDb(request)
            let payload = request.payload
            let ruleUpdate = {
                type: payload.type,
                dayStart: payload.dayStart,
                dayEnd: payload.dayEnd,
                timeStart: payload.timeStart,
                timeEnd: payload.timeEnd,
                status: payload.status,
                metadata: payload.metadata,
            }
            try {
                const update = await dbm.collection('rules').updateOne({ _id: mongoObjectId(payload._id) }, { $set: ruleUpdate })
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: "Update rule Success"
                })
            } catch (error) {
                reply(Boom.badGateway(error))
            }
        }
    },
    {  // delete rules
        method: 'POST',
        path: '/rules/delete',
        config: {
            tags: ['api'],
            description: 'delete all',
            notes: 'delete all',
            validate: {
                payload: {
                    id: Joi.string().required(),
                }
            }
        },
        handler: async (request, reply) => {
            let dbm = Util.getDb(request)
            let payload = request.payload
            try {
                const del = await dbm.collection('rules').deleteOne({ _id: mongoObjectId(payload.id) })
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: "Delete rule Success"
                })
            } catch (error) {
                reply(Boom.badGateway(error))
            }
        }
    },
    { // delete rules by nickname 
        method: 'POST',
        path: '/rules/delete/nickname',
        config: {
            tags: ['api'],
            description: 'delete all',
            notes: 'delete all',
            validate: {
                payload: {
                    dockerNickname: Joi.string().required(),
                }
            }
        },
        handler: async (request, reply) => {
            let dbm = Util.getDb(request)
            let payload = request.payload
            try {
                const del = await dbm.collection('rules').deleteMany({ dockerNickname: payload.dockerNickname })
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: "Delete rule Success"
                })
            } catch (error) {
                reply(Boom.badGateway(error))
            }
        }
    }
]