"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../util");
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
const Boom = require("boom");
const mongoObjectId = require('mongodb').ObjectId;
module.exports = [
    {
        method: 'GET',
        path: '/analytics-record/get',
        config: {
            tags: ['api'],
            description: 'Get analytics record data',
            notes: 'Get analytics record data and',
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            let mongo = util_1.Util.getDb(request);
            try {
                const resAnalyticsRecord = yield mongo.collection('analytics-record').find().toArray();
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: resAnalyticsRecord
                });
            }
            catch (error) {
                reply(Boom.badRequest(error));
            }
        })
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
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            let mongo = util_1.Util.getDb(request);
            const params = request.params;
            try {
                const resAnalyticsRecord = yield mongo.collection('analytics-record').find({ dockerNickname: params._nickname }).sort({ ts: -1 }).toArray();
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: resAnalyticsRecord
                });
            }
            catch (error) {
                reply(Boom.badRequest(error));
            }
        })
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
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            let mongo = util_1.Util.getDb(request);
            const params = request.params;
            try {
                const resAnalyticsRecord = yield mongo.collection('analytics-record').find({ dockerNickname: params._nickname }).sort({ ts: -1 }).limit(parseInt(params._num)).toArray();
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: resAnalyticsRecord
                });
            }
            catch (error) {
                reply(Boom.badRequest(error));
            }
        })
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
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const mongo = util_1.Util.getDb(request);
            const params = request.params;
            try {
                const resAnalyticsRecord = yield mongo.collection('analytics-record').findOne({ _id: mongoObjectId(params._id) });
                resAnalyticsRecord;
                if (!resAnalyticsRecord) {
                    reply(Boom.notFound);
                }
                else if (resAnalyticsRecord.fileType == "png" || resAnalyticsRecord.fileType == "jpg" || resAnalyticsRecord.fileType == "jpeg") {
                    let str = {
                        ts: resAnalyticsRecord.ts,
                        dockerNickname: resAnalyticsRecord.dockerNickname,
                        outputType: resAnalyticsRecord.outputType,
                        fileType: resAnalyticsRecord.fileType,
                        metadata: resAnalyticsRecord.metadata
                    };
                    let path = util_1.Util.dockerAnalyticsCameraPath() + resAnalyticsRecord.dockerNickname + pathSep.sep + "output" + pathSep.sep + util_1.Util.hash(str) + "." + resAnalyticsRecord.fileType;
                    reply.file(path, {
                        filename: resAnalyticsRecord.name + '.' + resAnalyticsRecord.fileType,
                        mode: 'inline',
                        confine: false
                    });
                }
                else {
                    reply(Boom.badRequest("Invail file type"));
                }
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
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
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const mongo = util_1.Util.getDb(request);
            const payload = request.payload;
            try {
                reply({
                    statusCode: 200,
                    message: "OK",
                });
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
    },
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
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            let mongo = util_1.Util.getDb(request);
            const payload = request.payload;
            console.log("revcive data from analytics " + payload.dockerNickname);
            payload.timedb = Date.now();
            payload.fileType = payload.fileType.toLowerCase();
            try {
                const resAssignAnalytics = yield mongo.collection('assignAnalytics').findOne({ nickname: payload.dockerNickname });
                if (!resAssignAnalytics) {
                    badrequest("Can't find docker contrainer" + payload.dockerNickname);
                }
                else {
                    let camInfo = resAssignAnalytics.cameraInfo;
                    if (payload && (payload.outputType == 'cropping-counting' || payload.outputType == 'cropping' || payload.outputType == 'detection' || payload.outputType == 'recognition' || payload.outputType == 'counting')) {
                        const insertAnalyticsRecord = yield mongo.collection('analytics-record').insertOne(payload);
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
                                badrequest("Can't find image file");
                            }
                            else {
                                var formData = new FormData();
                                formData.append('refId', camInfo._id.toString());
                                formData.append('type', payload.outputType);
                                formData.append('file', fs.createReadStream(path));
                                formData.append('ts', payload.ts);
                                formData.append('meta', "test");
                                console.log("sending data . . . .");
                                formData.submit('https://api.thailand-smartliving.com/v1/file/upload', (err, res) => {
                                    if (err) {
                                        console.log(err);
                                    }
                                    else {
                                        console.log("-----------------sent data to smart living--------------------");
                                    }
                                });
                            }
                        }
                        let resNotification = yield mongo.collection('notification').find({ dockerNickname: payload.dockerNickname }).sort({ timedb: -1 }).limit(1).toArray();
                        resNotification = resNotification[0];
                        if (!resNotification) {
                            console.log("Frist Notification " + payload.dockerNickname);
                            checkRule();
                        }
                        else {
                            let currentTime = new Date;
                            let limitTime = 5;
                            let analyticsDataTime = resNotification.timedb;
                            let diffTime = (currentTime - analyticsDataTime) / (1000 * 60);
                            console.log("difftime : " + diffTime);
                            if (diffTime > limitTime) {
                                console.log("Notification more 5 minute");
                                checkRule();
                            }
                            else {
                                reply({
                                    statusCode: 200,
                                    msg: "OK",
                                });
                            }
                        }
                        function checkRule() {
                            return __awaiter(this, void 0, void 0, function* () {
                                const resRules = yield mongo.collection('rules').find({ dockerNickname: payload.dockerNickname }).toArray();
                                if (resRules.length == 0) {
                                    console.log("No rule");
                                    reply({
                                        statusCode: 200,
                                        msg: "OK",
                                    });
                                }
                                else {
                                    console.log("Rule compare : ", resRules);
                                    for (let rule of resRules) {
                                        if (util_1.Util.isNotification(rule) && rule.status) {
                                            let notificationData = payload;
                                            notificationData.isRead = false;
                                            notificationData.isHide = false;
                                            let isNotification = false;
                                            if (rule.type == "cropping") {
                                                isNotification = true;
                                            }
                                            else if (rule.type == "counting") {
                                                if (rule.metadata.condition == "more") {
                                                    if (parseInt(rule.value) <= parseInt(payload.metadata.n))
                                                        isNotification = true;
                                                }
                                                else if (rule.metadata.condition == "less") {
                                                    if (parseInt(rule.value) >= parseInt(payload.metadata.n))
                                                        isNotification = true;
                                                }
                                            }
                                            if (isNotification) {
                                                const insertNotification = yield mongo.collection('notification').insertOne(notificationData);
                                                console.log("Insert notification success");
                                            }
                                        }
                                    }
                                    reply({
                                        statusCode: 200,
                                        msg: "OK",
                                    });
                                }
                            });
                        }
                    }
                    else {
                        badrequest("Please check 'outputType'");
                    }
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
            catch (error) {
                reply(Boom.badRequest(error));
            }
        })
    },
];
//# sourceMappingURL=analytic-record.js.map