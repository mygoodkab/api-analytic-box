import * as db from '../nosql-util';
import * as  Boom from 'boom'
import { Util } from '../util';
const Joi = require('joi')
const JWT = require('jsonwebtoken');
const mongoObjectId = require('mongodb').ObjectId;
const { MONGODB } = require('../util')
module.exports = [
    {
        method: 'POST',
        path: '/login',
        config: {
            tags: ['api'],
            description: 'Check login',
            notes: 'Check login',
            validate: {
                payload: {
                    username: Joi.string().required(),
                    password: Joi.string().required(),
                }
            }
        },
        handler: async (request, reply) => {
            let mongo = Util.getDb(request)
            try {
                const login = await mongo.collection('users').findOne({ username: request.payload.username, password: request.payload.password })
                if (login) {
                    reply({
                        statusCode: 200,
                        message: "Login success",
                        //data: JWT.sign(userInfo, Util.SECRET_KEY)
                    })
                } else {
                    reply(Boom.notFound("Invaild username or password"))
                }
            } catch (error) {
                reply(Boom.badGateway(error))
            }

        }
    }

]