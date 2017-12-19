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
        path: '/compose/',
        config: {
            tags: ['api'],
            description: 'Get analytic offline in camera to start ',
            notes: 'Get analytic offline in camera to start',
        },
        handler: (request, reply) => {
            db.collection('assignAnalytics').find().make((builder: any) => {
                builder.callback((err: any, res: any) => {
                    if (res) {
                        let i = 1;
                        let analytic: any = [];
                        if (res.length == 0) {
                            badrequest("NO data in assignAnalytics")
                        } else {
                            for (let data of res) {
                                let arrData = {
                                    //id: data._id,
                                    //idCamera: data._refCameraId,
                                    // idAnalytics: data._refAnalyticsId,
                                    status: data.status,
                                    dockerNickname: data.nickname,
                                    //cmd: data.cmd
                                }
                                analytic.push(arrData)
                                if (i == res.length) {
                                    success(analytic)
                                }
                                i++;
                            }
                        }


                    } else {
                        badrequest("no Data in payload")
                    }

                    function success(data) {
                        return reply({
                            statusCode: 200,
                            message: "OK",
                            data: data
                        })
                    }

                    function badrequest(msg) {
                        return reply({
                            statusCode: 400,
                            message: "Bad Request",
                            data: msg
                        })
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
            db.collection('assignAnalytics').modify({ status: "start" }).make((builder: any) => {
                builder.where('_id', request.params.id)
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
            db.collection('assignAnalytics').modify({ status: "stop" }).make((builder: any) => {
                builder.where('_id', request.params.id)
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