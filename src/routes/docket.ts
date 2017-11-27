import * as db from '../nosql-util';
import { Util } from '../util';
const objectid = require('objectid');
const Joi = require('joi')
const pathSep = require('path');
var child_process = require('child_process');
var fork = require('child_process').fork;
//var curl = require('curlrequest')
var net = require('net');

module.exports = [
    {
        method: 'POST',
        path: '/log-docker',
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
         
            var client = net.createConnection("/var/run/docker.sock");
            client.on("connect", function () {
                console.log("connect")
                client.write('http:/v1.24/containers/webconfig-dist/logs?stdout=1');
            });

            client.on("data", function (data) {
                console.log(data)
                return reply({
                    statusCode: 200,
                    message: "OK",
                    data: data
                })
            })
            // var resp = child_process.execSync('curl --unix-socket /var/run/docker.sock "http:/v1.24/containers/webconfig-dist/logs?stdout=1"');
            // var result = resp.toString('UTF8');
            // return reply({
            //     statusCode: 200,
            //     message: "OK",
            //     data: result
            // })
            // child_process.exec('curl --help', function (error, stdout, stderr) {
            //     if (stdout) {
            //         console.log(stdout)
            //         return reply({
            //             statusCode: 200,
            //             message: "OK",
            //             data: stdout
            //         })
            //     } else if (stderr) {
            //         console.log(stderr)
            //         return reply({
            //             statusCode: 400,
            //             message: "Std Error",
            //             data: stderr
            //         })
            //     } else {
            //         console.log(error)
            //         return reply({
            //             statusCode: 400,
            //             message: "Error",
            //             data: error
            //         })
            //     }
            // })
        }
    }
]