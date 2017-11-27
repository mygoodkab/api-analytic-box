"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db = require("../nosql-util");
const Joi = require('joi');
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
            db.collection('users').find().make((builder) => {
                builder.where("username", request.payload.username);
                builder.where("password", request.payload.password);
                builder.callback((err, res) => {
                    if (res.length == 0) {
                        return reply({
                            statusCode: 200,
                            message: "Invaild username or password",
                        });
                    }
                    else {
                        return reply({
                            statusCode: 200,
                            message: "Login success",
                        });
                    }
                });
            });
        }
    }
];
//# sourceMappingURL=login.js.map