"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db = require("../nosql-util");
const { Util } = require('../util');
const Joi = require('joi');
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
            db.collectionServer('users').find().make((builder) => {
                builder.where("username", request.payload.username);
                builder.where("password", request.payload.password);
                builder.first();
                builder.callback((err, res) => {
                    var userInfo = encodeURIComponent(JSON.stringify(res));
                    if (!res) {
                        reply({
                            statusCode: 400,
                            message: "Invaild username or password",
                        });
                    }
                    else {
                        reply({
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