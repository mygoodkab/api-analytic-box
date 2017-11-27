"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db = require("../nosql-util");
const util_1 = require("../util");
const pathSep = require('path');
const objectid = require('objectid');
const Joi = require('joi');
const fs = require('fs');
const DIR = '../uploads/';
const mkdirp = require('mkdirp');
const del = require('del');
const child_process = require('child_process');
const { spawn } = require('child_process');
module.exports = [
    {
        method: 'POST',
        path: '/images/upload-profile',
        config: {
            tags: ['api'],
            description: 'Upload images',
            notes: 'Upload images',
            validate: {
                payload: {
                    firstname: Joi.string(),
                    lastname: Joi.string(),
                    type: Joi.string(),
                    age: Joi.string(),
                    gender: Joi.string(),
                    refInfo: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => {
            let req = request;
            let payload = req.payload;
            payload.idImages = [];
            if (payload) {
                let path = util_1.Util.uploadImagePath() + payload.refInfo;
                mkdirp(path, function (err) {
                    if (err) {
                        return reply({
                            statusCode: 500,
                            msg: 'Server error',
                            data: 'can\'t crate folder'
                        });
                    }
                    else
                        console.log('create folder!' + path);
                });
                payload._id = objectid();
                db.collection('faceInfo').insert(payload);
                return reply({
                    statusCode: 200,
                    msg: 'OK',
                });
            }
            else
                return reply({
                    statusCode: 400,
                    msg: 'Bad Request',
                    data: 'No file in payload'
                });
        }
    },
    {
        method: 'POST',
        path: '/images/upload',
        config: {
            tags: ['api'],
            description: 'Upload images',
            notes: 'Upload images',
            validate: {
                payload: {
                    file: Joi.any().meta({ swaggerType: 'file' }).description('file upload'),
                    refInfo: Joi.string(),
                }
            },
            payload: {
                maxBytes: 5000000,
                parse: true,
                output: 'stream'
            },
        },
        handler: (request, reply) => {
            let req = request;
            let payload = req.payload;
            if (payload.file) {
                let path = util_1.Util.uploadImagePath() + payload.refInfo + pathSep.sep;
                let filename = payload.file.hapi.filename.split('.');
                let fileType = filename.splice(filename.length - 1, 1)[0];
                filename = filename.join('.');
                let storeName = util_1.Util.uniqid() + "." + fileType.toLowerCase();
                let id = objectid();
                let imageInfo = {
                    _idImageRegister: id,
                    name: filename,
                    storeName: storeName,
                    fileType: fileType,
                    ts: new Date(),
                    refInfo: payload.refInfo
                };
                let file = fs.createWriteStream(path + imageInfo.storeName);
                file.on('error', (err) => {
                    return reply({
                        statusCode: 500,
                        msg: 'Server error',
                        data: 'can\'t upload image'
                    });
                });
                payload.file.pipe(file);
                payload.file.on('end', (err) => {
                    var filestat = fs.statSync(path + imageInfo.storeName);
                    imageInfo.fileSize = filestat.size;
                    imageInfo.createdata = new Date();
                    db.collection('faceInfo').find().make((builder) => {
                        builder.where('refInfo', payload.refInfo);
                        builder.callback((err, res) => {
                            res = res[0];
                            let arr = res.idImages;
                            arr.push(id);
                            db.collection('faceInfo').modify({ idImages: arr }).make((builder) => {
                                builder.where('refInfo', payload.refInfo);
                                builder.callback((err, res) => {
                                    db.collection('images').insert(imageInfo);
                                    db.collection('assignAnalytics').modify({ status: 'stop' }).make((builder) => {
                                        builder.where('type', 'recognition');
                                        builder.callback((err, res) => {
                                            if (res.length == 0) {
                                                return reply({
                                                    statusCode: 200,
                                                    msg: 'have no assignAnalytics data to stop docker',
                                                });
                                            }
                                            else {
                                                return reply({
                                                    statusCode: 200,
                                                    msg: 'updata status success',
                                                });
                                            }
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            }
            else
                return reply({
                    statusCode: 400,
                    msg: 'Bad Request',
                    data: 'No file in payload'
                });
        }
    },
    {
        method: 'GET',
        path: '/images',
        config: {
            tags: ['api'],
            description: 'Get all faceinfo Profile',
            notes: 'Get all faceinfo Profile'
        },
        handler: (request, reply) => {
            db.collection('faceInfo').find().make((builder) => {
                builder.callback((err, res) => {
                    if (err) {
                        return reply({
                            statusCode: 400,
                            message: "Bad Request",
                            data: "Error"
                        });
                    }
                    else {
                        return reply({
                            statusCode: 200,
                            message: "OK",
                            data: res
                        });
                    }
                });
            });
        }
    },
    {
        method: 'GET',
        path: '/images/get-images/{id}',
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
            db.collection('images').find().make((builder) => {
                builder.where("_idImageRegister", request.params.id);
                builder.callback((err, res) => {
                    if (res.length == 0) {
                        return reply({
                            statusCode: 404,
                            message: "Bad Request",
                            data: "Data not found"
                        });
                    }
                    else {
                        res = res[0];
                        var contentType;
                        switch (res.fileType) {
                            case "pdf":
                                contentType = 'application/pdf';
                                break;
                            case "ppt":
                                contentType = 'application/vnd.ms-powerpoint';
                                break;
                            case "pptx":
                                contentType = 'application/vnd.openxmlformats-officedocument.preplyentationml.preplyentation';
                                break;
                            case "xls":
                                contentType = 'application/vnd.ms-excel';
                                break;
                            case "xlsx":
                                contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                                break;
                            case "doc":
                                contentType = 'application/msword';
                                break;
                            case "docx":
                                contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                                break;
                            case "csv":
                                contentType = 'application/octet-stream';
                                break;
                        }
                        let path = util_1.Util.uploadImagePath() + res.refInfo + pathSep.sep + res.storeName;
                        console.log('Getting image . . . . . success');
                        return reply.file(path, {
                            filename: res.name + '.' + res.fileType,
                            mode: 'inline',
                            confine: false
                        }).type(contentType);
                    }
                });
            });
        }
    },
    {
        method: 'POST',
        path: '/images/delete-folder',
        config: {
            tags: ['api'],
            description: 'Get image Profile by refInfo',
            notes: 'Get image Profile by refInfo',
            validate: {
                payload: {
                    refInfo: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => {
            db.collection('images').remove().make((builder) => {
                builder.where('refInfo', request.payload.refInfo);
                builder.callback((err, res) => {
                    if (err) {
                        return reply({
                            statusCode: 400,
                            message: "Bad Request",
                            data: "Error"
                        });
                    }
                    else {
                        db.collection('faceInfo').remove().make((builder) => {
                            builder.where('refInfo', request.payload.refInfo);
                            builder.callback((err, res) => {
                                if (err) {
                                    return reply({
                                        statusCode: 400,
                                        message: "Bad Request",
                                        data: "Error"
                                    });
                                }
                                else {
                                    const path = util_1.Util.uploadImagePath() + request.payload.refInfo;
                                    const cmd = 'echo eslab | sudo -S rm -rf ../..' + path;
                                    child_process.exec(cmd, function (error, stdout, stderr) {
                                        if (stdout) {
                                            console.log("Delete Image Folder Successful" + stdout);
                                            return reply({
                                                statusCode: 200,
                                                message: "Delete Image Folder Successful",
                                                data: stdout
                                            });
                                        }
                                        else if (stderr) {
                                            console.log("stderr" + stderr);
                                            return reply({
                                                statusCode: 400,
                                                message: "Std Error Can't Delete Image Folder",
                                                data: stderr
                                            });
                                        }
                                        else {
                                            console.log("Error " + error);
                                            return reply({
                                                statusCode: 400,
                                                message: "Error Can't Delete Image Folder",
                                                data: error
                                            });
                                        }
                                    });
                                }
                            });
                        });
                    }
                });
            });
        }
    },
    {
        method: 'GET',
        path: '/test/',
        config: {
            tags: ['api'],
            description: 'Get all faceinfo Profile',
            notes: 'Get all faceinfo Profile'
        },
        handler: (request, reply) => {
            const path = util_1.Util.uploadImagePath();
            const cmd = 'echo eslab | sudo -S rm -rf ../..' + path + 'a';
            child_process.exec(cmd, function (error, stdout, stderr) {
                if (stdout) {
                    console.log("Delete Image Folder Successful" + stdout);
                    return reply({
                        statusCode: 200,
                        message: "Delete Image Folder Successful",
                        data: stdout
                    });
                }
                else if (stderr) {
                    console.log("stderr" + stderr);
                    return reply({
                        statusCode: 400,
                        message: "Std Error Can't Delete Image Folder",
                        data: stderr
                    });
                }
                else {
                    console.log("Error " + error);
                    return reply({
                        statusCode: 400,
                        message: "Error Can't Delete Image Folder",
                        data: error
                    });
                }
            });
        }
    }
];
//# sourceMappingURL=images.js.map