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
const objectid = require('objectid');
const Joi = require('joi');
const jsonfile = require('jsonfile');
const YAML = require('yamljs');
const child_process = require('child_process');
const pathSep = require('path');
const writeyaml = require('write-yaml');
const fs = require('fs');
const { exec } = require('child_process');
const httprequest = require('request');
const ObjectIdMongo = require('mongodb').ObjectId;
const Boom = require("boom");
module.exports = [
    {
        method: 'GET',
        path: '/assignAnalytics',
        config: {
            tags: ['api'],
            description: 'Get All assignAnalytics data',
            notes: 'Get All assignAnalytics data'
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const mongo = util_1.Util.getDb(request);
            try {
                const resAssignAnalytics = yield mongo.collection('assignAnalytics').find().toArray();
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: resAssignAnalytics
                });
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
    },
    {
        method: 'GET',
        path: '/assignAnalytics/{id}',
        config: {
            tags: ['api'],
            description: 'Get All assignAnalytics data',
            notes: 'Get All assignAnalytics data',
            validate: {
                params: {
                    id: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const mongo = util_1.Util.getDb(request);
            try {
                const resAssignAnalytics = yield mongo.collection('assignAnalytics').findOne({ _id: ObjectIdMongo(request.params.id) });
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: resAssignAnalytics
                });
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
    },
    {
        method: 'GET',
        path: '/assignAnalytics/docker-nickname/{nickname}',
        config: {
            tags: ['api'],
            description: 'Get assignAnalytics data by docker nickname',
            notes: 'Get assignAnalytics data by docker nickname',
            validate: {
                params: {
                    nickname: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const mongo = util_1.Util.getDb(request);
            try {
                const resAssignAnalytics = yield mongo.collection('assignAnalytics').findOne({ nickname: request.params.nickname });
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: resAssignAnalytics
                });
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
    },
    {
        method: 'POST',
        path: '/assignAnalytics/insert',
        config: {
            tags: ['api'],
            description: 'Insert assignAnalytics data',
            notes: 'Insert assignAnalytics data',
            validate: {
                payload: {
                    nickname: Joi.string().required(),
                    nameAssignAnalytics: Joi.string(),
                    _refCameraId: Joi.string().required(),
                    _refAnalyticsId: Joi.string().required(),
                    environment: Joi.array().required(),
                }
            }
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const mongo = util_1.Util.getDb(request);
            let payload = request.payload;
            try {
                let nickname = payload.nickname;
                payload.status = 'stop';
                payload.timestamp = Date.now();
                payload.stopTime = Date.now();
                const resAnalytics = yield mongo.collection('analytics').findOne({ _id: ObjectIdMongo(payload._refAnalyticsId) });
                if (resAnalytics) {
                    const dockerAnalyticsCameraPath = util_1.Util.dockerAnalyticsCameraPath();
                    fs.stat(dockerAnalyticsCameraPath, function (err, stats) {
                        if (err) {
                            fs.mkdir(util_1.Util.uploadRootPath() + "docker-analytics-camera", (err) => {
                                if (err) {
                                }
                                existFile();
                            });
                        }
                        else {
                            existFile();
                        }
                        function existFile() {
                            return __awaiter(this, void 0, void 0, function* () {
                                const ReadYamlPath = util_1.Util.analyticsPath() + resAnalytics.analyticsFileInfo.name + pathSep.sep;
                                YAML.load(ReadYamlPath + 'docker-compose.yaml', (result) => {
                                    if (result != null) {
                                        if (typeof result.services != 'undefined') {
                                            let key = Object.keys(result.services);
                                            result.services[key[0]].container_name = nickname;
                                            result.services[key[0]].environment = request.payload.environment;
                                            fs.mkdir(util_1.Util.dockerAnalyticsCameraPath() + nickname, (err) => {
                                                if (err) {
                                                    console.log("can't create folder : \n" + err);
                                                    console.log(dockerAnalyticsCameraPath + nickname);
                                                }
                                                else {
                                                    writeyaml(dockerAnalyticsCameraPath + nickname + pathSep.sep + 'docker-compose.yml', result, (err) => __awaiter(this, void 0, void 0, function* () {
                                                        console.log('create folder and docker-compose.yaml file');
                                                        let analyticsInfo = resAnalytics;
                                                        const resCamera = yield mongo.collection('camera').findOne({ _id: ObjectIdMongo(payload._refCameraId) });
                                                        if (resCamera) {
                                                            let cameraInfo = resCamera;
                                                            let command = "nvidia-docker run --rm -td --name '" + nickname + "' -v ${HOME}/darknet-cropping -person/crop_data:/home/dev/darknet-cropping-person/crop_data -v ${HOME}/darknet-cropping-person/log_data:/home/dev/darknet-cropping-person/log_data embedded-performance-server.local:5000/eslab/darknet-cropping-person:latest /bin/sh -c './darknet detector demo cfg/coco.data cfg/yolo.cfg weights/yolo.weights";
                                                            payload.cmd = command + " '" + cameraInfo.rtsp + "''";
                                                            payload.type = analyticsInfo.analyticsProfile.name;
                                                            payload.analyticsInfo = analyticsInfo;
                                                            payload.cameraInfo = cameraInfo;
                                                            const insertAssignAnalytics = yield mongo.collection('assignAnalytics').insertOne(payload);
                                                            reply({
                                                                statusCode: 200,
                                                                msg: 'insert data success',
                                                            });
                                                        }
                                                        else {
                                                            reply(Boom.notFound);
                                                        }
                                                    }));
                                                }
                                            });
                                        }
                                        else {
                                            badRequest("YAML file can't find 'service'");
                                        }
                                    }
                                    else {
                                        badRequest("Can't Read YAML file \n path : " + ReadYamlPath);
                                    }
                                });
                            });
                        }
                    });
                }
                else {
                    reply(Boom.notFound);
                }
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
            function badRequest(msg) {
                reply(Boom.badRequest(msg));
            }
            function serverError(msg) {
                reply(Boom.badGateway(msg));
            }
        })
    },
    {
        method: 'GET',
        path: '/assignAnalytics/camera/{id}',
        config: {
            tags: ['api'],
            description: 'Get assignAnalytics data from camera id',
            notes: 'Get assignAnalytics data from camera id',
            validate: {
                params: {
                    id: Joi.string()
                        .required()
                }
            }
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const mongo = util_1.Util.getDb(request);
            try {
                const resAssignAnalytics = yield mongo.collection('assignAnalytics').findOne({ _refCameraId: request.params.id });
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: resAssignAnalytics
                });
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
    },
    {
        method: 'GET',
        path: '/assignAnalytics/analytics/{id}',
        config: {
            tags: ['api'],
            description: 'Get assignAnalytics data from analytics id',
            notes: 'Get assignAnalytics data from analytics id',
            validate: {
                params: {
                    id: Joi.string()
                        .required()
                }
            }
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const mongo = util_1.Util.getDb(request);
            try {
                const resAssignAnalytics = yield mongo.collection('assignAnalytics').findOne({ _refAnalyticsId: request.params.id });
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: resAssignAnalytics
                });
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
    },
    {
        method: 'POST',
        path: '/assignAnalytics/delete',
        config: {
            tags: ['api'],
            description: 'Delete assignAnalytics data',
            notes: 'Delete  assignAnalytics data',
            validate: {
                payload: {
                    _id: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                let payload = request.payload;
                const mongo = util_1.Util.getDb(request);
                const resAssign = yield mongo.collection('assignAnalytics').findOne({ _id: ObjectIdMongo(payload._id) });
                const cmd = "cd ../.." + util_1.Util.dockerAnalyticsCameraPath() + " &&  rm -rf " + resAssign.nickname + " && echo eslab";
                exec(cmd, (error, stdout, stderr) => __awaiter(this, void 0, void 0, function* () {
                    if (error) {
                        console.log("Error " + error);
                    }
                    else if (stdout) {
                        const delAssign = yield mongo.collection('assignAnalytics').deleteOne({ _id: ObjectIdMongo(payload._id) });
                        const delRules = yield mongo.collection('rules').deleteMany({ dockerNickname: resAssign.nickname });
                        const delNoti = yield mongo.collection('notification').deleteMany({ dockerNickname: resAssign.nickname });
                        reply({
                            statusCode: 200,
                            message: "OK",
                        });
                    }
                    else {
                        console.log("Stderr " + stderr);
                    }
                }));
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
    },
    {
        method: 'POST',
        path: '/assignAnalytics/container',
        config: {
            tags: ['api'],
            description: 'Update status assignAnalytics ',
            notes: 'Update status assignAnalytics',
            validate: {
                payload: {
                    id: Joi.string().required(),
                    command: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            let dbm = util_1.Util.getDb(request);
            try {
                const insertUser = yield dbm.collection('assignAnalytics').updateOne({ _id: ObjectIdMongo(request.payload.id) }, { $set: { status: request.payload.command } });
                reply({
                    statusCode: 200,
                    message: "OK",
                });
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
];
//# sourceMappingURL=assignAnalytics.js.map