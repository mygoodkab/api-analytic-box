"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db = require("../nosql-util");
const objectid = require('objectid');
const Joi = require('joi');
const jsonfile = require('jsonfile');
const child_process = require('child_process');
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
                    _refCameraId: Joi.string().required(),
                    _refAnalyticsId: Joi.string().required(),
                }
            }
        },
        handler: function (request, reply) {
            let payload = request.payload;
            if (payload) {
                payload._id = objectid();
                payload.status = 'stop';
                db.collection('analytics').find().make((builder) => {
                    builder.where('id', payload._refAnalyticsId);
                    builder.callback((err, res) => {
                        if (res.length == 0) {
                            return reply({
                                statusCode: 500,
                                message: "Have no Analytics data ",
                            });
                        }
                        else {
                            let analyticsInfo = res[0];
                            db.collection('camera').find().make((builder) => {
                                builder.where('_id', payload._refCameraId);
                                builder.callback((err, res) => {
                                    if (res.length == 0) {
                                        return reply({
                                            statusCode: 500,
                                            message: "Have no camera data ",
                                        });
                                    }
                                    else {
                                        payload.nickname = payload._id;
                                        let cameraInfo = res[0];
                                        let command = "nvidia-docker run --rm -td --name '" + payload.nickname + "' -v ${HOME}/darknet-cropping -person/crop_data:/home/dev/darknet-cropping-person/crop_data -v ${HOME}/darknet-cropping-person/log_data:/home/dev/darknet-cropping-person/log_data embedded-performance-server.local:5000/eslab/darknet-cropping-person:latest /bin/sh -c './darknet detector demo cfg/coco.data cfg/yolo.cfg weights/yolo.weights";
                                        let doublecode = String.fromCharCode(34);
                                        payload.cmd = command + " '" + cameraInfo.rtsp + "''";
                                        payload.type = analyticsInfo.analyticsProfile.name;
                                        payload.analyticsInfo = analyticsInfo;
                                        payload.cameraInfo = cameraInfo;
                                        db.collection('assignAnalytics').insert(request.payload);
                                        db.collection('assignAnalytics').modify({ status: 'stop' }).make((builder) => {
                                            builder.where("_refCameraId", payload._refCameraId);
                                            builder.where("status", "start");
                                            builder.callback((err, res) => {
                                                if (err || res.length == 0) {
                                                    return reply({
                                                        statusCode: 400,
                                                        msg: 'have no assignAnalytics data to stop docker',
                                                    });
                                                }
                                                else {
                                                    return reply({
                                                        statusCode: 200,
                                                        msg: 'stop docker and updata status success',
                                                    });
                                                }
                                            });
                                        });
                                    }
                                });
                            });
                        }
                    });
                });
            }
            else
                return reply({
                    statusCode: 400,
                    message: "Bad Request",
                    data: "No payload"
                });
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
            db.collection('assignAnalytics').remove().make((builder) => {
                builder.where("_id", request.payload._id);
                builder.callback((err, res) => {
                    if (err) {
                        return reply({
                            statusCode: 500,
                            message: "Can't delete id : " + request.payload._id,
                        });
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
            if (request.payload.command == "1") {
                status = "stop";
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