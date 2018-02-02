import * as db from '../nosql-util';
import * as  Boom from 'boom'
import { Util } from '../util';
const debug = require('debug');
const objectid = require('objectid');
const Joi = require('joi')
var a = require('debug')('worker:a')
const { MONGODB } = require('../util')
const mongoObjectId = require('mongodb').ObjectId;
module.exports = [
    {  // Select all user
        method: 'GET',
        path: '/users',
        config: {
            tags: ['api'],
            description: 'Select all user ',
            notes: 'Select all user '
        },
        handler: async (request, reply) => {
            let dbm = Util.getDb(request)
            try {
                const res = await dbm.collection('users').find().toArray()
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
        handler: async (request, reply) => {
            let dbm = Util.getDb(request)
            try {
                const res = await dbm.collection('users').findOne({ _id: mongoObjectId(request.params.id) })
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
        handler: async (request, reply) => {
            // a('start....')
            let dbm = Util.getDb(request)
            try {
                const resUser = await dbm.collection('users').findOne({ username: request.payload.username })
                if (!resUser) {
                    const insertUser = await dbm.collection('users').insertOne(request.payload)
                    reply({
                        statusCode: 200,
                        message: "OK",
                    })
                } else {
                    reply({
                        statusCode: 400,
                        message: "username's duplicate",
                    })
                }
            } catch (error) {
                reply(Boom.badGateway(error))
            }
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
        handler: async (request, reply) => {
            let dbm = Util.getDb(request)
            try {
                const res = await dbm.collection('users').findOne({ _id: mongoObjectId(request.payload._id) })
                if (res) {
                    const update = await dbm.collection('users').updateOne({ _id: mongoObjectId(request.payload._id) }, { $set: {password:request.payload.password} })
                    reply({
                        statusCode: 200,
                        message: "OK",
                    })

                } else {
                    reply(Boom.notFound)
                }

            } catch (error) {
                reply(Boom.badGateway(error))
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
        handler: async (request, reply) => {
            let dbm = Util.getDb(request)
            try {
                const del = await dbm.collection('users').deleteOne({ _id: mongoObjectId(request.payload._id) })
                reply({
                    statusCode: 200,
                    message: "OK",
                })
            } catch (error) {
                reply(Boom.badGateway(error))
            }
        }
    }
] 