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
const objectid = require('objectid');
const Joi = require('joi')
const jsonfile = require('jsonfile')
const child_process = require('child_process');

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
                    return reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    })
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
                    if (err || typeof res == 'undefined') {
                        return reply({
                            statusCode: 400,
                            message: "Error have no data from this id",
                        })
                    }
                    return reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    })
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
                db.collection('analytics').find().make((builder: any) => {
                    builder.where('_id', payload._refAnalyticsId)
                    builder.callback((err: any, res: any) => {
                        if (res.length == 0) {
                            return reply({
                                statusCode: 500,
                                message: "Have no Analytics data ",
                            })
                        } else {
                            let analyticsInfo = res[0];
                            db.collection('camera').find().make((builder: any) => {
                                builder.where('_id', payload._refCameraId)
                                builder.callback((err: any, res: any) => {
                                    if (res.length == 0) {
                                        return reply({
                                            statusCode: 500,
                                            message: "Have no camera data ",
                                        })
                                    } else {
                                        payload.nickname = payload._id

                                        let cameraInfo = res[0];
                                        //let command = "nvidia-docker run --rm -td --name \"" + payload.nickname + "\" --net=host --env=\"DISPLAY\" --volume=\"$HOME/.Xauthority:/root/.Xauthority:rw\" -v ${PWD}:/home/dev/host embedded-performance-server.local:5000/dev-cuda-image:8.0-cudnn5-opencv-devel-ubuntu16.04 "
                                        let command = "nvidia-docker run --rm -td --name '" + payload.nickname + "' -v ${HOME}/darknet-cropping-person/crop_data:/home/dev/darknet-cropping-person/crop_data -v ${HOME}/darknet-cropping-person/log_data:/home/dev/darknet-cropping-person/log_data embedded-performance-server.local:5000/eslab/darknet-cropping-person:latest /bin/sh -c './darknet detector demo cfg/coco.data cfg/yolo.cfg weights/yolo.weights"
                                        //payload.cmd = command + analyticsInfo.cmd + " '" + cameraInfo.rtsp + "'\"";
                                        let doublecode = String.fromCharCode(34);
                                        payload.cmd = command + " '" + cameraInfo.rtsp + "''"  ;
                                        payload.type = analyticsInfo.name;
                                        payload.analyticsInfo = analyticsInfo;
                                        payload.cameraInfo = cameraInfo
                                        db.collection('assignAnalytics').insert(request.payload)
                                        db.collection('assignAnalytics').modify({ status: 'stop' }).make((builder: any) => {
                                            builder.where("_refCameraId", payload._refCameraId)
                                            builder.where("status", "start")
                                            builder.callback((err: any, res: any) => {
                                                if (err || res.length == 0) {
                                                    return reply({
                                                        statusCode: 400,
                                                        msg: 'have no assignAnalytics data to stop docker',
                                                    })
                                                } else {
                                                    return reply({
                                                        statusCode: 200,
                                                        msg: 'stop docker and updata status success',
                                                    })

                                                }
                                            })
                                        })

                                    }
                                })
                            })
                        }
                    });
                });
            } else return reply({
                statusCode: 400,
                message: "Bad Request",
                data: "No payload"
            })
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
            db.collection('assignAnalytics').remove().make((builder: any) => {
                builder.where("_id", request.payload._id)
                builder.callback((err: any, res: any) => {
                    if (err) {
                        return reply({
                            statusCode: 500,
                            message: "Can't delete id : " + request.payload._id,
                        })
                    } else {
                        return reply({
                            statusCode: 200,
                            message: "OK",
                        })
                    }

                });
            });
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
                    return reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    })
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
                    return reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    })
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
            if (request.payload.command == "1") {
                status = "stop"
            } else if (request.payload.command == "2") {
                status = "start"
            } else {
                status = "restart"
            }

            db.collection('assignAnalytics').modify({ status: status }).make((builder: any) => {
                builder.where('_id', request.payload.id)
                builder.callback((err: any, res: any) => {
                    if (err) {
                        return reply({
                            statusCode: 400,
                            message: "Bad request",
                        })
                    }
                    return reply({
                        statusCode: 200,
                        message: "OK",
                    })
                });
            });
        }
    }

]