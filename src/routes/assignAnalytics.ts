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
    { // Get all assignAnalytics
        method: 'GET',
        path: '/assignAnalytics',
        config: {
            tags: ['api'],
            description: 'Get All assignAnalytics data',
            notes: 'Get All assignAnalytics data'
        },
        handler: (request, reply) => {
            db.collection('assignAnalytics').find().make((builder: any) => {
                builder.callback((err: any, res: any) => {
                    if (res.length == 0) {
                        reply({
                            statusCode: 404,
                            message: "No data",
                        })
                    } else {
                        reply({
                            statusCode: 200,
                            message: "OK",
                            data: res
                        })
                    }

                });
            });
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
        handler: (request, reply) => {
            db.collection('assignAnalytics').find().make((builder: any) => {
                builder.where('_id', request.params.id)
                builder.first()
                builder.callback((err: any, res: any) => {
                    if (err || !res) {
                        reply({
                            statusCode: 400,
                            message: "Error have no data from this id",
                        })
                    } else {
                        reply({
                            statusCode: 200,
                            message: "OK",
                            data: res
                        })
                    }

                });
            });
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
        handler: (request, reply) => {
            db.collection('assignAnalytics').find().make((builder: any) => {
                builder.where('nickname', request.params.nickname)
                builder.first()
                builder.callback((err: any, res: any) => {
                    if (err || !res) {
                        reply({
                            statusCode: 400,
                            message: "Error have no data from this nickname",
                        })
                    } else {
                        reply({
                            statusCode: 200,
                            message: "OK",
                            data: res
                        })
                    }

                });
            });
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
        handler: function (request, reply) {
            let payload = request.payload;
            if (payload) {

                payload._id = objectid();
                let nickname = payload.nickname;
                payload.status = 'stop';
                payload.timestamp = Date.now()
                payload.stopTime = Date.now()

                db.collectionServer('analytics').find().make((builder: any) => {
                    builder.where('id', payload._refAnalyticsId)
                    builder.callback((err: any, res: any) => {
                        if (res.length == 0) {
                            badRequest("Have no Analytics data ")
                        } else {
                            // check file docker-analytics-camera if notxist
                            const dockerAnalyticsCameraPath = Util.dockerAnalyticsCameraPath()
                            fs.stat(dockerAnalyticsCameraPath, function (err, stats) {
                                if (err) { // if file  docker-analytics-camera not exist
                                    fs.mkdir(Util.uploadRootPath() + "docker-analytics-camera", (err) => {
                                        if (err) {
                                            serverError("can't create folder docker-analytics-camera \n" + err)
                                        }
                                        existFile()
                                    })
                                } else { // if file docker-analytics-camera exist
                                    existFile()
                                }
                                function existFile() {
                                    // read file yaml => change environment => generate docker-compose.yaml
                                    const ReadYamlPath = Util.analyticsPath() + res[0].analyticsFileInfo.name + pathSep.sep
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
                                                        serverError("can't create folder : \n" + err)
                                                    } else {
                                                        //write file docker-compose.yml
                                                        writeyaml(dockerAnalyticsCameraPath + nickname + pathSep.sep + 'docker-compose.yml', result, function (err) {
                                                            if (err) {
                                                                badRequest(err)
                                                            } else {
                                                                console.log('create folder and docker-compose.yaml file')
                                                                let analyticsInfo = res[0];
                                                                db.collection('camera').find().make((builder: any) => {
                                                                    builder.where('_id', payload._refCameraId)
                                                                    builder.callback((err: any, res: any) => {
                                                                        if (res.length == 0) {
                                                                            badRequest("Have no camera data")
                                                                        } else {

                                                                            let cameraInfo = res[0];
                                                                            //let command = "nvidia-docker run --rm -td --name \"" + payload.nickname + "\" --net=host --env=\"DISPLAY\" --volume=\"$HOME/.Xauthority:/root/.Xauthority:rw\" -v ${PWD}:/home/dev/host embedded-performance-server.local:5000/dev-cuda-image:8.0-cudnn5-opencv-devel-ubuntu16.04 "
                                                                            let command = "nvidia-docker run --rm -td --name '" + nickname + "' -v ${HOME}/darknet-cropping -person/crop_data:/home/dev/darknet-cropping-person/crop_data -v ${HOME}/darknet-cropping-person/log_data:/home/dev/darknet-cropping-person/log_data embedded-performance-server.local:5000/eslab/darknet-cropping-person:latest /bin/sh -c './darknet detector demo cfg/coco.data cfg/yolo.cfg weights/yolo.weights"
                                                                            //payload.cmd = command + analyticsInfo.cmd + " '" + cameraInfo.rtsp + "'\"";
                                                                            payload.cmd = command + " '" + cameraInfo.rtsp + "''";
                                                                            payload.type = analyticsInfo.analyticsProfile.name;
                                                                            payload.analyticsInfo = analyticsInfo;
                                                                            payload.cameraInfo = cameraInfo
                                                                            db.collection('assignAnalytics').insert(request.payload).callback((err) => {
                                                                                if (err) {
                                                                                    serverError("Can't insert data in AssignAnalytics")
                                                                                } else {
                                                                                    reply({
                                                                                        statusCode: 200,
                                                                                        msg: 'insert data success',
                                                                                    })
                                                                                }


                                                                            })
                                                                            // db.collection('assignAnalytics').modify({ status: 'stop' }).make((builder: any) => {
                                                                            //     builder.where("_refCameraId", payload._refCameraId)
                                                                            //     builder.where("status", "start")
                                                                            //     builder.callback((err: any, res: any) => {
                                                                            //         if (err || res.length == 0) {
                                                                            //             badRequest('have no assignAnalytics data to stop docker')
                                                                            //         } else {
                                                                            //             reply({
                                                                            //                 statusCode: 200,
                                                                            //                 msg: 'stop docker and updata status success',
                                                                            //             })
                                                                            //         }
                                                                            //     })
                                                                            // })
                                                                        }
                                                                    })
                                                                })
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
                        }
                    });
                });
            } else {
                badRequest("No data in payload")
            }

            function badRequest(msg) {
                reply({
                    statusCode: 400,
                    message: "Bad Request",
                    data: msg
                })
            }

            function serverError(msg) {
                reply({
                    statusCode: 500,
                    message: "Bad Request",
                    data: msg
                })
            }
        }

    },
    { // Delete assignAnalytics
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
            db.collection('assignAnalytics').find().make((builder: any) => {
                builder.where("_id", request.payload._id)
                builder.first()
                builder.callback((err: any, res: any) => {
                    let dockerNickname = res.nickname
                    if (err) {
                        reply({
                            statusCode: 500,
                            message: "Can't delete id : " + request.payload._id,
                        })
                    } else {
                        const cmd = "cd ../.." + Util.dockerAnalyticsCameraPath() + " &&  rm -rf " + res.nickname + " && echo eslab";
                        //const test = "cd ../.." + Util.analyticsPath() + " && ls"
                        exec(cmd, (error, stdout, stderr) => {
                            if (error) {
                                console.log("Error " + error)
                                badRequest("Error " + error)
                            } else if (stdout) {
                                db.collection('assignAnalytics').remove().make((builder: any) => {
                                    builder.where("_id", request.payload._id)
                                    builder.callback((err: any, res: any) => {
                                        if (err) {
                                            badRequest("Can't Delete data")
                                        } else {
                                            // delete rules
                                            db.collection('rules').remove().make((builder: any) => {
                                                builder.where("dockerNickname", dockerNickname)
                                                builder.callback((err: any, res: any) => {
                                                    if (err) {
                                                        badRequest("Can't Delete data")
                                                    } else {
                                                        reply({
                                                            statusCode: 200,
                                                            message: "OK",
                                                        })
                                                    }
                                                })
                                            })

                                        }
                                    });
                                });
                            } else {
                                console.log("Stderr " + stderr)
                                badRequest("Stderr" + stderr)
                            }
                        });
                    }
                });
            });
            function badRequest(msg) {
                reply({
                    statusCode: 400,
                    message: "OK",
                    data: msg
                })
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
        handler: (request, reply) => {
            db.collection('assignAnalytics').find().make((builder: any) => {
                builder.where('_refCameraId', request.params.id)
                builder.callback((err: any, res: any) => {
                    if (res.length == 0) {
                        reply({
                            statusCode: 404,
                            message: "No data",
                        })
                    } else {
                        reply({
                            statusCode: 200,
                            message: "OK",
                            data: res
                        })
                    }

                });
            });
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
        handler: (request, reply) => {
            db.collection('assignAnalytics').find().make((builder: any) => {
                builder.where('_refAnalyticsId', request.params.id)
                builder.callback((err: any, res: any) => {
                    if (res.length == 0) {
                        reply({
                            statusCode: 404,
                            message: "No data",
                        })
                    } else {
                        reply({
                            statusCode: 200,
                            message: "OK",
                            data: res
                        })
                    }
                });
            });
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
        handler: (request, reply) => {
            let status = ""
            if (request.payload.command == "start" || request.payload.command == "stop") {
                status = ""
            } else if (request.payload.command == "2") {
                status = "start"
            } else {
                status = "restart"
            }

            db.collection('assignAnalytics').modify({ status: status }).make((builder: any) => {
                builder.where('_id', request.payload.id)
                builder.callback((err: any, res: any) => {
                    if (err) {
                        reply({
                            statusCode: 400,
                            message: "Bad request",
                        })
                    } else {
                        reply({
                            statusCode: 200,
                            message: "OK",
                        })
                    }

                });
            });
        }
    },
    //=======================================================================================================================================
    // { // Get all assignAnalytics
    //     method: 'GET',
    //     path: '/assignAnalytics1',
    //     config: {
    //         tags: ['api'],
    //         description: 'Get All assignAnalytics data',
    //         notes: 'Get All assignAnalytics data'
    //     },
    //     handler: async (request, reply) => {
    //         const mongo = Util.getDb(request)
    //         try {
    //             const resAssignAnalytics = await mongo.collection('assignAnalytics').find().toArray()
    //             reply({
    //                 statusCode: 200,
    //                 message: "OK",
    //                 data: resAssignAnalytics
    //             })
    //         } catch (error) {
    //             reply(Boom.badGateway(error))
    //         }

    //     }
    // },
    // { // Get assignAnalytics by id
    //     method: 'GET',
    //     path: '/assignAnalytics1/{id}',
    //     config: {
    //         tags: ['api'],
    //         description: 'Get All assignAnalytics data',
    //         notes: 'Get All assignAnalytics data',
    //         validate: {
    //             params: {
    //                 id: Joi.string().required()
    //             }
    //         }
    //     },
    //     handler: async (request, reply) => {
    //         const mongo = Util.getDb(request)
    //         try {
    //             const resAssignAnalytics = await mongo.collection('assignAnalytics').findOne({ _id: ObjectIdMongo(request.params.id) })
    //             reply({
    //                 statusCode: 200,
    //                 message: "OK",
    //                 data: resAssignAnalytics
    //             })
    //         } catch (error) {
    //             reply(Boom.badGateway(error))
    //         }
    //     }
    // },
    // { // Get assignAnalytics by dockernickname
    //     method: 'GET',
    //     path: '/assignAnalytics/docker-nickname1/{nickname}',
    //     config: {
    //         tags: ['api'],
    //         description: 'Get assignAnalytics data by docker nickname',
    //         notes: 'Get assignAnalytics data by docker nickname',
    //         validate: {
    //             params: {
    //                 nickname: Joi.string().required()
    //             }
    //         }
    //     },
    //     handler: async (request, reply) => {
    //         const mongo = Util.getDb(request)
    //         try {
    //             const resAssignAnalytics = await mongo.collection('assignAnalytics').findOne({ nickname: ObjectIdMongo(request.params.nickname) })
    //             reply({
    //                 statusCode: 200,
    //                 message: "OK",
    //                 data: resAssignAnalytics
    //             })
    //         } catch (error) {
    //             reply(Boom.badGateway(error))
    //         }
    //     }
    // },
    // { // Insert assignAnalytics
    //     method: 'POST',
    //     path: '/assignAnalytics/insert1',
    //     config: {
    //         tags: ['api'],
    //         description: 'Insert assignAnalytics data',
    //         notes: 'Insert assignAnalytics data',
    //         validate: {
    //             payload: {
    //                 nickname: Joi.string().required(),
    //                 _refCameraId: Joi.string().required(),
    //                 _refAnalyticsId: Joi.string().required(),
    //                 environment: Joi.array().required(),

    //             }
    //         }
    //     },
    //     handler: async (request, reply) => {
    //         const mongo = Util.getDb(request)
    //         let payload = request.payload;
    //         try {
    //             let nickname = payload.nickname;
    //             payload.status = 'stop';
    //             payload.timestamp = Date.now()
    //             payload.stopTime = Date.now()
    //             const resAnalytics: any = await mongo.collection('analytics').findOne({ _id: ObjectIdMongo(payload._refAnalyticsId) })
    //             if (resAnalytics) {
    //                 const dockerAnalyticsCameraPath = Util.dockerAnalyticsCameraPath()
    //                 fs.stat(dockerAnalyticsCameraPath, function (err, stats) {
    //                     if (err) { // if file  docker-analytics-camera not exist
    //                         fs.mkdir(Util.uploadRootPath() + "docker-analytics-camera", (err) => {
    //                             if (err) {
    //                                 // serverError("can't create folder docker-analytics-camera \n" + err)
    //                             }
    //                             existFile()
    //                         })
    //                     } else { // if file docker-analytics-camera exist
    //                         existFile()
    //                     }
    //                     async function existFile() {
    //                         // read file yaml => change environment => generate docker-compose.yaml
    //                         const ReadYamlPath = Util.analyticsPath() + resAnalytics.analyticsFileInfo.name + pathSep.sep
    //                         // read file yaml 
    //                         YAML.load(ReadYamlPath + 'docker-compose.yaml', (result) => {
    //                             if (result != null) {
    //                                 //console.log("Read YAML file from " + result)
    //                                 if (typeof result.services != 'undefined') {
    //                                     let key = Object.keys(result.services) // json docker-compose  result.services
    //                                     // change environment 
    //                                     result.services[key[0]].container_name = nickname;
    //                                     result.services[key[0]].environment = request.payload.environment;
    //                                     // create folder by nickname docker 
    //                                     fs.mkdir(Util.dockerAnalyticsCameraPath() + nickname, (err) => {
    //                                         if (err) {
    //                                             console.log("can't create folder : \n" + err)
    //                                             console.log(dockerAnalyticsCameraPath + nickname)
    //                                             //serverError("can't create folder : \n" + err)
    //                                         } else {
    //                                             //write file docker-compose.yml
    //                                             writeyaml(dockerAnalyticsCameraPath + nickname + pathSep.sep + 'docker-compose.yml', result, async (err) => {
    //                                                 if (err) {
    //                                                     // badRequest(err)
    //                                                 } else {
    //                                                     console.log('create folder and docker-compose.yaml file')
    //                                                     let analyticsInfo = resAnalytics;
    //                                                     const resCamera: any = await mongo.collection('camera').findOne({ _id: ObjectIdMongo(payload._refCameraId) })
    //                                                     if (resCamera) {
    //                                                         let cameraInfo = resCamera;
    //                                                         let command = "nvidia-docker run --rm -td --name '" + nickname + "' -v ${HOME}/darknet-cropping -person/crop_data:/home/dev/darknet-cropping-person/crop_data -v ${HOME}/darknet-cropping-person/log_data:/home/dev/darknet-cropping-person/log_data embedded-performance-server.local:5000/eslab/darknet-cropping-person:latest /bin/sh -c './darknet detector demo cfg/coco.data cfg/yolo.cfg weights/yolo.weights"
    //                                                         payload.cmd = command + " '" + cameraInfo.rtsp + "''";
    //                                                         payload.type = analyticsInfo.analyticsProfile.name;
    //                                                         payload.analyticsInfo = analyticsInfo;
    //                                                         payload.cameraInfo = cameraInfo
    //                                                         const insertAssignAnalytics =await mongo.collection('assignAnalytics').insertOne(payload)
    //                                                         reply({
    //                                                             statusCode: 200,
    //                                                             msg: 'insert data success',
    //                                                         })
    //                                                     } else {
    //                                                         reply(Boom.notFound)
    //                                                     }

    //                                                 }
    //                                             });
    //                                         }

    //                                     })

    //                                 } else {
    //                                     badRequest("YAML file can't find 'service'")
    //                                 }
    //                             } else {
    //                                 badRequest("Can't Read YAML file \n path : " + ReadYamlPath)
    //                             }
    //                         })
    //                     }
    //                 })
    //             } else {
    //                 reply(Boom.notFound)
    //             }
    //         } catch (error) {
    //             reply(Boom.badGateway(error))
    //         }

    //         function badRequest(msg) {
    //             reply(Boom.badRequest(msg))
    //         }

    //         function serverError(msg) {
    //             reply(Boom.badGateway(msg))
    //         }
    //     }

    // },
    // { // Get assignAnalytics by Camera id
    //     method: 'GET',
    //     path: '/assignAnalytics/camera1/{id}',
    //     config: {
    //         tags: ['api'],
    //         description: 'Get assignAnalytics data from camera id',
    //         notes: 'Get assignAnalytics data from camera id',
    //         validate: {
    //             params: {
    //                 id: Joi.string()
    //                     .required()
    //             }
    //         }
    //     },
    //     handler: async (request, reply) => {
    //         const mongo = Util.getDb(request)
    //         try {
    //             const resAssignAnalytics = await mongo.collection('assignAnalytics').findOne({ _refCameraId: request.params.id })
    //             reply({
    //                 statusCode: 200,
    //                 message: "OK",
    //                 data: resAssignAnalytics
    //             })
    //         } catch (error) {
    //             reply(Boom.badGateway(error))
    //         }
    //     }
    // },
    // { // Get assignAnalytics by Analytics id
    //     method: 'GET',
    //     path: '/assignAnalytics/analytics1/{id}',
    //     config: {
    //         tags: ['api'],
    //         description: 'Get assignAnalytics data from analytics id',
    //         notes: 'Get assignAnalytics data from analytics id',
    //         validate: {
    //             params: {
    //                 id: Joi.string()
    //                     .required()
    //             }
    //         }
    //     },
    //     handler: async (request, reply) => {
    //         const mongo = Util.getDb(request)
    //         try {
    //             const resAssignAnalytics = await mongo.collection('assignAnalytics').findOne({ _refAnalyticsId: request.params.id })
    //             reply({
    //                 statusCode: 200,
    //                 message: "OK",
    //                 data: resAssignAnalytics
    //             })
    //         } catch (error) {
    //             reply(Boom.badGateway(error))
    //         }
    //     }

    // },
]