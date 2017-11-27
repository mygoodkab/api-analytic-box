import * as db from '../nosql-util';
const objectid = require('objectid');
const Joi = require('joi')
//========================================================================================================
// Get all analytic in camera (assignAnalytics) to run docker cmd  
// 1. get all  assignAnalytics where status == 'offline'                         path '/crontab/'
// 2. update status == 'online' from _id in assignAnalytics  that can run cmd    path '/crontab/{id}'
//=========================================================================================================

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
            db.collection('assignAnalytics').find().make((builder: any) => {
                builder.callback((err: any, res: any) => {
                    return reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    })
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
            db.collection('assignAnalytics').modify({status: "start"}).make((builder: any) => {
                builder.where('_id',request.params.id)
                builder.callback((err: any, res: any) => {
                    return reply({
                        statusCode: 200,
                        message: "OK",
 
                    })
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
            db.collection('assignAnalytics').modify({status: "stop"}).make((builder: any) => {
                builder.where('_id',request.params.id)
                builder.callback((err: any, res: any) => {
                    return reply({
                        statusCode: 200,
                        message: "OK",
 
                    })
                });
            });


        }
    }
]