import * as db from '../nosql-util';
import { Util } from '../util';
import { reach } from 'joi';
const http = require('http');
const requestPath = require('request');
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
            request.payload._nickname = "webconfig-api"
            // request.payload._nickname = "optimistic_clarke"
            const options = {
                socketPath: '/var/run/docker.sock',
                path: '/v1.24/containers/' + request.payload._nickname + '/logs?stdout=1',
            };
            var url = 'http://unix:' + options.socketPath + ':' + options.path
            requestPath.get(url, (err, res, body) => {
                if (err) {
                    console.log('Error : ', err)
                } else {
                    console.log('Res : ', res)
                    console.log('Body :', body)
                }
            })



        }
    }
]