"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db = require("../nosql-util");
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
module.exports = [
    {
        method: 'GET',
        path: '/assignAnalytics',
        config: {
            tags: ['api'],
            description: 'Get All assignAnalytics data',
            notes: 'Get All assignAnalytics data'
        },
        handler: (request, reply) => {
            db.collection('assignAnalytics').find().make((builder) => {
                builder.callback((err, res) => {
                    if (res.length == 0) {
                        return reply({
                            statusCode: 404,
                            message: "No data",
                        });
                    }
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
        handler: (request, reply) => {
            db.collection('assignAnalytics').find().make((builder) => {
                builder.where('_id', request.params.id);
                builder.first();
                builder.callback((err, res) => {
                    if (err || typeof res == 'undefined') {
                        return reply({
                            statusCode: 400,
                            message: "Error have no data from this id",
                        });
                    }
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
        method: 'POST',
        path: '/assignAnalytics/insert',
        config: {
            tags: ['api'],
            description: 'Insert assignAnalytics data',
            notes: 'Insert assignAnalytics data',
            validate: {
                payload: {
                    nickname: Joi.string().required(),
                    _refCameraId: Joi.string().required(),
                    _refAnalyticsId: Joi.string().required(),
                    environment: Joi.array().required(),
                }
            }
        },
        handler: function (request, reply) {
            let payload = request.payload;
            if (payload) {
                payload._id = objectid();
                let nickname = payload.nickname;
                payload.status = 'stop';
                payload.timestamp = Date.now();
                payload.stopTime = Date.now();
                db.collection('analytics').find().make((builder) => {
                    builder.where('id', payload._refAnalyticsId);
                    builder.callback((err, res) => {
                        if (res.length == 0) {
                            badRequest("Have no Analytics data ");
                        }
                        else {
                            const dockerAnalyticsCameraPath = util_1.Util.dockerAnalyticsCameraPath();
                            fs.stat(dockerAnalyticsCameraPath, function (err, stats) {
                                if (err) {
                                    fs.mkdir(util_1.Util.uploadRootPath() + "docker-analytics-camera", (err) => {
                                        if (err) {
                                            serverError("can't create folder docker-analytics-camera \n" + err);
                                        }
                                        existFile();
                                    });
                                }
                                else {
                                    existFile();
                                }
                                function existFile() {
                                    const ReadYamlPath = util_1.Util.analyticsPath() + res[0].analyticsFileInfo.name + pathSep.sep;
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
                                                        serverError("can't create folder : \n" + err);
                                                    }
                                                    else {
                                                        writeyaml(dockerAnalyticsCameraPath + nickname + pathSep.sep + 'docker-compose.yml', result, function (err) {
                                                            if (err) {
                                                                badRequest(err);
                                                            }
                                                            else {
                                                                console.log('create folder and docker-compose.yaml file');
                                                                let analyticsInfo = res[0];
                                                                db.collection('camera').find().make((builder) => {
                                                                    builder.where('_id', payload._refCameraId);
                                                                    builder.callback((err, res) => {
                                                                        if (res.length == 0) {
                                                                            badRequest("Have no camera data");
                                                                        }
                                                                        else {
                                                                            let cameraInfo = res[0];
                                                                            let command = "nvidia-docker run --rm -td --name '" + nickname + "' -v ${HOME}/darknet-cropping -person/crop_data:/home/dev/darknet-cropping-person/crop_data -v ${HOME}/darknet-cropping-person/log_data:/home/dev/darknet-cropping-person/log_data embedded-performance-server.local:5000/eslab/darknet-cropping-person:latest /bin/sh -c './darknet detector demo cfg/coco.data cfg/yolo.cfg weights/yolo.weights";
                                                                            payload.cmd = command + " '" + cameraInfo.rtsp + "''";
                                                                            payload.type = analyticsInfo.analyticsProfile.name;
                                                                            payload.analyticsInfo = analyticsInfo;
                                                                            payload.cameraInfo = cameraInfo;
                                                                            db.collection('assignAnalytics').insert(request.payload).callback((err) => {
                                                                                if (err) {
                                                                                    serverError("Can't insert data in AssignAnalytics");
                                                                                }
                                                                                return reply({
                                                                                    statusCode: 200,
                                                                                    msg: 'insert data success',
                                                                                });
                                                                            });
                                                                        }
                                                                    });
                                                                });
                                                            }
                                                        });
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
                                }
                            });
                        }
                    });
                });
            }
            else {
                badRequest("No data in payload");
            }
            function badRequest(msg) {
                return reply({
                    statusCode: 400,
                    message: "Bad Request",
                    data: msg
                });
            }
            function serverError(msg) {
                return reply({
                    statusCode: 500,
                    message: "Bad Request",
                    data: msg
                });
            }
        }
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
        handler: (request, reply) => {
            db.collection('assignAnalytics').find().make((builder) => {
                builder.where("_id", request.payload._id);
                builder.first();
                builder.callback((err, res) => {
                    if (err) {
                        return reply({
                            statusCode: 500,
                            message: "Can't delete id : " + request.payload._id,
                        });
                    }
                    else {
                        const cmd = "cd ../.." + util_1.Util.dockerAnalyticsCameraPath() + " &&  rm -rf " + res.nickname + " && echo eslab";
                        exec(cmd, (error, stdout, stderr) => {
                            if (error) {
                                console.log("Error " + error);
                                badRequest("Error " + error);
                            }
                            else if (stdout) {
                                db.collection('assignAnalytics').remove().make((builder) => {
                                    builder.where("_id", request.payload._id);
                                    builder.callback((err, res) => {
                                        if (err) {
                                            badRequest("Can't Delete data");
                                        }
                                        else {
                                            return reply({
                                                statusCode: 200,
                                                message: "OK",
                                            });
                                        }
                                    });
                                });
                            }
                            else {
                                console.log("Stderr " + stderr);
                                badRequest("Stderr" + stderr);
                            }
                        });
                    }
                });
            });
            function badRequest(msg) {
                return reply({
                    statusCode: 400,
                    message: "OK",
                    data: msg
                });
            }
        }
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
        handler: (request, reply) => {
            db.collection('assignAnalytics').find().make((builder) => {
                builder.where('_refCameraId', request.params.id);
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
        handler: (request, reply) => {
            db.collection('assignAnalytics').find().make((builder) => {
                builder.where('_refAnalyticsId', request.params.id);
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
        handler: (request, reply) => {
            let status = "";
            if (request.payload.command == "start" || request.payload.command == "stop") {
                status = "";
            }
            else if (request.payload.command == "2") {
                status = "start";
            }
            else {
                status = "restart";
            }
            db.collection('assignAnalytics').modify({ status: status }).make((builder) => {
                builder.where('_id', request.payload.id);
                builder.callback((err, res) => {
                    if (err) {
                        return reply({
                            statusCode: 400,
                            message: "Bad request",
                        });
                    }
                    return reply({
                        statusCode: 200,
                        message: "OK",
                    });
                });
            });
        }
    }
];
//# sourceMappingURL=assignAnalytics.js.map