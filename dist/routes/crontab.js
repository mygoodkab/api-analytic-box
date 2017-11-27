"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db = require("../nosql-util");
const objectid = require('objectid');
const Joi = require('joi');
module.exports = [
    {
        method: 'GET',
        path: '/crontab/',
        config: {
            tags: ['api'],
            description: 'Get analytic offline in camera to start ',
            notes: 'Get analytic offline in camera to start',
        },
        handler: (request, reply) => {
            db.collection('assignAnalytics').find().make((builder) => {
                builder.callback((err, res) => {
                    return reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    });
                });
            });
        }
    },
    {
        method: 'GET',
        path: '/crontab/errstop/{id}',
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
        path: '/crontab/errstart/{id}',
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
//# sourceMappingURL=crontab.js.map