import * as db from '../nosql-util';
const Joi = require('joi')
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
                builder.callback((err: any, res: any) => {
                    if (res.length==0) {
                        return reply({
                            statusCode: 400,
                            message: "Invaild username or password",
                        })
                    }else{
                        return reply({
                            statusCode: 200,
                            message: "Login success",
                        })
                    }

                });
            });
        }
    }
 
]