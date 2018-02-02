import * as db from '../nosql-util';
import { Util } from '../util';
import * as  Boom from 'boom'
const objectid = require('objectid');
const Joi = require('joi')
const { MONGODB } = require('../util')
const mongoObjectId = require('mongodb').ObjectId;
module.exports = [
    {  // select all notification
        method: 'GET',
        path: '/notification',
        config: {
            tags: ['api'],
            description: 'Select all notification  ',
            notes: 'Select all notification '
        },
        handler: async (request, reply) => {
            let dbm = Util.getDb(request)
            try {
                const res = await dbm.collection('notification').find({ isHide: false }).sort({ timedb: -1 }).toArray()
                if (res.length == 0) {
                    reply(Boom.notFound)
                } else {
                    reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    })
                }
            } catch (error) {
                reply(Boom.badGateway(error))
            }
        }
    },
    {  // select notification by id  
        method: 'GET',
        path: '/notification/{id}',
        config: {
            tags: ['api'],
            description: 'Get id notification data',
            notes: 'Get id notification data',
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
                const res = await dbm.collection('notification').findOne({ _id: mongoObjectId(request.params.id) })
                if (res) {
                    reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    })
                } else {
                    reply(Boom.notFound)
                }
            } catch (error) {
                reply(Boom.badGateway(error))
            }
        }
    },
    {  // select notification by dockerNickname id
        method: 'GET',
        path: '/notification/sort-dockerNickname/{dockerNickname}',
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
        handler: async (request, reply) => {

            let dbm = Util.getDb(request)
            try {
                const res = await dbm.collection('notification').find({ dockerNickname: request.params.dockerNickname }).sort({ timedb: -1 }).toArray()
                if (res) {
                    reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    })
                } else {
                    reply(Boom.notFound)
                }
            } catch (error) {
                reply(Boom.badGateway(error))
            }
        }
    },
    {  // select notification by dockerNickname and isRead is false 
        method: 'GET',
        path: '/notification/sort-statusRead/{dockerNickname}',
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
        handler: async (request, reply) => {

            let dbm = Util.getDb(request)
            try {
                const res = await dbm.collection('notification').find({ dockerNickname: request.params.dockerNickname, isRead: false }).sort({ timedb: -1 }).toArray()
                if (res) {
                    reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    })
                } else {
                    reply(Boom.notFound)
                }
            } catch (error) {
                reply(Boom.badGateway(error))
            }
        }
    },
    {  // select lastest notification by dockerNickname id
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
        handler: async (request, reply) => {

            let dbm = Util.getDb(request)
            try {
                const res = await dbm.collection('notification').find({ dockerNickname: request.params.dockerNickname, isRead: false }).sort({ timedb: -1 }).limit(1).toArray()
                if (res) {
                    reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    })
                } else {
                    reply(Boom.notFound)
                }
            } catch (error) {
                reply(Boom.badGateway(error))
            }
        }
    },
    {  // HIDE Notification 
        method: 'POST',
        path: '/notification/hide',
        config: {
            tags: ['api'],
            description: 'hide notification',
            notes: 'hide notification',
            validate: {
                payload: {
                    id: Joi.string().required(),
                }
            }
        },
        handler: async(request, reply) => {
            let dbm = Util.getDb(request)
            try {
                const update = await dbm.collection("notification").updateOne({ _id: mongoObjectId(request.payload.id) }, { $set: { isHide: true } })
                reply({
                    statusCode: 200,
                    message: "Update success",
                })
            } catch (error) {
                reply(Boom.badGateway(error))
            }
        }

    },
    {  // select notification by dockerNickname and isHide is false 
        method: 'GET',
        path: '/notification/sort-hide/{dockerNickname}',
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
        handler: async(request, reply) => {
            let dbm = Util.getDb(request)
            try {
                const res =  await dbm.collection("notification").find({ dockerNickname: request.params.dockerNickname, isHide: false }).sort({ timedb: -1 }).toArray()
                if (res) {
                    reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    })
                } else {
                    reply(Boom.notFound)
                }
            } catch (error) {
                reply(Boom.badGateway(error))
            }
        }
    },
    {  // insert notification 
        method: 'POST',
        path: '/notification/insert',
        config: {
            tags: ['api'],
            description: 'insert notification data',
            notes: 'insert notification data',
            validate: {
                payload: {
                    dockerNickname: Joi.object()
                }
            }
        },
        handler: async(request, reply) => {
            let dbm = Util.getDb(request)
            try {
                const insertAnalyticsRecord = await dbm.collection('analytics-record').insertOne(request.payload)

                reply({
                    statusCode: 200,
                    message: "OK",
                })

            } catch (error) {
                reply(Boom.badGateway(error))
            }
        }
    },

    // //===============================================================================================================

    // {  // select all notification
    //     method: 'GET',
    //     path: '/notification/nosql',
    //     config: {
    //         tags: ['api'],
    //         description: 'Select all notification  ',
    //         notes: 'Select all notification '
    //     },
    //     handler: function (request, reply) {
    //         db.collection('notification').find().make((builder: any) => {
    //             builder.where('isHide', false)
    //             builder.sort('timedb', true)
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
    // {  // select notification by id  
    //     method: 'GET',
    //     path: '/notification/{id}',
    //     config: {
    //         tags: ['api'],
    //         description: 'Get id notification data',
    //         notes: 'Get id notification data',
    //         validate: {
    //             params: {
    //                 id: Joi.string()
    //                     .required()
    //             }
    //         }
    //     },
    //     handler: (request, reply) => {
    //         db.collection('notification').find().make((builder: any) => {
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
    // {  // select notification by rule id
    //     method: 'GET',
    //     path: '/notification/sort-dockerNickname/{dockerNickname}',
    //     config: {
    //         tags: ['api'],
    //         description: 'Get id notification data',
    //         notes: 'Get id notification data',
    //         validate: {
    //             params: {
    //                 dockerNickname: Joi.string()
    //                     .required()
    //             }
    //         }
    //     },
    //     handler: (request, reply) => {
    //         db.collection('notification').find().make((builder: any) => {
    //             builder.where('dockerNickname', request.params.dockerNickname)
    //             builder.sort('timedb', true)
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
    // {  // select notification by dockerNickname and isRead is false 
    //     method: 'GET',
    //     path: '/notification/sort-statusRead/{dockerNickname}',
    //     config: {
    //         tags: ['api'],
    //         description: 'Get id notification data',
    //         notes: 'Get id notification data',
    //         validate: {
    //             params: {
    //                 dockerNickname: Joi.string()
    //                     .required()
    //             }
    //         }
    //     },
    //     handler: (request, reply) => {
    //         db.collection('notification').find().make((builder: any) => {
    //             builder.where('dockerNickname', request.params.dockerNickname)
    //             builder.where('isRead', false)
    //             builder.sort('timedb', true)
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
    // {  // select lastest notification by rule id
    //     method: 'GET',
    //     path: '/notification/lastest/{dockerNickname}',
    //     config: {
    //         tags: ['api'],
    //         description: 'Get lastest dockerNickname notification data ',
    //         notes: 'Get  lastest dockerNickname notification data',
    //         validate: {
    //             params: {
    //                 dockerNickname: Joi.string().required()
    //             }
    //         }
    //     },
    //     handler: (request, reply) => {
    //         db.collection('notification').find().make((builder: any) => {
    //             builder.where('dockerNickname', request.params.dockerNickname)
    //             builder.sort('timedb', true)
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
    // {  // HIDE Notification 
    //     method: 'POST',
    //     path: '/notification/hide',
    //     config: {
    //         tags: ['api'],
    //         description: 'hide notification',
    //         notes: 'hide notification',
    //         validate: {
    //             payload: {
    //                 id: Joi.string().required(),
    //             }
    //         }
    //     },
    //     handler: (request, reply) => {
    //         db.collection('notification').find().make((builder) => {
    //             builder.where('id', request.payload.id)
    //             builder.first()
    //             builder.callback((err, res) => {
    //                 if (err) {
    //                     reply({
    //                         statusCode: 400,
    //                         msg: "Bad request"
    //                     })
    //                 } else {
    //                     db.collection('notification').modify({ isHide: true }).make((builder) => {
    //                         builder.where('id', request.payload.id)
    //                         builder.callback((err, res) => {
    //                             if (err) {
    //                                 reply({
    //                                     statusCode: 400,
    //                                     msg: "Bad request"
    //                                 })
    //                             } else {
    //                                 reply({
    //                                     statusCode: 200,
    //                                     msg: "OK"
    //                                 })
    //                             }
    //                         })
    //                     })
    //                 }
    //             })
    //         })
    //     }

    // },
    // {  // select notification by dockerNickname and isHide is false 
    //     method: 'GET',
    //     path: '/notification/sort-hide/{dockerNickname}',
    //     config: {
    //         tags: ['api'],
    //         description: 'Get id notification data',
    //         notes: 'Get id notification data',
    //         validate: {
    //             params: {
    //                 dockerNickname: Joi.string()
    //                     .required()
    //             }
    //         }
    //     },
    //     handler: (request, reply) => {
    //         db.collection('notification').find().make((builder: any) => {
    //             builder.where('dockerNickname', request.params.dockerNickname)
    //             builder.where('isHide', false)
    //             builder.sort('timedb', true)
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
    // { // Delete all
    //     method: 'POST',
    //     path: '/notification/delete-all',
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
    //             db.collection('notification').remove().make((builder) => {
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
    // }
]