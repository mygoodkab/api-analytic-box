//============================================================================================================
//                                           Assign analytic
// Data 
//    _refCameraId    :  payload
//    _refAnalyticsId :  payload
//    id              :  auto
//    status          :  auto
//    cmd             :  join from Analytics and Camera 
//    nickname        :  auto (same id)
//    type            :  join from Analytics
//============================================================================================================
import * as db from '../nosql-util';
import { Util } from '../util';
const objectid = require('objectid');
const Joi = require('joi')
const jsonfile = require('jsonfile')
const YAML = require('yamljs');
const child_process = require('child_process');
const pathSep = require('path');
const writeyaml = require('write-yaml');
const fs = require('fs')
const { exec } = require('child_process');
const httprequest = require('request');
const ObjectIdMongo = require('mongodb').ObjectId;
import * as  Boom from 'boom'
module.exports = [

    //=======================================================================================================================================
    { // Get all assignAnalytics
        method: 'GET',
        path: '/assignAnalytics',
        config: {
            tags: ['api'],
            description: 'Get All assignAnalytics data',
            notes: 'Get All assignAnalytics data'
        },
        handler: async (request, reply) => {
            const mongo = Util.getDb(request)
            try {
                const resAssignAnalytics = await mongo.collection('assignAnalytics').find().toArray()
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: resAssignAnalytics
                })
            } catch (error) {
                reply(Boom.badGateway(error))
            }

        }
    },
    { // Get assignAnalytics by id
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
        handler: async (request, reply) => {
            const mongo = Util.getDb(request)
            try {
                const resAssignAnalytics = await mongo.collection('assignAnalytics').findOne({ _id: ObjectIdMongo(request.params.id) })
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: resAssignAnalytics
                })
            } catch (error) {
                reply(Boom.badGateway(error))
            }
        }
    },
    { // Get assignAnalytics by dockernickname
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
        handler: async (request, reply) => {
            const mongo = Util.getDb(request)
            try {
                const resAssignAnalytics = await mongo.collection('assignAnalytics').findOne({ nickname: request.params.nickname })
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: resAssignAnalytics
                })
            } catch (error) {
                reply(Boom.badGateway(error))
            }
        }
    },
    { // Insert assignAnalytics
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
        handler: async (request, reply) => {
            const mongo = Util.getDb(request)
            let payload = request.payload;
            try {
                let nickname = payload.nickname;
                payload.status = 'stop';
                payload.timestamp = Date.now()
                payload.stopTime = Date.now()
                const resAnalytics: any = await mongo.collection('analytics').findOne({ _id: ObjectIdMongo(payload._refAnalyticsId) })
                if (resAnalytics) {
                    const dockerAnalyticsCameraPath = Util.dockerAnalyticsCameraPath()
                    fs.stat(dockerAnalyticsCameraPath, function (err, stats) {
                        if (err) { // if file  docker-analytics-camera not exist
                            fs.mkdir(Util.uploadRootPath() + "docker-analytics-camera", (err) => {
                                if (err) {
                                    // serverError("can't create folder docker-analytics-camera \n" + err)
                                }
                                existFile()
                            })
                        } else { // if file docker-analytics-camera exist
                            existFile()
                        }
                        async function existFile() {
                            // read file yaml => change environment => generate docker-compose.yaml
                            const ReadYamlPath = Util.analyticsPath() + resAnalytics.analyticsFileInfo.name + pathSep.sep
                            // read file yaml 
                            YAML.load(ReadYamlPath + 'docker-compose.yaml', (result) => {
                                if (result != null) {
                                    //console.log("Read YAML file from " + result)
                                    if (typeof result.services != 'undefined') {
                                        let key = Object.keys(result.services) // json docker-compose  result.services
                                        // change environment 
                                        result.services[key[0]].container_name = nickname;
                                        result.services[key[0]].environment = request.payload.environment;
                                        // create folder by nickname docker 
                                        fs.mkdir(Util.dockerAnalyticsCameraPath() + nickname, (err) => {
                                            if (err) {
                                                console.log("can't create folder : \n" + err)
                                                console.log(dockerAnalyticsCameraPath + nickname)
                                                //serverError("can't create folder : \n" + err)
                                            } else {
                                                //write file docker-compose.yml
                                                writeyaml(dockerAnalyticsCameraPath + nickname + pathSep.sep + 'docker-compose.yml', result, async (err) => {

                                                    console.log('create folder and docker-compose.yaml file')
                                                    let analyticsInfo = resAnalytics;
                                                    const resCamera: any = await mongo.collection('camera').findOne({ _id: ObjectIdMongo(payload._refCameraId) })
                                                    if (resCamera) {
                                                        let cameraInfo = resCamera;
                                                        let command = "nvidia-docker run --rm -td --name '" + nickname + "' -v ${HOME}/darknet-cropping -person/crop_data:/home/dev/darknet-cropping-person/crop_data -v ${HOME}/darknet-cropping-person/log_data:/home/dev/darknet-cropping-person/log_data embedded-performance-server.local:5000/eslab/darknet-cropping-person:latest /bin/sh -c './darknet detector demo cfg/coco.data cfg/yolo.cfg weights/yolo.weights"
                                                        payload.cmd = command + " '" + cameraInfo.rtsp + "''";
                                                        payload.type = analyticsInfo.analyticsProfile.name;
                                                        payload.analyticsInfo = analyticsInfo;
                                                        payload.cameraInfo = cameraInfo
                                                        const insertAssignAnalytics = await mongo.collection('assignAnalytics').insertOne(payload)
                                                        reply({
                                                            statusCode: 200,
                                                            msg: 'insert data success',
                                                        })
                                                    } else {
                                                        reply(Boom.notFound)
                                                    }
                                                });
                                            }

                                        })

                                    } else {
                                        badRequest("YAML file can't find 'service'")
                                    }
                                } else {
                                    badRequest("Can't Read YAML file \n path : " + ReadYamlPath)
                                }
                            })
                        }
                    })
                } else {
                    reply(Boom.notFound)
                }
            } catch (error) {
                reply(Boom.badGateway(error))
            }

            function badRequest(msg) {
                reply(Boom.badRequest(msg))
            }

            function serverError(msg) {
                reply(Boom.badGateway(msg))
            }
        }

    },
    { // Get assignAnalytics by Camera id
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
        handler: async (request, reply) => {
            const mongo = Util.getDb(request)
            try {
                const resAssignAnalytics = await mongo.collection('assignAnalytics').findOne({ _refCameraId: request.params.id })
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: resAssignAnalytics
                })
            } catch (error) {
                reply(Boom.badGateway(error))
            }
        }
    },
    { // Get assignAnalytics by Analytics id
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
        handler: async (request, reply) => {
            const mongo = Util.getDb(request)
            try {
                const resAssignAnalytics = await mongo.collection('assignAnalytics').findOne({ _refAnalyticsId: request.params.id })
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: resAssignAnalytics
                })
            } catch (error) {
                reply(Boom.badGateway(error))
            }
        }

    },
    { // Delete
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
        handler: async (request, reply) => {
            try {
                let payload = request.payload;
                const mongo = Util.getDb(request)
                const resAssign = await mongo.collection('assignAnalytics').findOne({ _id: ObjectIdMongo(payload._id) })
                let path = Util.dockerAnalyticsCameraPath() + resAssign.nickname
                //const test = "cd ../.." + Util.analyticsPath() + " && ls"
                if (Util.removeFile(path)) {
                    const delAssign = await mongo.collection('assignAnalytics').deleteOne({ _id: ObjectIdMongo(payload._id) })
                    const delRules = await mongo.collection('rules').deleteMany({ dockerNickname: resAssign.nickname })
                    const delNoti = await mongo.collection('notification').deleteMany({ dockerNickname: resAssign.nickname })
                    reply({
                        statusCode: 200,
                        message: "OK",
                    })
                } else {
                    reply({
                        statusCode: 400,
                        message: "Can't remove no such file or dir " + path
                    })
                }
            }
            catch (error) {
                reply(Boom.badGateway(error))
            }
        }
    },
    { // Update status assignAnalytics stop/start
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
        handler: async (request, reply) => {
            // let status = ""
            // if (request.payload.command == "start" || request.payload.command == "stop") {
            //     status = ""
            // } else if (request.payload.command == "2") {
            //     status = "start"
            // } else {
            //     status = "restart"
            // }

            let dbm = Util.getDb(request)
            try {
                const insertUser = await dbm.collection('assignAnalytics').updateOne({ _id: ObjectIdMongo(request.payload.id) }, { $set: { status: request.payload.command } })
                reply({
                    statusCode: 200,
                    message: "OK",
                })
                reply({
                    statusCode: 200,
                    message: "OK",
                })
            } catch (error) {
                reply(Boom.badGateway(error))
            }
        }
    },

]