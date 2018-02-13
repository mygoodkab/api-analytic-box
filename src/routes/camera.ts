import * as db from '../nosql-util';
import { Util } from '../util';
var ObjectId = require('mongodb').ObjectId;
const find = require('find-process');
const objectid = require('objectid');
const Joi = require('joi')
const jsonfile = require('jsonfile')
var child_process = require('child_process');
var fork = require('child_process').fork;
const fs = require('fs');
const pathSep = require('path');
//import { sqliteUtil } from '../sqlite-util';
//import { dbpath } from '../server';
const { exec } = require('child_process');
import * as  Boom from 'boom'
module.exports = [

    {  // Insert camera profile
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
                    file: Joi.any().meta({ swaggerType: 'file' }).description('upload image'),
                }
            },
            payload: {
                maxBytes: 5000000,
                parse: true,
                output: 'stream',
                allow: 'multipart/form-data'
            },
        },
        handler: async (request, reply) => {
            let payload = request.payload;
            try {
                const mongo = Util.getDb(request)
                const resCamera: any = await mongo.collection('camera').find().sort({ portrelay: -1 }).limit(1).toArray()

                if (resCamera.length == 0) {
                    payload.portffmpeg = 8081;
                    payload.portrelay = 8082;
                } else {
                    payload.portffmpeg = resCamera[0].portrelay + 1
                    payload.portrelay = resCamera[0].portrelay + 2
                }
                payload.updateDate = new Date();
                payload.runrelay = "cd ../JSMpeg node websocket-relay.js embedded " + payload.portffmpeg + " " + payload.portrelay;
                payload.cmdffmpeg = "ffmpeg -f rtsp  -rtsp_transport tcp -i \"" + payload.rtsp + "\" -f mpegts -codec:v mpeg1video -s 640x480 -b:v 1000k -bf 0 http://localhost:" + payload.portffmpeg + "/embedded";
                if (payload.file) {
                    if (!Util.existFolder(Util.imageCamera())) {
                        console.log("create file camera image")
                    }
                    let filename = payload.file.hapi.filename.split('.');
                    let fileType = filename.splice(filename.length - 1, 1)[0];
                    if (fileType.toLowerCase() == 'png' || fileType.toLowerCase() == 'jpg' || fileType.toLowerCase() == 'jpeg') {
                        filename = filename.join('.')
                        let storeName = Util.uniqid() + "." + fileType.toLowerCase()
                        // create imageInfo for insert info db
                        let id = objectid()
                        let fileInfo: any = {
                            id: id,
                            name: filename,
                            storeName: storeName,
                            fileType: fileType,
                            ts: new Date(),
                        }
                        // create file Stream
                        const imageCamera = Util.imageCamera() + storeName
                        let file = fs.createWriteStream(imageCamera);
                        payload.file.pipe(file);
                        payload.file.on('end', (err: any) => {
                            const filestat = fs.statSync(imageCamera);
                            fileInfo.fileSize = filestat.size;
                            fileInfo.createdata = new Date();
                        })
                        payload.file = fileInfo
                    } else {
                        reply(Boom.badRequest("Invalid file type"))
                    }

                }
                const insertCamera: any = await mongo.collection('camera').insertOne(payload)
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: "insert success"
                })
            } catch (error) {
                reply(Boom.badGateway(error))
            }
        }
    },
    {  // Get all camera profile
        method: 'GET',
        path: '/camera',
        config: {
            tags: ['api'],
            description: 'Get All camera data',
            notes: 'Get All camera data'
        },
        handler: async (request, reply) => {
            const mongo = Util.getDb(request)
            try {
                const resCamera = await mongo.collection('camera').find().toArray()
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: resCamera
                })
            } catch (error) {
                reply(Boom.badGateway(error))
            }
        }
    },
    {  // Get id camera profile
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
        handler: async (request, reply) => {

            const mongo = Util.getDb(request)
            try {
                const resCamera = await mongo.collection('camera').findOne({ _id: ObjectId(request.params.id) })
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: resCamera
                })
            } catch (error) {
                reply(Boom.badGateway(error))
            }
        }
    },
    {  // Update camera profile && cameraInfo in assignAnalytics
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
        handler: async (request, reply) => {
            const mongo = Util.getDb(request)
            let payload = request.payload
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
            }
            try {
                request.payload.updateDate = new Date()
                const updateCamera = await mongo.collection('camera').updateOne({ _id: ObjectId(payload._id) }, { $set: payloadUpdate })
                const updateAssignAnalytics = await mongo.collection('assignAnalytics').updateMany({ _refCameraId: payload._id }, { $set: { cameraInfo: payloadUpdate } })
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: "Update Succeed"
                })
            }
            catch (error) {
                reply(Boom.badGateway(error))
            }
        }
    },
    {  // Delete camera profile 
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
        handler: async (request, reply) => {
            try {
                let payload = request.payload;
                const mongo = Util.getDb(request)
                const camera = await mongo.collection('assignAnalytics').findOne({ _refCameraId: payload._id })

                if (!camera) {
                    const removeAnalytics: any = await mongo.collection('camera').deleteOne({ _id: ObjectId(payload._id) })
                    reply({
                        statusCode: 200,
                        message: "OK",
                    })

                } else {
                    reply(Boom.badRequest("this camera's using : " + camera))

                }
            }
            catch (error) {
                reply(Boom.badGateway(error))
            }
        }
    },
    {  // Get image file
        method: 'GET',
        path: '/camera/image/{id}',
        config: {
            tags: ['api'],
            description: 'Get image for UI',
            notes: 'Get image ',
            validate: {
                params: {
                    id: Joi.string().required().description('id camera')
                }
            }
        },
        handler: async (request, reply) => {
            const mongo = Util.getDb(request)
            try {
                const resCamera = await mongo.collection('camera').findOne({ _id: ObjectId(request.params.id) })
                if (!resCamera) {
                    reply({
                        statusCode: 404,
                        message: "Bad Request",
                        data: "Data not found"
                    })
                } else {

                    let path: any = Util.imageCamera() + resCamera.file.storeName
                    reply.file(path,
                        {
                            filename: resCamera.imageInfo.name + '.' + resCamera.imageInfo.fileType,
                            mode: 'inline'
                        })

                }
            } catch (error) {
                reply(Boom.badGateway(error))
            }
        }
    },
];