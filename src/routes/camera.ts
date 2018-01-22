import * as db from '../nosql-util';
import { Util } from '../util';
const find = require('find-process');
const objectid = require('objectid');
const Joi = require('joi')
const jsonfile = require('jsonfile')
var child_process = require('child_process');
var fork = require('child_process').fork;
//import { sqliteUtil } from '../sqlite-util';
//import { dbpath } from '../server';
const { exec } = require('child_process');

module.exports = [
    {  // Get all camera profile
        method: 'GET',
        path: '/camera',
        config: {
            tags: ['api'],
            description: 'Get All camera data',
            notes: 'Get All camera data'
        },
        handler: (request, reply) => {
            db.collection('camera').find().make((builder: any) => {
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
        handler: (request, reply) => {
            db.collection('camera').find().make((builder: any) => {
                builder.where('_id', request.params.id)
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
                }
            }
        },
        handler: function (request, reply) {

            db.collection('camera').find().make((builder: any) => {
                builder.sort("portrelay", true);
                builder.first();
                builder.callback((err: any, res: any) => {
                    let payload = request.payload;

                    if (!res) {
                        payload.portffmpeg = 8081;
                        payload.portrelay = 8082;
                    } else if (err) {
                        return reply({
                            statusCode: 400,
                            message: "Bad request",
                        })
                    } else {
                        payload.portffmpeg = res.portrelay + 1
                        payload.portrelay = res.portrelay + 2
                    }
                    //payload.nickname = payload.analytics.name + payload.name + objectid()
                    payload._id = objectid();
                    payload.updateDate = new Date();
                    payload.runrelay = "cd ../JSMpeg node websocket-relay.js embedded " + payload.portffmpeg + " " + payload.portrelay;
                    payload.cmdffmpeg = "ffmpeg -f rtsp  -rtsp_transport tcp -i \"" + payload.rtsp + "\" -f mpegts -codec:v mpeg1video -s 640x480 -b:v 1000k -bf 0 http://localhost:" + payload.portffmpeg + "/embedded";
                    //payload.cmd = payload.analytics.cmd + " '" + payload.rtsp + "'\""
                    db.collection('camera').insert(request.payload).callback(function (err) {
                        if (err) {
                            return reply({
                                statusCode: 500,
                                message: "can't insert data",
                            })
                        }
                        return reply({
                            statusCode: 200,
                            message: "OK",
                            data: "insert success"
                        })
                    });


                });
            });

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
        handler: function (request, reply) {
            if (request.payload) {
                request.payload.updateDate = new Date()
                db.collection('camera').modify(request.payload).make(function (builder) {
                    builder.where("_id", request.payload._id);
                    builder.callback(function (err, res) {
                        db.collection('camera').find().make(function (builder) { // ที่ต้อง select camera มาก่อน update assignAnalytics เพราะว่า ข้อมูลใน payload บางตัวมีไม่ครบในข้อมูลททั้งหมดของ Camera
                            builder.where("_id", request.payload._id);
                            builder.first()
                            builder.callback(function (err, res) {
                                db.collection('assignAnalytics').modify({ cameraInfo: res }).make(function (builder) {
                                    builder.where("_refCameraId", request.payload._id);
                                    builder.callback(function (err, res) {
                                        if (err) {
                                            return reply({
                                                statusCode: 400,
                                                message: "Bad Request",
                                            })
                                        }
                                        return reply({
                                            statusCode: 200,
                                            message: "OK",
                                            data: "Update Succeed"
                                        })
                                    })
                                })
                            })
                        })


                    });
                })
            } else {
                return reply({
                    statusCode: 400,
                    message: "Bad Request",
                    data: "No payload"
                })
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
        handler: (request, reply) => {
            db.collection('assignAnalytics').find().make((builder: any) => {
                builder.where("_refCameraId", request.payload._id)
                builder.first()
                builder.callback((err: any, res: any) => {
                    if (typeof res == 'undefined') {
                        db.collection('camera').remove().make((builder: any) => {
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
                    } else {
                        return reply({
                            statusCode: 500,
                            message: "Some data's used in assignAnalytics",
                        })
                    }
                })
            })

        }
    },
    {  // Write json file 
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

                var obj = request.payload
                var file = 'C:/Users/ESLab/Desktop/analyticbox-api/src/tmp/' + obj.configFile + '.json';
                jsonfile.writeFile(file, obj, function (err) {
                    if (err) {
                        console.error(err)
                        return reply({
                            statusCode: 500,
                            message: "Server Error",
                        })
                    } else {
                        return reply({
                            statusCode: 200,
                            message: "OK",
                            data: "insert success"
                        })

                    }

                })


            } else return reply({
                statusCode: 400,
                message: "Bad Request",
                data: "No payload"
            })
        }
    },
    {   // Video stream by runing websocket-relay & run cmd ffmpeg
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
                    builder.first()
                    builder.callback(function (err, res) {
                        var child = fork('./JSMpeg/websocket-relay', ['embedded', res.portffmpeg, res.portrelay]);
                        child_process.exec(res.cmdffmpeg, function (error, stdout, stderr) {
                            if (stdout) {
                                console.log(stdout)
                            } else if (stderr) {
                                console.log(stderr)
                            } else {
                                console.log(error)
                            }
                        })
                        return reply({
                            statusCode: 200,
                            message: "OK",
                        })
                    });
                })
            } else {
                return reply({
                    statusCode: 400,
                    message: "Bad Request",
                    data: "No payload"
                })
            }
        }
    },
    //---------------------------------------------------------
    {
        method: 'GET',
        path: '/camera/live',
        config: {
            tags: ['api'],
            description: 'Live camera ',
            notes: 'Live camera ',
        },
        handler: (request, reply) => {
            let cmd = "../jsmpeg/live.sh"
            exec(cmd, (error, stdout, stderr) => {
                if (stdout) {
                    return reply({
                        statusCode: 200,
                        message: "OK",
                        data: stdout
                    })
                } else if (stderr) {
                    return reply({
                        statusCode: 500,
                        message: "Server stdError",
                        data: stderr
                    })
                } else {
                    return reply({
                        statusCode: 500,
                        message: "Server Error",
                        data: error
                    })
                }
            })
        }
    },
    {
        method: 'GET',
        path: '/camera/kill',
        config: {
            tags: ['api'],
            description: 'Kill process camera live',
            notes: 'Kill process camera live',
        },
        handler: (request, reply) => {


            // exec(cmd, (error, stdout, stderr) => {
            //     if (stdout) {
            //         return reply({
            //             statusCode: 200,
            //             message: "OK",
            //             data: stdout
            //         })
            //     } else if (stderr) {
            //         return reply({
            //             statusCode: 500,
            //             message: "Server stdError",
            //             data: stderr
            //         })
            //     } else {
            //         return reply({
            //             statusCode: 500,
            //             message: "Server Error",
            //             data: error
            //         })
            //     }
            // })
        }
    }


];