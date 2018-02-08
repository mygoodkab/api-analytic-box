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
        path: '/camera',
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
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const mongo = util_1.Util.getDb(request);
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
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const mongo = util_1.Util.getDb(request);
            let payload = request.payload;
            let payloadUpdate = {
                ip: payload.ip,
                name: payload.name,
                username: payload.username,
                password: payload.password,
                brand: payload.brand,
                model: payload.model,
                rtsp: payload.rtsp,
                mac: payload.mac,
                location: payload.location,
                status: payload.status,
            };
            try {
                request.payload.updateDate = new Date();
                const updateCamera = yield mongo.collection('camera').updateOne({ _id: ObjectId(payload._id) }, { $set: payloadUpdate });
                const updateAssignAnalytics = yield mongo.collection('assignAnalytics').updateMany({ _refCameraId: payload._id }, { $set: { cameraInfo: payloadUpdate } });
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: "Update Succeed"
                });
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
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
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                let payload = request.payload;
                const mongo = util_1.Util.getDb(request);
                const camera = yield mongo.collection('assignAnalytics').findOne({ _refCameraId: payload._id });
                if (!camera) {
                    const removeAnalytics = yield mongo.collection('camera').deleteOne({ _id: ObjectId(payload._id) });
                    reply({
                        statusCode: 200,
                        message: "OK",
                    });
                }
                else {
                    reply(Boom.badRequest("this camera's using : " + camera));
                }
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
    },
];
//# sourceMappingURL=camera.js.map