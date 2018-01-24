"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db = require("../nosql-util");
const util_1 = require("../util");
const boom_1 = require("boom");
const dateFormat = require('dateformat');
const differenceInMinutes = require('date-fns/difference_in_minutes');
const FormData = require('form-data');
const objectid = require('objectid');
const Joi = require('joi');
const crypto = require('crypto');
const pathSep = require('path');
const httprequest = require('request');
const fs = require('fs');
let previousRequestData = [];
var debug = require('debug')('worker:a');
var sendData = require('debug')('worker:sendData');
module.exports = [
    {
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
            console.log("revcive data from analytics");
            let timezone = (7) * 60 * 60 * 1000;
            let now = new Date(new Date().getTime() + timezone);
            let tomorrow = new Date(new Date().getTime() + (24 + 7) * 60 * 60 * 1000);
            const id = objectid();
            const payload = request.payload;
            payload.id = id;
            payload.timedb = Date.now();
            payload.fileType = payload.fileType.toLowerCase();
            db.collection('assignAnalytics').find().make((builder) => {
                builder.where('nickname', payload.dockerNickname);
                builder.first();
                builder.callback((err, res) => {
                    if (!res) {
                        console.log("Can't find docker contrainer" + payload.dockerNickname);
                        badrequest("Can't find docker contrainer" + payload.dockerNickname);
                    }
                    else {
                        let camInfo = res.cameraInfo;
                        if (payload && (payload.outputType == 'cropping-counting' || payload.outputType == 'cropping' || payload.outputType == 'detection' || payload.outputType == 'recognition' || payload.outputType == 'counting')) {
                            db.collection('analytics-record').insert(payload).callback((err) => {
                                console.log("insert data ");
                                if (err) {
                                    console.log(err);
                                    badrequest(err);
                                }
                                else {
                                    db.collection('notification').find().make((builder) => {
                                        builder.sort('timedb', true);
                                        builder.where('dockerNickname', payload.dockerNickname);
                                        builder.first();
                                        builder.callback((err, res) => {
                                            if (err) {
                                                badrequest("Can't select notification" + payload.dockerNickname);
                                            }
                                            else if (!res) {
                                            }
                                            else {
                                                let currentTime = new Date;
                                                let limitTime = 5;
                                                let analyticsDataTime = res.timedb;
                                                let diffTime = (currentTime - analyticsDataTime) / (1000 * 60);
                                                console.log("difftime : " + diffTime);
                                                if (diffTime > limitTime) {
                                                    console.log("Notification more 5 minute");
                                                }
                                                else {
                                                    console.log("Notification less 5 minute");
                                                }
                                            }
                                        });
                                    });
                                    function notification() {
                                        db.collection('rules').find().make((builder) => {
                                            builder.where('dockerNickname', payload.dockerNickname);
                                            builder.first();
                                            builder.callback((err, res) => {
                                                console.log("read rule :  " + payload.dockerNickname);
                                                if (!res) {
                                                    console.log("No rule");
                                                    sentDataToSmartliving();
                                                }
                                                else {
                                                    console.log("rule compare");
                                                    try {
                                                        for (let rule of res.rule) {
                                                            if (diffdate(rule)) {
                                                                let notificationData = payload;
                                                                notificationData.id = objectid();
                                                                notificationData.isRead = false;
                                                                notificationData.isHide = false;
                                                                let isNotification = false;
                                                                if (rule.type == "cropping") {
                                                                    isNotification = true;
                                                                }
                                                                else if (rule.type == "counting") {
                                                                    if (rule.condition == "more") {
                                                                        if (parseInt(rule.value) <= parseInt(payload.metadata.n))
                                                                            isNotification = true;
                                                                    }
                                                                    else if (rule.condition == "less") {
                                                                        if (parseInt(rule.value) >= parseInt(payload.metadata.n))
                                                                            isNotification = true;
                                                                    }
                                                                }
                                                                if (isNotification) {
                                                                    db.collection('notification').insert(notificationData).callback((err, res) => {
                                                                        if (err) {
                                                                            console.log("can't insert notification ");
                                                                        }
                                                                        console.log("insert notification  " + payload.dockerNickname);
                                                                    });
                                                                }
                                                            }
                                                        }
                                                        sentDataToSmartliving();
                                                    }
                                                    catch (e) {
                                                        console.log("Error Notification");
                                                        console.log(e);
                                                        badrequest(e);
                                                    }
                                                }
                                            });
                                        });
                                    }
                                    function sentDataToSmartliving() {
                                        if (payload.fileType == 'png' || payload.fileType == 'jpg' || payload.fileType == 'jpeg') {
                                            let str = {
                                                ts: payload.ts,
                                                dockerNickname: payload.dockerNickname,
                                                outputType: payload.outputType,
                                                fileType: payload.fileType,
                                                metadata: payload.metadata
                                            };
                                            let path = util_1.Util.dockerAnalyticsCameraPath() + payload.dockerNickname + pathSep.sep + "output" + pathSep.sep + util_1.Util.hash(str) + "." + payload.fileType;
                                            if (!fs.existsSync(path)) {
                                                console.log("Can't find image file");
                                                boom_1.badRequest("Can't find image file");
                                            }
                                            else {
                                                var formData = new FormData();
                                                formData.append('refId', camInfo._id);
                                                formData.append('type', payload.outputType);
                                                formData.append('file', fs.createReadStream(path));
                                                formData.append('ts', payload.ts);
                                                formData.append('meta', "test");
                                                console.log("sending data . . . .");
                                                formData.submit('https://api.thailand-smartliving.com/v1/file/upload', (err, res) => {
                                                    if (err) {
                                                        console.log(err);
                                                        badrequest(err);
                                                    }
                                                    else {
                                                        console.log("-----------------sent data to smart living--------------------");
                                                        reply({
                                                            statusCode: 200,
                                                            data: res
                                                        });
                                                    }
                                                });
                                            }
                                        }
                                        else {
                                            console.log("-----------------------Reord data-------------------");
                                            reply({
                                                statusCode: 200,
                                                msg: "OK Insert success",
                                            });
                                        }
                                    }
                                }
                            });
                        }
                        else {
                            badrequest("Please check 'outputType'");
                        }
                    }
                });
            });
            function diffdate(data) {
                let isToday = false;
                var year = parseInt(dateFormat(now, "yy"));
                var month = parseInt(dateFormat(now, "m"));
                var day = parseInt(dateFormat(now, "d"));
                var hour = parseInt(dateFormat(now, "HH"));
                var min = parseInt(dateFormat(now, "MM"));
                var tomorrowYear = parseInt(dateFormat(tomorrow, "yy"));
                var tomorrowMonth = parseInt(dateFormat(tomorrow, "m"));
                var tomorrowDay = parseInt(dateFormat(tomorrow, "d"));
                if (data.day == dateFormat(now, "ddd").toLowerCase()) {
                    isToday = true;
                }
                if (isToday) {
                    let timeEndH = parseInt(data.timeEnd.split(':')[0]);
                    let timeStartH = parseInt(data.timeStart.split(':')[0]);
                    let timeEndM = parseInt(data.timeEnd.split(':')[1]);
                    let timeStartM = parseInt(data.timeStart.split(':')[1]);
                    if (timeStartH < timeEndH || (timeStartH == timeEndH) && (timeStartM <= timeEndM)) {
                        var start = differenceInMinutes(new Date(year, month, day, hour, min, 0), new Date(year, month, day, timeStartH, timeStartM, 0));
                        var end = differenceInMinutes(new Date(year, month, day, hour, min, 0), new Date(year, month, day, timeEndH, timeEndM, 0));
                        if (start >= 0 && end <= 0) {
                            return true;
                        }
                    }
                    else if (timeStartH > timeEndH || (timeStartH == timeEndH) && (timeStartM >= timeEndM)) {
                        var start = differenceInMinutes(new Date(year, month, day, hour, min, 0), new Date(year, month, day, timeStartH, timeStartM, 0));
                        var end = differenceInMinutes(new Date(year, month, day, hour, min, 0), new Date(tomorrowYear, tomorrowMonth, tomorrowDay, timeEndH, timeEndM, 0));
                        if (start >= 0 && end <= 0) {
                            return true;
                        }
                    }
                }
                return false;
            }
            function badrequest(msg) {
                console.log("Bad Request: " + msg);
                reply({
                    statusCode: 400,
                    msg: "Bad Request",
                    data: msg
                });
            }
        }
    },
    {
        method: 'GET',
        path: '/analytics-record/get',
        config: {
            tags: ['api'],
            description: 'Get analytics record data',
            notes: 'Get analytics record data and',
        },
        handler: (request, reply) => {
            db.collection('analytics-record').find().make((builder) => {
                builder.callback((err, res) => {
                    if (err) {
                        reply({
                            statusCode: 400,
                            msg: "Bad Request",
                            data: err
                        });
                    }
                    else {
                        reply({
                            statusCode: 200,
                            msg: "OK",
                            data: res
                        });
                    }
                });
            });
        }
    },
    {
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
                const params = request.params;
                builder.where('dockerNickname', params._nickname);
                builder.sort('ts', true);
                builder.callback((err, res) => {
                    if (err) {
                        reply({
                            statusCode: 400,
                            msg: "Bad Request",
                            data: err
                        });
                    }
                    else {
                        reply({
                            statusCode: 200,
                            msg: "OK",
                            data: res
                        });
                    }
                });
            });
        }
    },
    {
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
                const params = request.params;
                builder.where('dockerNickname', params._nickname);
                builder.limit(params._num);
                builder.sort('timedb', true);
                builder.callback((err, res) => {
                    if (err) {
                        reply({
                            statusCode: 400,
                            msg: "Bad Request",
                            data: err
                        });
                    }
                    else {
                        reply({
                            statusCode: 200,
                            msg: "OK",
                            data: res
                        });
                    }
                });
            });
        }
    },
    {
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
            const payload = request.payload;
            db.collection('analytics-record').find().make((builder) => {
                builder.where('dockerNickname', payload._nickname);
                builder.between('ts', 1513146685761, 1513146764330);
                builder.callback((err, res) => {
                    if (err) {
                        reply({
                            statusCode: 400,
                            msg: "Bad Request",
                            data: err
                        });
                    }
                    else {
                        reply({
                            statusCode: 200,
                            msg: "OK",
                            data: res,
                        });
                    }
                });
            });
        }
    },
    {
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
            db.collection('analytics-record').find().make((builder) => {
                builder.where("id", request.params._id);
                builder.first();
                builder.callback((err, res) => {
                    if (!res) {
                        reply({
                            statusCode: 404,
                            message: "Bad Request",
                            data: "Data not found"
                        });
                    }
                    else if (res.fileType == "png" || res.fileType == "jpg" || res.fileType == "jpeg") {
                        let str = {
                            ts: res.ts,
                            dockerNickname: res.dockerNickname,
                            outputType: res.outputType,
                            fileType: res.fileType,
                            metadata: res.metadata
                        };
                        let path = util_1.Util.dockerAnalyticsCameraPath() + res.dockerNickname + pathSep.sep + "output" + pathSep.sep + util_1.Util.hash(str) + "." + res.fileType;
                        reply.redirect('http://10.0.0.71:10099/docker-analytics-camera/' + res.dockerNickname + '/output' + pathSep.sep + util_1.Util.hash(str) + "." + res.fileType);
                    }
                    else {
                        reply({
                            statusCode: 404,
                            message: "Bad Request",
                            data: "Invail file type"
                        });
                    }
                });
            });
        }
    },
    {
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
                            reply({
                                statusCode: 400,
                                msg: "Bad request"
                            });
                        }
                        else {
                            reply({
                                statusCode: 200,
                                msg: "OK"
                            });
                        }
                    });
                });
            }
            else {
                reply({
                    statusCode: 400,
                    msg: "Bad request"
                });
            }
        }
    }
];
//# sourceMappingURL=analytic-record.js.map