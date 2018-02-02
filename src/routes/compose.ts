import * as db from '../nosql-util';
const objectid = require('objectid');
const Joi = require('joi')
import { Util } from '../util';
import * as  Boom from 'boom'
const mongoObjectId = require('mongodb').ObjectId;
//========================================================================================================
// Get all analytic in camera (assignAnalytics) to run docker cmd  
// 1. get all  assignAnalytics where status == 'offline'                         path '/crontab/'
// 2. update status == 'online' from _id in assignAnalytics  that can run cmd    path '/crontab/{id}'
//=========================================================================================================
module.exports = [
    {
        method: 'GET',
        path: '/compose/mongo',
        config: {
            tags: ['api'],
            description: 'Get analytic offline in camera to start ',
            notes: 'Get analytic offline in camera to start',
        },
        handler: async (request, reply) => {
            let dbm = Util.getDb(request)
            try {
                const resAssignAnalytics = await dbm.collection('assignAnalytics').find().toArray()
                let i = 1;
                let analytic: any = [];
                if (resAssignAnalytics.length == 0) {
                    reply(Boom.notFound)
                } else {
                    for (let data of resAssignAnalytics) {
                        let arrData = {
                            //id: data._id,
                            //idCamera: data._refCameraId,
                            // idAnalytics: data._refAnalyticsId,
                            status: data.status,
                            dockerNickname: data.nickname,
                            //cmd: data.cmd
                        }
                        analytic.push(arrData)
                        if (i == resAssignAnalytics.length) {
                            reply({
                                statusCode: 200,
                                message: "OK",
                                data: analytic
                            })
                        }
                        i++;
                    }
                }
            } catch (error) {
                reply(Boom.badGateway(error))
            }
        }
    },

    //===============================================================================================================================================
    {
        method: 'GET',
        path: '/compose/',
        config: {
            tags: ['api'],
            description: 'Get analytic offline in camera to start ',
            notes: 'Get analytic offline in camera to start',
        },
        handler: async(request, reply) => {
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
                        reply({
                            statusCode: 200,
                            message: "OK",
                            data: data
                        })
                    }

                    function badrequest(msg) {
                        reply({
                            statusCode: 400,
                            message: "Bad Request",
                            data: msg
                        })
                    }

                });
            });


        }
    },

]