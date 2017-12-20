import * as db from '../nosql-util';
const { Util } = require('../util');
const Joi = require('joi')
const JWT = require('jsonwebtoken');
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
        handler: (request, reply) => {
            db.collection('users').find().make((builder: any) => {
                builder.where("username", request.payload.username);
                builder.where("password", request.payload.password);
                builder.first()
                builder.callback((err: any, res: any) => {
                    var userInfo = encodeURIComponent(JSON.stringify(res));
                    if (!res) {
                        return reply({
                            statusCode: 400,
                            message: "Invaild username or password",
                        })
                    } else {
                        return reply({
                            statusCode: 200,
                            message: "Login success",
                            //data: JWT.sign(userInfo, Util.SECRET_KEY)
                        })
                    }
                });
            });
        }
    }

]