import * as db from '../nosql-util';
import { Util } from '../util';
import { date, func } from 'joi';
const dateFormat = require('dateformat');
const differenceInMinutes = require('date-fns/difference_in_minutes')
const FormData = require('form-data');
const objectid = require('objectid');
const Joi = require('joi')
const crypto = require('crypto');
const pathSep = require('path');
const httprequest = require('request');
//const httprequest = require('request-promise');
const fs = require('fs')
let previousRequestData = [];
var debug = require('debug')('worker:a')
var sendData = require('debug')('worker:sendData')
import * as  Boom from 'boom'
import { collection } from '../nosql-util';
import { ObjectId } from 'bson';
const mongoObjectId = require('mongodb').ObjectId;
module.exports = [
    //// =======================================================   version 2  ===========================================================================================
    { // Get all analytic-record
        method: 'GET',
        path: '/analytics-record/get',
        config: {
            tags: ['api'],
            description: 'Get analytics record data',
            notes: 'Get analytics record data and',

        },
        handler: async (request, reply) => {
            let mongo = Util.getDb(request)
            try {
                const resAnalyticsRecord = await mongo.collection('analytics-record').find().toArray()
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: resAnalyticsRecord
                })
            } catch (error) {
                reply(Boom.badRequest(error))
            }
        }
    },
    { // Get all analytic-record by nickname 
        method: 'GET',
        path: '/analytics-record/get/{_nickname}',
        config: {
            tags: ['api'],
            description: 'Get analytics record data',
            notes: 'Get analytics record data and',
            validate: {
                params: {
                    _nickname: Joi.string().required()
                }
            }
        },
        handler: async (request, reply) => {
            let mongo = Util.getDb(request)
            const params = request.params
            try {
                const resAnalyticsRecord = await mongo.collection('analytics-record').find({ dockerNickname: params._nickname }).sort({ ts: -1 }).toArray()
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: resAnalyticsRecord
                })
            } catch (error) {
                reply(Boom.badRequest(error))
            }
        }
    },
    { // Get all analytic-record by nickname limit _num
        method: 'GET',
        path: '/analytics-record/get/{_nickname}/{_num}',
        config: {
            tags: ['api'],
            description: 'Get analytics record data limit by num',
            notes: 'Get analytics record data and limit by num',
            validate: {
                params: {
                    _nickname: Joi.string().required(),
                    _num: Joi.string().required()
                }
            }
        },
        handler: async (request, reply) => {
            let mongo = Util.getDb(request)
            const params = request.params
            try {
                const resAnalyticsRecord = await mongo.collection('analytics-record').find({ dockerNickname: params._nickname }).sort({ ts: -1 }).limit(parseInt(params._num)).toArray()
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: resAnalyticsRecord
                })
            } catch (error) {
                reply(Boom.badRequest(error))
            }

        }
    },
    { // Get image
        method: 'GET',
        path: '/analytics-record/image/{_id}',
        config: {
            tags: ['api'],
            description: 'Get image for UI',
            notes: 'Get image ',
            validate: {
                params: {
                    _id: Joi.string().required().description("id anaytics-redord")
                }
            }
        },
        handler: async (request, reply) => {
            const mongo = Util.getDb(request)
            const params = request.params
            try {
                const resAnalyticsRecord: any = await mongo.collection('analytics-record').findOne({ _id: mongoObjectId(params._id) })
                resAnalyticsRecord
                if (!resAnalyticsRecord) {
                    reply(Boom.notFound)
                } else if (resAnalyticsRecord.fileType == "png" || resAnalyticsRecord.fileType == "jpg" || resAnalyticsRecord.fileType == "jpeg") {
                    let str = {
                        ts: resAnalyticsRecord.ts,
                        dockerNickname: resAnalyticsRecord.dockerNickname,
                        outputType: resAnalyticsRecord.outputType,
                        fileType: resAnalyticsRecord.fileType,
                        metadata: resAnalyticsRecord.metadata
                    }
                    let path: any = Util.dockerAnalyticsCameraPath() + resAnalyticsRecord.dockerNickname + pathSep.sep + "output" + pathSep.sep + Util.hash(str) + "." + resAnalyticsRecord.fileType; // path + folder + \ + filename.png
                    //reply.redirect('http://10.0.0.71:10099/docker-analytics-camera/' + resAnalyticsRecord.dockerNickname + '/output' + pathSep.sep + Util.hash(str) + "." + resAnalyticsRecord.fileType)
                    reply.file(path,
                        {
                            filename: resAnalyticsRecord.name + '.' + resAnalyticsRecord.fileType,
                            mode: 'inline',
                            confine: false
                        })
                } else {
                    reply(Boom.badRequest("Invail file type"))
                }

            } catch (error) {
                reply(Boom.badGateway(error))
            }

        }
    },
    { // Delete all
        method: 'POST',
        path: '/analytics-record/delete-all',
        config: {
            tags: ['api'],
            description: 'delete all',
            notes: 'delete all',
            validate: {
                payload: {
                    pass: Joi.string().required(),
                }
            }
        },
        handler: async (request, reply) => {
            const mongo = Util.getDb(request)
            const payload = request.payload

            try {
                reply({
                    statusCode: 200,
                    message: "OK",
                })
            } catch (error) {
                reply(Boom.badGateway(error))
            }

        }
    },
    // ============================================================================================================================
    { // insert  record 
        method: 'POST',
        path: '/analytics-record/record',
        config: {
            tags: ['api'],
            description: 'analytics record data and return hash',
            notes: 'analytics record data and return hash',
            validate: {
                payload: {
                    ts: Joi.string().required(),
                    dockerNickname: Joi.string().required(),
                    outputType: Joi.string().required(),
                    fileType: Joi.string().required(),
                    metadata: Joi.any()
                }
            }
        },
        handler: async (request, reply) => {
            let mongo = Util.getDb(request)
            const payload = request.payload;
            console.log("revcive data from analytics " + payload.dockerNickname)
            payload.timedb = Date.now()
            payload.fileType = payload.fileType.toLowerCase()
            try {
                const resAssignAnalytics: any = await mongo.collection('assignAnalytics').findOne({ nickname: payload.dockerNickname })
                if (!resAssignAnalytics) {
                    badrequest("Can't find docker contrainer" + payload.dockerNickname)
                } else {
                    let camInfo = resAssignAnalytics.cameraInfo
                    // ถ้า outputType ต้องตรงตามเงือนไข  
                    if (payload && (payload.outputType == 'cropping-counting' || payload.outputType == 'cropping' || payload.outputType == 'detection' || payload.outputType == 'recognition' || payload.outputType == 'counting')) {
                        const insertAnalyticsRecord = await mongo.collection('analytics-record').insertOne(payload)

                        if (payload.fileType == 'png' || payload.fileType == 'jpg' || payload.fileType == 'jpeg') {
                            let str = {
                                ts: payload.ts,
                                dockerNickname: payload.dockerNickname,
                                outputType: payload.outputType,
                                fileType: payload.fileType,
                                metadata: payload.metadata
                            }
                            //get file
                            let path: any = Util.dockerAnalyticsCameraPath() + payload.dockerNickname + pathSep.sep + "output" + pathSep.sep + Util.hash(str) + "." + payload.fileType;
                            if (!fs.existsSync(path)) {
                                console.log("Can't find image file")
                                badrequest("Can't find image file")
                            } else {
                                var formData = new FormData();
                                formData.append('refId', camInfo._id.toString()) //"5a6fe68f478d4b0100000010" camInfo._id
                                formData.append('type', payload.outputType)
                                formData.append('file', fs.createReadStream(path))
                                formData.append('ts', payload.ts)
                                formData.append('meta', "test")

                                console.log("sending data . . . .")
                                formData.submit('https://api.thailand-smartliving.com/v1/file/upload', (err, res) => {
                                    if (err) {
                                        console.log(err)
                                        //badrequest(err)
                                    } else {
                                        console.log("-----------------sent data to smart living--------------------")
                                    }
                                })
                            }
                        }
                        //// check latest notification
                        let resNotification: any = await mongo.collection('notification').find({ dockerNickname: payload.dockerNickname }).sort({ timedb: -1 }).limit(1).toArray()
                        resNotification = resNotification[0]
                        if (!resNotification) {
                            console.log("Frist Notification " + payload.dockerNickname)
                            checkRule()
                        } else {
                            let currentTime: any = new Date
                            let limitTime = 5 // minute
                            let analyticsDataTime: any = resNotification.timedb
                            let diffTime = (currentTime - analyticsDataTime) / (1000 * 60);
                            console.log("difftime : " + diffTime)
                            if (diffTime > limitTime) { // ข้อมูลล่าสุดส่งมาเกิน 5 นาที 
                                console.log("Notification more 5 minute")
                                checkRule()
                            } else {
                                reply({
                                    statusCode: 200,
                                    msg: "OK",
                                })
                            }

                        }

                        // =----------------------------------------------=
                        // | check rule by dockerNickname to notification |
                        // =----------------------------------------------=
                        async function checkRule() {
                            const resRules: any = await mongo.collection('rules').find({ dockerNickname: payload.dockerNickname }).toArray()
                            if (resRules.length == 0) {
                                console.log("No rule")
                                reply({
                                    statusCode: 200,
                                    msg: "OK",
                                })
                            } else {
                                console.log("Rule compare : ", resRules)
                                for (let rule of resRules) {
                                    if (Util.isNotification(rule) && rule.status) {
                                        let notificationData = payload
                                        //notificationData.id = objectid()
                                        notificationData.isRead = false
                                        notificationData.isHide = false
                                        let isNotification = false
                                        // notification
                                        if (rule.type == "cropping") {
                                            isNotification = true
                                        } else if (rule.type == "counting") {
                                            if (rule.metadata.condition == "more") {
                                                if (parseInt(rule.value) <= parseInt(payload.metadata.n)) isNotification = true
                                            } else if (rule.metadata.condition == "less") {
                                                if (parseInt(rule.value) >= parseInt(payload.metadata.n)) isNotification = true
                                            }// else badrequest("Invaild condition")
                                        }
                                        if (isNotification) {
                                            const insertNotification: any = await mongo.collection('notification').insertOne(notificationData)
                                            console.log("Insert notification success")
                                        }
                                    }
                                }
                                reply({
                                    statusCode: 200,
                                    msg: "OK",
                                })
                            }

                        }
                        // ถ้า file type เป็นแบบรูปภาพจะส่งไปยัง smart living 

                    } else {
                        badrequest("Please check 'outputType'")
                    }
                }
                function badrequest(msg) {
                    console.log("Bad Request: " + msg)
                    reply({
                        statusCode: 400,
                        msg: "Bad Request",
                        data: msg
                    })
                }
            } catch (error) {
                reply(Boom.badRequest(error))
            }

        }
    },

]