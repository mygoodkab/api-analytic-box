import * as db from '../nosql-util';
import { Util } from '../util';
import { date } from 'joi';
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
            let now = new Date();
            let tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
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
                        console.log("Can't find docker contrainer")
                        badrequest("Can't find docker contrainer")
                    } else {
                        let camInfo = res.cameraInfo
                        // ถ้า outputType ต้องตรงตามเงือนไข  
                        if (payload && (payload.outputType == 'cropping' || payload.outputType == 'detection' || payload.outputType == 'recognition' || payload.outputType == 'counting')) {

                            db.collection('analytics-record').insert(payload).callback((err) => {
                                console.log("insert data ");
                                if (err) {
                                    console.log(err)
                                    badrequest(err)
                                } else {
                                    
                                    // ถ้า file type เป็นแบบรูปภาพจะส่งไปยัง smart living 


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
                                            badRequest("Can't find image file")
                                        } else {
                                            var formData = new FormData();
                                            formData.append('refId', camInfo._id)
                                            formData.append('type', payload.outputType)
                                            formData.append('file', fs.createReadStream(path))
                                            formData.append('ts', payload.ts)
                                            formData.append('meta', "test")

                                            console.log("sending data . . . .")
                                            formData.submit('https://api.thailand-smartliving.com/v1/file/upload', (err, res) => {
                                                if (err) {
                                                    console.log(err)
                                                    badrequest(err)
                                                } else {
                                                    // console.log(res)
                                                    console.log("sent data to smart living")
                                                    return reply({
                                                        statusCode: 200,
                                                        data: res
                                                    })
                                                }
                                            })
                                        }

                                    } else {
                                        return reply({
                                            statusCode: 200,
                                            msg: "OK Insert success",
                                        })
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

                var year = parseInt(dateFormat(now, "yyy"))
                var month = parseInt(dateFormat(now, "m"))
                var day = parseInt(dateFormat(now, "d"))
                var hour = parseInt(dateFormat(now, "HH"))
                var min = parseInt(dateFormat(now, "MM"))

                var tomorrowYear = parseInt(dateFormat(tomorrow, "yyy"))
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
                        console.log(start + " " + end)

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
                        console.log(start + " " + end)

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
            db.collection('analytics-record').find().make((builder: any) => {
                builder.where("id", request.params._id)
                builder.first()
                builder.callback((err: any, res: any) => {
                    if (!res) {
                        return reply({
                            statusCode: 404,
                            message: "Bad Request",
                            data: "Data not found"
                        })
                    } else if (res.fileType == "png" || res.fileType == "jpg" || res.fileType == "jpeg") {
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
                        let path: any = Util.dockerAnalyticsCameraPath() + res.dockerNickname + pathSep.sep + "output" + pathSep.sep + Util.hash(str) + "." + res.fileType; // path + folder + \ + filename.png
                        // console.log(str)
                        //  console.log("test : " + hash)
                        //  console.log("hash : " + res.hash)
                        //console.log(path)
                        return reply.file(path,
                            {
                                filename: res.name + '.' + res.fileType,
                                mode: 'inline',
                                confine: false
                            })
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