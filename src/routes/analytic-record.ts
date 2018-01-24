import * as db from '../nosql-util';
import { Util } from '../util';
import { date, func } from 'joi';
import { badRequest } from 'boom';
const dateFormat = require('dateformat');
const differenceInMinutes = require('date-fns/difference_in_minutes')
const FormData = require('form-data');
const objectid = require('objectid');
const Joi = require('joi')
const crypto = require('crypto');
const pathSep = require('path');
const httprequest = require('request');
const fs = require('fs')
let previousRequestData = [];
var debug = require('debug')('worker:a')
var sendData = require('debug')('worker:sendData')
module.exports = [

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
        handler: (request, reply) => {

            let timezone = (5) * 60 * 60 * 1000;
            let now: any = new Date(new Date().getTime() + timezone); // * timezone thai
            let tomorrow = new Date(new Date().getTime() + (24 + 5) * 60 * 60 * 1000); // * timezone thai * 24 hours
            const id = objectid()
            const payload = request.payload;
            //payload.ts = parseInt(payload.ts, 10)
            payload.id = id
            payload.timedb = Date.now()
            payload.fileType = payload.fileType.toLowerCase()

            db.collection('assignAnalytics').find().make((builder) => {
                builder.where('nickname', payload.dockerNickname)
                builder.first()
                builder.callback((err, res) => {

                    if (!res) {

                        console.log("Can't find docker contrainer" + payload.dockerNickname)
                        badrequest("Can't find docker contrainer" + payload.dockerNickname)
                    } else {
                        let camInfo = res.cameraInfo
                        // ถ้า outputType ต้องตรงตามเงือนไข  
                        if (payload && (payload.outputType == 'cropping-counting' || payload.outputType == 'cropping' || payload.outputType == 'detection' || payload.outputType == 'recognition' || payload.outputType == 'counting')) {
                            db.collection('analytics-record').insert(payload).callback((err) => {
                                console.log("insert data ");
                                if (err) {
                                    console.log(err)
                                    badrequest(err)
                                } else {
                                    db.collection('notification').find().make((builder) => {
                                        builder.sort('timedb', true)
                                        builder.where('dockerNickname', payload.dockerNickname)
                                        builder.first()
                                        builder.callback((err, res) => {
                                            if (err) {
                                                badrequest("Can't select notification" + payload.dockerNickname)
                                            } else if (!res) { // ถ้าไม่มีข้อมูล
                                                notification()
                                            } else {
                                                let currentTime:any = new Date  
                                                let limitTime = 5 // minute
                                                let analyticsDataTime: any = res.timedb
                                                let diffTime = (currentTime - analyticsDataTime)/(1000*60);
                                                console.log("difftime : " + diffTime)
                                                if (diffTime > limitTime) { // ข้อมูลล่าสุดส่งมาเกิน 5 นาที 
                                                    console.log("Notification more 5 minute")
                                                    notification()
                                                } else {
                                                    console.log("Notification less 5 minute")
                                                    sentDataToSmartliving()
                                                }
                                            }
                                        })
                                    })
                                    //=----------------------------------------------=
                                    //| check rule by dockerNickname to notification |
                                    //=----------------------------------------------=
                                    function notification() {

                                        db.collection('rules').find().make((builder) => {
                                            builder.where('dockerNickname', payload.dockerNickname)
                                            builder.first()
                                            builder.callback((err, res) => {
                                                console.log("read rule :  " + payload.dockerNickname)
                                                if (!res) {
                                                    //  No rule
                                                    console.log("No rule")
                                                    sentDataToSmartliving()
                                                } else {
                                                    console.log("rule compare")
                                                    try {
                                                        for (let rule of res.rule) {

                                                            if (diffdate(rule)) {
                                                                let notificationData = payload
                                                                notificationData.id = objectid()
                                                                notificationData.isRead = false
                                                                notificationData.isHide = false
                                                                let isNotification = false
                                                                // notification
                                                                if (rule.type == "cropping") {
                                                                    isNotification = true
                                                                } else if (rule.type == "counting") {
                                                                    if (rule.condition == "more") {
                                                                        if (parseInt(rule.value) <= parseInt(payload.metadata.n)) isNotification = true
                                                                    } else if (rule.condition == "less") {
                                                                        if (parseInt(rule.value) >= parseInt(payload.metadata.n)) isNotification = true
                                                                    }// else badrequest("Invaild condition")
                                                                }
                                                                if (isNotification) {
                                                                    db.collection('notification').insert(notificationData).callback((err, res) => {
                                                                        if (err) {
                                                                            console.log("can't insert notification ")
                                                                        }
                                                                        console.log("insert notification  " + payload.dockerNickname)
                                                                    })
                                                                }
                                                            }
                                                        }

                                                        sentDataToSmartliving()
                                                    } catch (e) {
                                                        console.log("Error Notification")
                                                        console.log(e)
                                                        badrequest(e)
                                                    }

                                                }
                                            })
                                        })

                                    }
                                    // ถ้า file type เป็นแบบรูปภาพจะส่งไปยัง smart living 
                                    function sentDataToSmartliving() {
                                        // sendData('18---------begin sentDataToSmartliving')
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
                                                //  sendData('19')
                                                console.log("Can't find image file")
                                                badRequest("Can't find image file")
                                            } else {
                                                //  sendData('20')
                                                var formData = new FormData();
                                                formData.append('refId', camInfo._id)
                                                formData.append('type', payload.outputType)
                                                formData.append('file', fs.createReadStream(path))
                                                formData.append('ts', payload.ts)
                                                formData.append('meta', "test")

                                                console.log("sending data . . . .")
                                                formData.submit('https://api.thailand-smartliving.com/v1/file/upload', (err, res) => {
                                                    //sendData('21')
                                                    if (err) {
                                                        //sendData('22')
                                                        console.log(err)
                                                        badrequest(err)
                                                    } else {
                                                        // sendData('finish')
                                                        // console.log(res)
                                                        console.log("-----------------sent data to smart living--------------------")
                                                        return reply({
                                                            statusCode: 200,
                                                            data: res
                                                        })
                                                    }
                                                })
                                            }

                                        } else {

                                            console.log("-----------------------Reord data-------------------")
                                            return reply({
                                                statusCode: 200,
                                                msg: "OK Insert success",
                                            })
                                        }
                                    }
                                }
                            })
                        } else {
                            badrequest("Please check 'outputType'")
                        }
                    }
                })
            })

            function diffdate(data) {
                let isToday = false;
                var year = parseInt(dateFormat(now, "yy"))
                var month = parseInt(dateFormat(now, "m"))
                var day = parseInt(dateFormat(now, "d"))
                var hour = parseInt(dateFormat(now, "HH")) // 7 is time-zone bangkok
                var min = parseInt(dateFormat(now, "MM"))
                var tomorrowYear = parseInt(dateFormat(tomorrow, "yy"))
                var tomorrowMonth = parseInt(dateFormat(tomorrow, "m"))
                var tomorrowDay = parseInt(dateFormat(tomorrow, "d"))

                if (data.day == dateFormat(now, "ddd").toLowerCase()) {
                    isToday = true
                }

                if (isToday) {
                    let timeEndH = parseInt(data.timeEnd.split(':')[0])
                    let timeStartH = parseInt(data.timeStart.split(':')[0])
                    let timeEndM = parseInt(data.timeEnd.split(':')[1])
                    let timeStartM = parseInt(data.timeStart.split(':')[1])

                    if (timeStartH < timeEndH || (timeStartH == timeEndH) && (timeStartM <= timeEndM)) {//ถ้าเวลาเริ่มมากกว่าเวลาจบ เช่น 5.30-22.30 , 23.30-23.31 , 14.00-14.00
                        var start = differenceInMinutes( // diff กันแล้วผลลัพธ์  - คือยังไม่ถึงเวลา แต่ถ้าเป็น + คือผ่านมาแล้ว
                            new Date(year, month, day, hour, min, 0), //เวลาปัจจุบัน
                            new Date(year, month, day, timeStartH, timeStartM, 0) //เวลาเทียบ
                        )
                        var end = differenceInMinutes(
                            new Date(year, month, day, hour, min, 0),
                            new Date(year, month, day, timeEndH, timeEndM, 0)
                        )
                        if (start >= 0 && end <= 0) {
                            return true
                        }
                    }
                    else if (timeStartH > timeEndH || (timeStartH == timeEndH) && (timeStartM >= timeEndM)) { //ถ้าเวลาเริ่มมากกว่าเวลาจบ เช่น 23.30-5.30 , 23.31-23.30
                        var start = differenceInMinutes( // diff กันแล้วผลลัพธ์  - คือยังไม่ถึงเวลา แต่ถ้าเป็น + คือผ่านมาแล้ว
                            new Date(year, month, day, hour, min, 0), //เวลาปัจจุบัน
                            new Date(year, month, day, timeStartH, timeStartM, 0) //เวลาเทียบ
                        )
                        var end = differenceInMinutes(
                            new Date(year, month, day, hour, min, 0),
                            new Date(tomorrowYear, tomorrowMonth, tomorrowDay, timeEndH, timeEndM, 0)
                        )
                        if (start >= 0 && end <= 0) {
                            return true
                        }
                    }
                }
                return false
            }
            function badrequest(msg) {
                console.log("Bad Request: " + msg)
                return reply({
                    statusCode: 400,
                    msg: "Bad Request",
                    data: msg
                })
            }
        }

    },
    { // Get all analytic-record
        method: 'GET',
        path: '/analytics-record/get',
        config: {
            tags: ['api'],
            description: 'Get analytics record data',
            notes: 'Get analytics record data and',

        },
        handler: (request, reply) => {
            db.collection('analytics-record').find().make((builder) => {
                // builder.sort('ts', true)
                builder.callback((err, res) => {
                    if (err) {
                        return reply({
                            statusCode: 400,
                            msg: "Bad Request",
                            data: err
                        })
                    } else {
                        return reply({
                            statusCode: 200,
                            msg: "OK",
                            data: res

                        })
                    }
                })
            })

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
        handler: (request, reply) => {
            db.collection('analytics-record').find().make((builder) => {
                const params = request.params
                builder.where('dockerNickname', params._nickname)
                builder.sort('ts', true)
                builder.callback((err, res) => {
                    if (err) {
                        return reply({
                            statusCode: 400,
                            msg: "Bad Request",
                            data: err
                        })
                    } else {
                        return reply({
                            statusCode: 200,
                            msg: "OK",
                            data: res

                        })
                    }
                })
            })

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
        handler: (request, reply) => {
            db.collection('analytics-record').find().make((builder) => {
                const params = request.params
                builder.where('dockerNickname', params._nickname)
                builder.limit(params._num)
                builder.sort('timedb', true)
                builder.callback((err, res) => {
                    if (err) {
                        return reply({
                            statusCode: 400,
                            msg: "Bad Request",
                            data: err
                        })
                    } else {
                        return reply({
                            statusCode: 200,
                            msg: "OK",
                            data: res

                        })
                    }
                })
            })

        }
    },
    { // Get all analytics-record by nickname && time
        method: 'POST',
        path: '/analytics-record/get/time',
        config: {
            tags: ['api'],
            description: 'Get analytics record data',
            notes: 'Get analytics record data and',
            validate: {
                payload: {
                    _time: Joi.any(),
                    _nickname: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => {
            const payload = request.payload
            db.collection('analytics-record').find().make((builder) => {
                builder.where('dockerNickname', payload._nickname)
                builder.between('ts', 1513146685761, 1513146764330)
                builder.callback((err, res) => {
                    if (err) {
                        return reply({
                            statusCode: 400,
                            msg: "Bad Request",
                            data: err
                        })
                    } else {
                        return reply({
                            statusCode: 200,
                            msg: "OK",
                            data: res,
                        })
                    }
                })
            })

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
        handler: (request, reply) => {
            //debug('start 1')
            db.collection('analytics-record').find().make((builder: any) => {
                builder.where("id", request.params._id)
                builder.first()
                builder.callback((err: any, res: any) => {
                    //debug('2 get analytics-record')
                    if (!res) {
                        return reply({
                            statusCode: 404,
                            message: "Bad Request",
                            data: "Data not found"
                        })
                    } else if (res.fileType == "png" || res.fileType == "jpg" || res.fileType == "jpeg") {
                        //debug('3')
                        // let test = "good"
                        let str = {
                            ts: res.ts,
                            dockerNickname: res.dockerNickname,
                            outputType: res.outputType,
                            fileType: res.fileType,
                            metadata: res.metadata
                        }
                        //let hash = crypto.createHmac('sha256', JSON.stringify(res)).digest('base64'); 
                        //hash = hash.replace(/[^a-zA-Z ]/g, "")
                        //debug('4')
                        let path: any = Util.dockerAnalyticsCameraPath() + res.dockerNickname + pathSep.sep + "output" + pathSep.sep + Util.hash(str) + "." + res.fileType; // path + folder + \ + filename.png
                        // debug('5')
                        // console.log(str)
                        //  console.log("test : " + hash)
                        //  console.log("hash : " + res.hash)
                        //console.log(path)   
                        return reply.redirect('http://10.0.0.71:10099/docker-analytics-camera/' + res.dockerNickname + '/output' + pathSep.sep + Util.hash(str) + "." + res.fileType)
                        // return reply.file(path,
                        //     {   
                        //         filename: res.name + '.' + res.fileType,
                        //         mode: 'inline',
                        //         confine: false
                        //     })
                    }
                    else {
                        return reply({
                            statusCode: 404,
                            message: "Bad Request",
                            data: "Invail file type"
                        })
                    }
                });
            });
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
        handler: (request, reply) => {
            if (request.payload.pass == "pass") {
                db.collection('analytics-record').remove().make((builder) => {
                    builder.callback((err, res) => {
                        if (err) {
                            return reply({
                                statusCode: 400,
                                msg: "Bad request"
                            })
                        } else {
                            return reply({
                                statusCode: 200,
                                msg: "OK"
                            })
                        }
                    })
                })
            } else {
                return reply({
                    statusCode: 400,
                    msg: "Bad request"
                })
            }

        }
    }
]