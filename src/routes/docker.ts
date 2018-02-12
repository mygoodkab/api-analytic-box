import * as db from '../nosql-util';
import { Util } from '../util';
import { reach } from 'joi';
import * as  Boom from 'boom'
const mongoObjectId = require('mongodb').ObjectId;
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
            const options = {
                socketPath: '/var/run/docker.sock',
                // path: '/v1.24/containers/' + request.payload._nickname + '/logs?stdout=1',
                path: '/v1.24/containers/' + request.payload._nickname + '/logs?follow=false&stdout=true&stderr=true&since=0&timestamps=false&tail=50',
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
                    reply({
                        statusCode: 400,
                        msg: "Can't get log ",
                        data: err
                    })
                } else {
                    reply({
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
                    reply({
                        statusCode: 400,
                        msg: "Can't get state ",
                        data: err
                    })
                } else {
                    //  console.log("log docker " + body)
                    reply({
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
        handler: async (request, reply) => {
            let dbm = Util.getDb(request)
            let payload = request.payload
            try {
                if (payload && (payload._command == "stop" || payload._command == "start")) {
                    const resAssignAnalytics = await dbm.collection('assignAnalytics').findOne({ _id: mongoObjectId(payload._assignAnayticsId) })

                    if (typeof resAssignAnalytics == 'undefined') {
                        reply(Boom.badRequest("Can't query data in assignAnaytics by " + payload._assignAnayticsId))
                    } else {
                        // console.log(res)
                        const nickname = resAssignAnalytics.nickname

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
                        exec(cmd, async (error, stdout, stderr) => {
                            if (error) {
                                console.error(`exec error: ${error}`);

                            } else if (stdout) {
                                console.log("respone cmd curl=>", stdout)
                                if (payload._command == 'start') {
                                    const update = await dbm.collection('assignAnalytics').updateOne({ _id: mongoObjectId(payload._assignAnayticsId) }, { $set: { status: payload._command } })
                                    reply({
                                        statusCode: 200,
                                        message: "OK",
                                        data: "update status success && run cmd start success"
                                    })

                                } else {
                                    const update = await dbm.collection('assignAnalytics').updateOne({ _id: mongoObjectId(payload._assignAnayticsId) }, { $set: { status: payload._command, stopTime: Date.now() } })
                                    reply({
                                        statusCode: 200,
                                        message: "OK",
                                        data: "update status success && run cmd  stop success"
                                    })
                                }
                            }
                        });
                    }
                } else {
                    reply(Boom.badRequest("Please check your command"))
                }
            } catch (error) {
                reply(Boom.badGateway(error))
            }

        }
    },
  
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
