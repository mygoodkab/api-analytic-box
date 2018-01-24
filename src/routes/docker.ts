import * as db from '../nosql-util';
import { Util } from '../util';
import { reach } from 'joi';
const requestPath = require('request');
const objectid = require('objectid');
const Joi = require('joi')
const pathSep = require('path');
var child_process = require('child_process');
var fork = require('child_process').fork;
//var curl = require('curlrequest')
var net = require('net');
const { exec } = require('child_process');
var debug = require('debug')('worker:a')
module.exports = [
    {   // GET log from docker 
        method: 'POST',
        path: '/docker/log',
        config: {
            tags: ['api'],
            description: 'Get All analytics data',
            notes: 'Get All analytics data',
            validate: {
                payload: {
                    _nickname: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => {
            debug("1")
            // request.payload._nickname = "webconfig-dist"
            // request.payload._nickname = "optimistic_clarke"
            const options = {
                socketPath: '/var/run/docker.sock',
                // path: '/v1.24/containers/' + request.payload._nickname + '/logs?stdout=1',
                path: '/v1.24/containers/' + request.payload._nickname + '/logs?follow=false&stdout=true&stderr=true&since=0&timestamps=false&tail=50',
            };

            debug("2")
            //console.log('Path get logs=>', options);
            var url = 'http://unix:' + options.socketPath + ':' + options.path
            var option = {
                url: url,
                headers: {
                    "Host": "http",
                }
            }
            debug("3")
            requestPath.get(option, (err, res, body) => {
               debug("4")
                if (err) {
                    debug("5")
                    console.log('Error : ', err)
                    return reply({
                        statusCode: 400,
                        msg: "Can't get log ",
                        data: err
                    })
                } else {
                    debug("6")
                    //  console.log("log docker " + body)
                    return reply({
                        statusCode: 200,
                        msg: 'Get log docker success',
                        data: body
                    })
                }
            })
        }
    },
    {  // GET state from docker
        method: 'POST',
        path: '/docker/state',
        config: {
            tags: ['api'],
            description: 'Get All analytics data',
            notes: 'Get All analytics data',
            validate: {
                payload: {
                    _nickname: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => {

            // request.payload._nickname = "webconfig-dist"
            // request.payload._nickname = "optimistic_clarke"
            const options = {
                socketPath: '/var/run/docker.sock',
                path: '/v1.32/containers/' + request.payload._nickname + '/json?size=false',
            };
            var url = 'http://unix:' + options.socketPath + ':' + options.path
            var option = {
                url: url,
                headers: {
                    "Host": "http",
                }
            }

            requestPath.get(option, (err, res, body) => {
                if (err) {
                    console.log('Error : ', err)
                    return reply({
                        statusCode: 400,
                        msg: "Can't get state ",
                        data: err
                    })
                } else {
                    //  console.log("log docker " + body)
                    return reply({
                        statusCode: 200,
                        msg: 'Get state docker success',
                        data: JSON.parse(body)
                    })
                }
            })
        }
    },
    {  // Command to docker
        method: 'POST',
        path: '/docker/command',
        config: {
            tags: ['api'],
            description: 'Get All analytics data',
            notes: 'Get All analytics data',
            validate: {
                payload: {
                    _assignAnayticsId: Joi.string().required(),
                    _command: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => {
            let payload = request.payload
            if (payload && (payload._command == "stop" || payload._command == "start")) {
                db.collection('assignAnalytics').find().make((builder) => {
                    builder.where('_id', payload._assignAnayticsId)
                    builder.first()
                    builder.callback((err: any, res: any) => {
                        if (typeof res == 'undefined') {
                            badRequest("Can't query data in assignAnaytics by " + payload._assignAnayticsId)
                        } else {
                            // console.log(res)
                            const nickname = res.nickname

                            let cmd;
                            if (payload._command == "start") {

                                cmd = "curl --unix-socket /opt/vam/vam-microservice-relay.sock http:/magic/relay/execute/analytics/status/" + nickname + "/up"
                                console.log("full command string=>", cmd)
                                // cmd = "cd ../../vam-data/uploads/docker-analytics-camera/" + nickname + " && docker-compose up -d"
                            } else {
                                cmd = "curl --unix-socket /opt/vam/vam-microservice-relay.sock http:/magic/relay/execute/analytics/status/" + nickname + "/down"
                                console.log("full command string=>", cmd)
                                // cmd = "cd ../../vam-data/uploads/docker-analytics-camera/" + nickname + " && docker-compose down "
                            }
                            exec(cmd, (error, stdout, stderr) => {
                                if (error) {
                                    console.error(`exec error: ${error}`);
                                    badRequest("Error : " + error)

                                } else if (stdout) {
                                    console.log("respone cmd curl=>", stdout)
                                    if (payload._command == 'start') {
                                        db.collection('assignAnalytics').modify({ status: payload._command }).make((builder: any) => {
                                            builder.where('_id', payload._assignAnayticsId)
                                            builder.callback((err: any, res: any) => {
                                                if (err) {
                                                    badRequest("Can't up status")
                                                }
                                                return reply({
                                                    statusCode: 200,
                                                    message: "OK",
                                                    data: "update status success"
                                                })
                                            });
                                        });
                                    } else {
                                        db.collection('assignAnalytics').modify({ status: payload._command, stopTime: Date.now() }).make((builder: any) => {
                                            builder.where('_id', payload._assignAnayticsId)
                                            builder.callback((err: any, res: any) => {
                                                if (err) {
                                                    badRequest("Can't up status")
                                                }
                                                return reply({
                                                    statusCode: 200,
                                                    message: "OK",
                                                    data: "update status success"
                                                })
                                            });
                                        });
                                    }
                                    // db.collection('assignAnalytics').modify({ status: payload._command }).make((builder: any) => {
                                    //     builder.where('_id', payload._assignAnayticsId)
                                    //     builder.callback((err: any, res: any) => {
                                    //         if (err) {
                                    //             badRequest("Can't up status")
                                    //         }
                                    //         return reply({
                                    //             statusCode: 200,
                                    //             message: "OK",
                                    //             data: stdout
                                    //         })  
                                    //     });
                                    // });
                                } else {
                                    badRequest("Command : " + cmd + "\n" + "Stderr : " + stderr)
                                }
                            });

                            /*
                                Legacy HTTP Methods
                            */
                            // let dockerCmdUrl;
                            // if (payload._command == 'start') {
                            //     // dockerCmdUrl = "http://embedded-performance-server.local:4180/relay/execute/analytics/status/"+nickname+"/up"
                            //     // dockerCmdUrl = "http://192.168.1.113:4180/relay/execute/analytics/status/"+nickname+"/up"
                            //     dockerCmdUrl = "http://10.0.0.71:4180/relay/execute/analytics/status/" + nickname + "/up"
                            //     console.log("dockerCmdUrl=>", dockerCmdUrl)
                            // } else {
                            //     // dockerCmdUrl = "http://embedded-performance-server.local:4180/relay/execute/analytics/status/"+nickname+"/down"
                            //     // dockerCmdUrl = "http://192.168.1.113:4180/relay/execute/analytics/status/"+nickname+"/down"
                            //     dockerCmdUrl = "http://10.0.0.71:4180/relay/execute/analytics/status/" + nickname + "/down"
                            //     console.log("dockerCmdUrl=>", dockerCmdUrl)
                            // }
                            // requestPath.get(dockerCmdUrl, (err, res, body) => {
                            //     if (err) {
                            //         console.log("err=>", err)
                            //         return reply({
                            //             statusCode: 500,
                            //             message: "Internal Error",
                            //             data: err
                            //         })
                            //     }
                            //     if (body) {
                            //         console.log("res body=>", body)
                            // if (payload._command == 'start') {
                            //     db.collection('assignAnalytics').modify({ status: payload._command }).make((builder: any) => {
                            //         builder.where('_id', payload._assignAnayticsId)
                            //         builder.callback((err: any, res: any) => {
                            //             if (err) {
                            //                 badRequest("Can't up status")
                            //             }
                            //             return reply({
                            //                 statusCode: 200,
                            //                 message: "OK",
                            //                 data: body
                            //             })
                            //         });
                            //     });
                            // } else {
                            //     db.collection('assignAnalytics').modify({ status: payload._command, stopTime: Date.now() }).make((builder: any) => {
                            //         builder.where('_id', payload._assignAnayticsId)
                            //         builder.callback((err: any, res: any) => {
                            //             if (err) {
                            //                 badRequest("Can't up status")
                            //             }
                            //             return reply({
                            //                 statusCode: 200,
                            //                 message: "OK",
                            //                 data: body
                            //             })
                            //         });
                            //     });
                            // }

                            //     }
                            // })

                        }
                    })
                })
            } else {
                badRequest("Please check your command")
            }
            function badRequest(msg) {
                return reply({
                    statusCode: 400,
                    msg: "Bad request",
                    data: msg
                });
            }
        }
    }
]
//
//   var environment = [ 
//  "VAM_PRIVATE_TEXT_ANALYTICSNICKNAME=darknet-cropping-33245",
//   "VAM_PUBLIC_TEXT_INPUTSRC=doggo.jpg",
//   "VAM_PRIVATE_TEXT_OUTPUTDEST=output",
//   "VAM_PRIVATE_TEXT_OUTPUT_FREQ=HIGH",
//   "VAM_PRIVATE_TEXT_OUTPUTDEST=output",
//   "VAM_PRIVATE_BOOLEAN_PRODUCTION=false"
//  ]
