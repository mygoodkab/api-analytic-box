"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db = require("../nosql-util");
const util_1 = require("../util");
const objectid = require('objectid');
const Joi = require('joi');
const execSh = require('exec-sh');
const { exec } = require('child_process');
const pathSep = require('path');
const os = require('os');
const fs = require('fs');
var ip = require('ip');
var dateFormat = require('dateformat');
module.exports = [
    {
        method: 'GET',
        path: '/record',
        config: {
            tags: ['api'],
            description: 'Get All record data ',
            notes: 'Get All record data ',
        },
        handler: (request, reply) => {
            db.collection('record').find().make((builder) => {
                builder.sort('timeStamp', true);
                builder.callback((err, res) => {
                    let path = util_1.Util.uploadMatchImagePath();
                    fs.readdir(path, (err, files) => {
                        let num = files.length;
                        reply({
                            statusCode: 200,
                            msg: "OK",
                            data: res,
                            files: num,
                        });
                    });
                });
            });
        }
    },
    {
        method: 'POST',
        path: '/record/similar-data',
        config: {
            tags: ['api'],
            description: 'Get All get-match-images data where refInfo && type ',
            notes: 'Get All get-match-images data where refInfo && type ',
            validate: {
                payload: {
                    refInfo: Joi.string().required(),
                    type: Joi.string().required(),
                }
            }
        },
        handler: (request, reply) => {
            db.collection('faceInfo').find().make((builder) => {
                builder.where('refInfo', request.payload.refInfo);
                builder.callback((err, res) => {
                    let faceInfo = res[0];
                    db.collection('record').find().make((builder) => {
                        builder.where('_nameFolderRegister', request.payload.refInfo);
                        builder.where('analytics', request.payload.type);
                        builder.callback((err, res) => {
                            if (res.length == 0) {
                                reply({
                                    statusCode: 200,
                                    msg: "Have no Match Images",
                                });
                            }
                            else {
                                res[0].faceInfo = faceInfo;
                                reply({
                                    statusCode: 200,
                                    msg: "OK",
                                    data: res
                                });
                            }
                        });
                    });
                });
            });
        }
    },
    {
        method: 'GET',
        path: '/record/get-match-images/{id}',
        config: {
            tags: ['api'],
            description: 'Get image for UI',
            notes: 'Get image ',
            validate: {
                params: {
                    id: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => {
            db.collection('record').find().make((builder) => {
                builder.where("_id", request.params.id);
                builder.callback((err, res) => {
                    if (res.length == 0) {
                        reply({
                            statusCode: 404,
                            message: "Bad Request",
                            data: "Data not found"
                        });
                    }
                    else {
                        res = res[0];
                        let path = util_1.Util.uploadMatchImagePath() + res.face_id;
                        reply.file(path, {
                            filename: res.name + '.' + res.fileType,
                            mode: 'inline'
                        });
                    }
                });
            });
        }
    },
    {
        method: 'POST',
        path: '/record/match-images/v2',
        config: {
            tags: ['api'],
            description: 'insert match-image in image',
            notes: 'insert match-image in image',
            validate: {
                payload: {
                    face_id: Joi.string().required().description('id image'),
                    match_register: Joi.string().required().description('name Matching images'),
                    ipCamera: Joi.string(),
                    analytics: Joi.string()
                }
            }
        },
        handler: (request, reply) => {
            let payload = request.payload;
            payload.timeStamp = new Date();
            payload.date = dateFormat(new Date(), "d/mmmm/yyyy");
            payload.time = dateFormat(new Date(), "H:MM:ss");
            payload._id = objectid();
            db.collection('faceInfo').find().make((builder) => {
                builder.where('refInfo', payload.match_register);
                builder.callback((err, res) => {
                    if (res.length == 0) {
                        reply({
                            statusCode: 400,
                            msg: "refInfo not match",
                        });
                    }
                    else {
                        console.log(ip.address());
                        payload.faceInfo = res[0];
                        db.collection('record').insert(payload);
                        reply({
                            statusCode: 200,
                            msg: "OK",
                            ip: ip.address()
                        });
                    }
                });
            });
        }
    },
    {
        method: 'POST',
        path: '/record/delete',
        config: {
            tags: ['api'],
            description: 'Delete camera data',
            notes: 'Delete  camera data',
            validate: {
                payload: {
                    match_register: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => {
            db.collection('record').remove().make((builder) => {
                builder.where("match_register", request.payload.match_register);
                builder.callback((err, res) => {
                    if (err) {
                        reply({
                            statusCode: 400,
                            msg: "Bad Request",
                            data: "Invaild match_register "
                        });
                    }
                    else {
                        reply({
                            statusCode: 200,
                            msg: "OK",
                            data: "Can Delete"
                        });
                    }
                });
            });
        }
    },
];
//# sourceMappingURL=record.js.map