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
const db = require("../nosql-util");
const util_1 = require("../util");
var ObjectId = require('mongodb').ObjectId;
const find = require('find-process');
const objectid = require('objectid');
const Joi = require('joi');
const jsonfile = require('jsonfile');
var child_process = require('child_process');
var fork = require('child_process').fork;
const { exec } = require('child_process');
const Boom = require("boom");
module.exports = [
    {
        method: 'GET',
        path: '/camera',
        config: {
            tags: ['api'],
            description: 'Get All camera data',
            notes: 'Get All camera data'
        },
        handler: (request, reply) => {
            db.collection('camera').find().make((builder) => {
                builder.callback((err, res) => {
                    reply({
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
        path: '/camera/{id}',
        config: {
            tags: ['api'],
            description: 'Get id camera data',
            notes: 'Get id camera data',
            validate: {
                params: {
                    id: Joi.string()
                        .required()
                        .description('id feature'),
                }
            }
        },
        handler: (request, reply) => {
            db.collection('camera').find().make((builder) => {
                builder.where('_id', request.params.id);
                builder.callback((err, res) => {
                    reply({
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
        path: '/camera/insert',
        config: {
            tags: ['api'],
            description: 'Insert camera data',
            notes: 'Insert camera data',
            validate: {
                payload: {
                    ip: Joi.string().required(),
                    name: Joi.string().required(),
                    username: Joi.string().required(),
                    password: Joi.string().required(),
                    brand: Joi.string().required(),
                    model: Joi.string().required(),
                    rtsp: Joi.string().required(),
                    mac: Joi.string(),
                    location: Joi.string(),
                    status: Joi.string(),
                }
            }
        },
        handler: function (request, reply) {
            db.collection('camera').find().make((builder) => {
                builder.sort("portrelay", true);
                builder.first();
                builder.callback((err, res) => {
                    let payload = request.payload;
                    if (!res) {
                        payload.portffmpeg = 8081;
                        payload.portrelay = 8082;
                    }
                    else if (err) {
                        reply({
                            statusCode: 400,
                            message: "Bad request",
                        });
                    }
                    else {
                        payload.portffmpeg = res.portrelay + 1;
                        payload.portrelay = res.portrelay + 2;
                    }
                    payload._id = objectid();
                    payload.updateDate = new Date();
                    payload.runrelay = "cd ../JSMpeg node websocket-relay.js embedded " + payload.portffmpeg + " " + payload.portrelay;
                    payload.cmdffmpeg = "ffmpeg -f rtsp  -rtsp_transport tcp -i \"" + payload.rtsp + "\" -f mpegts -codec:v mpeg1video -s 640x480 -b:v 1000k -bf 0 http://localhost:" + payload.portffmpeg + "/embedded";
                    db.collection('camera').insert(request.payload).callback(function (err) {
                        if (err) {
                            reply({
                                statusCode: 500,
                                message: "can't insert data",
                            });
                        }
                        reply({
                            statusCode: 200,
                            message: "OK",
                            data: "insert success"
                        });
                    });
                });
            });
        }
    },
    {
        method: 'POST',
        path: '/camera/update',
        config: {
            tags: ['api'],
            description: 'Update camera data',
            notes: 'Update camera data',
            validate: {
                payload: {
                    _id: Joi.string().required(),
                    ip: Joi.string(),
                    name: Joi.string(),
                    username: Joi.string(),
                    password: Joi.string(),
                    brand: Joi.string(),
                    model: Joi.string(),
                    rtsp: Joi.string(),
                    mac: Joi.string(),
                    location: Joi.string(),
                    status: Joi.string(),
                }
            }
        },
        handler: function (request, reply) {
            if (request.payload) {
                request.payload.updateDate = new Date();
                db.collection('camera').modify(request.payload).make(function (builder) {
                    builder.where("_id", request.payload._id);
                    builder.callback(function (err, res) {
                        db.collection('camera').find().make(function (builder) {
                            builder.where("_id", request.payload._id);
                            builder.first();
                            builder.callback(function (err, res) {
                                db.collection('assignAnalytics').modify({ cameraInfo: res }).make(function (builder) {
                                    builder.where("_refCameraId", request.payload._id);
                                    builder.callback(function (err, res) {
                                        if (err) {
                                            reply({
                                                statusCode: 400,
                                                message: "Bad Request",
                                            });
                                        }
                                        reply({
                                            statusCode: 200,
                                            message: "OK",
                                            data: "Update Succeed"
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            }
            else {
                reply({
                    statusCode: 400,
                    message: "Bad Request",
                    data: "No payload"
                });
            }
        }
    },
    {
        method: 'POST',
        path: '/camera/delete',
        config: {
            tags: ['api'],
            description: 'Delete camera data',
            notes: 'Delete  camera data',
            validate: {
                payload: {
                    _id: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => {
            db.collection('assignAnalytics').find().make((builder) => {
                builder.where("_refCameraId", request.payload._id);
                builder.first();
                builder.callback((err, res) => {
                    if (typeof res == 'undefined') {
                        db.collection('camera').remove().make((builder) => {
                            builder.where("_id", request.payload._id);
                            builder.callback((err, res) => {
                                if (err) {
                                    reply({
                                        statusCode: 500,
                                        message: "Can't delete id : " + request.payload._id,
                                    });
                                }
                                else {
                                    reply({
                                        statusCode: 200,
                                        message: "OK",
                                    });
                                }
                            });
                        });
                    }
                    else {
                        reply({
                            statusCode: 500,
                            message: "Some data's used in assignAnalytics",
                        });
                    }
                });
            });
        }
    },
    {
        method: 'POST',
        path: '/camera/write-file-json',
        config: {
            tags: ['api'],
            description: 'Write file json',
            notes: 'Write file json',
            validate: {
                payload: {
                    configFile: Joi.string().required(),
                    cmdShell: Joi.string().required(),
                    analyticName: Joi.string().required(),
                }
            }
        },
        handler: function (request, reply) {
            if (request.payload) {
                var obj = request.payload;
                var file = 'C:/Users/ESLab/Desktop/analyticbox-api/src/tmp/' + obj.configFile + '.json';
                jsonfile.writeFile(file, obj, function (err) {
                    if (err) {
                        console.error(err);
                        reply({
                            statusCode: 500,
                            message: "Server Error",
                        });
                    }
                    else {
                        reply({
                            statusCode: 200,
                            message: "OK",
                            data: "insert success"
                        });
                    }
                });
            }
            else
                reply({
                    statusCode: 400,
                    message: "Bad Request",
                    data: "No payload"
                });
        }
    },
    {
        method: 'POST',
        path: '/camera/stream',
        config: {
            tags: ['api'],
            description: 'Stream video',
            notes: 'tream video',
            validate: {
                payload: {
                    _id: Joi.string().required(),
                }
            }
        },
        handler: function (request, reply) {
            if (request.payload) {
                db.collection('camera').find().make(function (builder) {
                    builder.where("_id", request.payload._id);
                    builder.first();
                    builder.callback(function (err, res) {
                        var child = fork('./JSMpeg/websocket-relay', ['embedded', res.portffmpeg, res.portrelay]);
                        child_process.exec(res.cmdffmpeg, function (error, stdout, stderr) {
                            if (stdout) {
                                console.log(stdout);
                            }
                            else if (stderr) {
                                console.log(stderr);
                            }
                            else {
                                console.log(error);
                            }
                        });
                        reply({
                            statusCode: 200,
                            message: "OK",
                        });
                    });
                });
            }
            else {
                reply({
                    statusCode: 400,
                    message: "Bad Request",
                    data: "No payload"
                });
            }
        }
    },
    {
        method: 'POST',
        path: '/camera/insert1',
        config: {
            tags: ['api'],
            description: 'Insert camera data',
            notes: 'Insert camera data',
            validate: {
                payload: {
                    ip: Joi.string().required(),
                    name: Joi.string().required(),
                    username: Joi.string().required(),
                    password: Joi.string().required(),
                    brand: Joi.string().required(),
                    model: Joi.string().required(),
                    rtsp: Joi.string().required(),
                    mac: Joi.string(),
                    location: Joi.string(),
                    status: Joi.string(),
                }
            }
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            let payload = request.payload;
            try {
                const mongo = util_1.Util.getDb(request);
                const resCamera = yield mongo.collection('camera').find().sort({ portrelay: -1 }).limit(1).toArray();
                if (resCamera.length == 0) {
                    payload.portffmpeg = 8081;
                    payload.portrelay = 8082;
                }
                else {
                    payload.portffmpeg = resCamera[0].portrelay + 1;
                    payload.portrelay = resCamera[0].portrelay + 2;
                }
                payload.updateDate = new Date();
                payload.runrelay = "cd ../JSMpeg node websocket-relay.js embedded " + payload.portffmpeg + " " + payload.portrelay;
                payload.cmdffmpeg = "ffmpeg -f rtsp  -rtsp_transport tcp -i \"" + payload.rtsp + "\" -f mpegts -codec:v mpeg1video -s 640x480 -b:v 1000k -bf 0 http://localhost:" + payload.portffmpeg + "/embedded";
                const insertCamera = yield mongo.collection('camera').insertOne(payload);
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: "insert success"
                });
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
    },
    {
        method: 'GET',
        path: '/camera1',
        config: {
            tags: ['api'],
            description: 'Get All camera data',
            notes: 'Get All camera data'
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const mongo = util_1.Util.getDb(request);
            try {
                const resCamera = yield mongo.collection('camera').find().toArray();
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: resCamera
                });
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
    },
    {
        method: 'GET',
        path: '/camera1/{id}',
        config: {
            tags: ['api'],
            description: 'Get id camera data',
            notes: 'Get id camera data',
            validate: {
                params: {
                    id: Joi.string()
                        .required()
                        .description('id feature'),
                }
            }
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const mongo = util_1.Util.getDb(request);
            console.log(request.params.id);
            try {
                const resCamera = yield mongo.collection('camera').findOne({ _id: ObjectId(request.params.id) });
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: resCamera
                });
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
    }
];
//# sourceMappingURL=camera.js.map