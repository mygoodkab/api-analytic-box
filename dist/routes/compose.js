"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db = require("../nosql-util");
const objectid = require('objectid');
const Joi = require('joi');
module.exports = [
    {
        method: 'GET',
        path: '/compose/',
        config: {
            tags: ['api'],
            description: 'Get analytic offline in camera to start ',
            notes: 'Get analytic offline in camera to start',
        },
        handler: (request, reply) => {
            db.collection('assignAnalytics').find().make((builder) => {
                builder.callback((err, res) => {
                    if (res) {
                        let i = 1;
                        let analytic = [];
                        for (let data of res) {
                            let arrData = {
                                status: data.status,
                                dockerNickname: data.nickname,
                            };
                            analytic.push(arrData);
                            if (i == res.length) {
                                success(analytic);
                            }
                            i++;
                        }
                    }
                    else {
                        badrequest("no Data in payload");
                    }
                    function success(data) {
                        return reply({
                            statusCode: 200,
                            message: "OK",
                            data: data
                        });
                    }
                    function badrequest(msg) {
                        return reply({
                            statusCode: 400,
                            message: "Bad Request",
                            data: msg
                        });
                    }
                });
            });
        }
    },
    {
        method: 'GET',
        path: '/compose/errstop/{id}',
        config: {
            tags: ['api'],
            description: 'Get analytic in camera to start ',
            notes: 'Get analytic in camera to start',
            validate: {
                params: {
                    id: Joi.string()
                        .required()
                }
            }
        },
        handler: (request, reply) => {
            db.collection('assignAnalytics').modify({ status: "start" }).make((builder) => {
                builder.where('_id', request.params.id);
                builder.callback((err, res) => {
                    return reply({
                        statusCode: 200,
                        message: "OK",
                    });
                });
            });
        }
    },
    {
        method: 'GET',
        path: '/compose/errstart/{id}',
        config: {
            tags: ['api'],
            description: 'Get analytic in camera to start ',
            notes: 'Get analytic in camera to start',
            validate: {
                params: {
                    id: Joi.string()
                        .required()
                }
            }
        },
        handler: (request, reply) => {
            db.collection('assignAnalytics').modify({ status: "stop" }).make((builder) => {
                builder.where('_id', request.params.id);
                builder.callback((err, res) => {
                    return reply({
                        statusCode: 200,
                        message: "OK",
                    });
                });
            });
        }
    }
];
//# sourceMappingURL=compose.js.map