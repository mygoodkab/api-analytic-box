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
                const res = await dbm.collection('rules').findOne({ dockerNickname: request.params.id })
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
                metadata: payload.metadata,
            }
            try {
                console.log("++++++++++++++++++++++++++++++++++++++")
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
    //========================================================================================================================//
    // {  // select all rule
    //     method: 'GET',
    //     path: '/rules',
    //     config: {
    //         tags: ['api'],
    //         description: 'Select all rules ',
    //         notes: 'Select all rules '
    //     },
    //     handler: function (request, reply) {
    //         db.collection('rules').find().make((builder: any) => {
    //             builder.callback((err: any, res: any) => {
    //                 if (res.length == 0) {
    //                     reply({
    //                         statusCode: 500,
    //                         message: "No data",
    //                         data: "-"
    //                     })
    //                 } else {
    //                     reply({
    //                         statusCode: 200,
    //                         message: "OK",
    //                         data: res
    //                     })
    //                 }

    //             })
    //         })
    //     }
    // },
    // {  // select rule by rule id
    //     method: 'GET',
    //     path: '/rules/{id}',
    //     config: {
    //         tags: ['api'],
    //         description: 'Get id rules data',
    //         notes: 'Get id rules data',
    //         validate: {
    //             params: {
    //                 id: Joi.string()
    //                     .required()
    //                     .description('id feature'),
    //             }
    //         }
    //     },
    //     handler: (request, reply) => {
    //         db.collection('rules').find().make((builder: any) => {
    //             builder.where('id', request.params.id)
    //             builder.first()
    //             builder.callback((err: any, res: any) => {
    //                 if (!res) {
    //                     reply({
    //                         statusCode: 500,
    //                         message: "No data",
    //                         data: "-"
    //                     })
    //                 } else {
    //                     reply({
    //                         statusCode: 200,
    //                         message: "OK",
    //                         data: res
    //                     })
    //                 }

    //             });
    //         });
    //     }
    // },
    // {  // select rule by assignAnalytics id
    //     method: 'GET',
    //     path: '/rules/dockerNickname/{id}',
    //     config: {
    //         tags: ['api'],
    //         description: 'Get id rules data',
    //         notes: 'Get id rules data',
    //         validate: {
    //             params: {
    //                 id: Joi.string()
    //                     .required()
    //             }
    //         }
    //     },
    //     handler: (request, reply) => {
    //         db.collection('rules').find().make((builder: any) => {
    //             builder.where('dockerNickname', request.params.id)
    //             builder.first()
    //             builder.callback((err: any, res: any) => {
    //                 if (!res) {
    //                     reply({
    //                         statusCode: 500,
    //                         message: "No data",
    //                         data: "-"
    //                     })
    //                 } else {
    //                     reply({
    //                         statusCode: 200,
    //                         message: "OK",
    //                         data: res
    //                     })
    //                 }

    //             });
    //         });
    //     }
    // },
    // {  // insert rule
    //     method: 'POST',
    //     path: '/rules/insert',
    //     config: {
    //         tags: ['api'],
    //         description: 'Insert rules data',
    //         notes: 'Insert rules data',
    //         validate: {
    //             payload: {
    //                 dockerNickname: Joi.string().required(),
    //                 rule: Joi.array().required(),
    //             }
    //         }
    //     },
    //     handler: (request, reply) => {
    //         let payload = request.payload
    //         if (payload) {
    //             payload.id = objectid();
    //             let validate = payload.rule[0];
    //             if (typeof validate.type == "undefined" && typeof validate.day == "undefined" && typeof validate.timeStart == "undefined" && typeof validate.timeEnd == "undefined" && typeof validate.condition == "undefined") {
    //                 badRequest("Invaid  Payload")
    //             } else {
    //                 db.collection('rules').insert(request.payload).callback((err, res) => {
    //                     if (err) {
    //                         badRequest("can't insert")
    //                     } else {
    //                         reply({
    //                             statusCode: 200,
    //                             message: "OK",
    //                             data: "Create rule Succeed"
    //                         })
    //                     }
    //                 })
    //             }
    //         } else {
    //             badRequest("no payload")
    //         }

    //         function badRequest(msg) {
    //             reply({
    //                 statusCode: 400,
    //                 message: "Bad Request",
    //                 data: msg
    //             })
    //         }
    //     }
    // },
    // {  // delete rules
    //     method: 'POST',
    //     path: '/rules/delete-all',
    //     config: {
    //         tags: ['api'],
    //         description: 'delete all',
    //         notes: 'delete all',
    //         validate: {
    //             payload: {
    //                 pass: Joi.string().required(),
    //             }
    //         }
    //     },
    //     handler: (request, reply) => {
    //         if (request.payload.pass == "pass") {
    //             db.collection('rules').remove().make((builder) => {
    //                 builder.callback((err, res) => {
    //                     if (err) {
    //                         reply({
    //                             statusCode: 400,
    //                             msg: "Bad request"
    //                         })
    //                     } else {
    //                         reply({
    //                             statusCode: 200,
    //                             msg: "OK"
    //                         })
    //                     }
    //                 })
    //             })
    //         } else {
    //             reply({
    //                 statusCode: 400,
    //                 msg: "Bad request"
    //             })
    //         }

    //     }
    // },
    // {  // update  rules
    //     method: 'POST',
    //     path: '/rules/update',
    //     config: {
    //         tags: ['api'],
    //         description: 'Update rules data',
    //         notes: 'Update rules data',
    //         validate: {
    //             payload: {
    //                 id: Joi.string().required(),
    //                 dockerNickname: Joi.string().required(),
    //                 rule: Joi.array().required(),
    //             }
    //         }
    //     },
    //     handler: (request, reply) => {
    //         let payload = request.payload
    //         if (payload) {
    //             let validate = payload.rule[0];
    //             if (typeof validate.type == "undefined" && typeof validate.day == "undefined" && typeof validate.timeStart == "undefined" && typeof validate.timeEnd == "undefined" && typeof validate.condition == "undefined") {
    //                 badRequest("Invaid  Payload")
    //             } else {
    //                 db.collection('rules').modify(payload).make((builder) => {
    //                     builder.where('id', payload.id)
    //                     builder.callback((err, res) => {
    //                         if (err) {
    //                             badRequest("can't update ")
    //                         } else if (!res) {
    //                             badRequest("Can't find rule id " + payload.id)
    //                         } else {
    //                             reply({
    //                                 statusCode: 200,
    //                                 message: "OK",
    //                                 data: "Update rule Succeed"
    //                             })
    //                         }
    //                     })

    //                 })
    //             }
    //         } else {
    //             badRequest("no payload")
    //         }

    //         function badRequest(msg) {
    //             reply({
    //                 statusCode: 400,
    //                 message: "Bad Request",
    //                 data: msg
    //             })
    //         }
    //     }
    // },
    // {  // delete rules
    //     method: 'POST',
    //     path: '/rules/delete',
    //     config: {
    //         tags: ['api'],
    //         description: 'delete all',
    //         notes: 'delete all',
    //         validate: {
    //             payload: {
    //                 id: Joi.string().required(),
    //             }
    //         }
    //     },
    //     handler: (request, reply) => {
    //         db.collection('rules').remove().make((builder) => {
    //             builder.where('id', request.payload.id)
    //             builder.callback((err, res) => {
    //                 if (err) {
    //                     reply({
    //                         statusCode: 400,
    //                         msg: "Bad request"
    //                     })
    //                 } else {
    //                     reply({
    //                         statusCode: 200,
    //                         msg: "OK"
    //                     })
    //                 }
    //             })
    //         })
    //     }
    // },
]