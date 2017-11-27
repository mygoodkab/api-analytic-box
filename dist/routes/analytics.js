"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db = require("../nosql-util");
const util_1 = require("../util");
const objectid = require('objectid');
const Joi = require('joi');
const fs = require('fs');
const pathSep = require('path');
const del = require('del');
const mkdirp = require('mkdirp');
var extract = require('extract-zip');
var YAML = require('yamljs');
module.exports = [
    {
        method: 'GET',
        path: '/analytics',
        config: {
            tags: ['api'],
            description: 'Get All analytics data',
            notes: 'Get All analytics data'
        },
        handler: (request, reply) => {
            db.collection('analytics').find().make((builder) => {
                builder.callback((err, res) => {
                    return reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    });
                });
            });
        }
    },
    {
        method: 'GET',
        path: '/analytics/{_id}',
        config: {
            tags: ['api'],
            description: 'Get id analytics data',
            notes: 'Get id analytics data',
            validate: {
                params: {
                    _id: Joi.string()
                        .required()
                        .description('id analytics'),
                }
            }
        },
        handler: (request, reply) => {
            db.collection('analytics').find().make((builder) => {
                builder.where("_id", request.params._id);
                builder.callback((err, res) => {
                    return reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    });
                });
            });
        }
    },
    {
        method: 'POST',
        path: '/analytics/insert',
        config: {
            tags: ['api'],
            description: 'Insert analytics data',
            notes: 'Insert analytics data <br><b> example command </b> <br> nvidia-docker exec --env=\"DISPLAY\" darknet /bin/sh -c \"cd /home/dev/host/darknet && ./darknet detector demo cfg/coco.data cfg/yolo.cfg weights/yolo.weights <br><b> PS. last don\'t close \" </b>',
            validate: {
                payload: {
                    name: Joi.string().required(),
                    parameter: Joi.array(),
                    cmd: Joi.string(),
                    price: Joi.string(),
                    shortDetail: Joi.string(),
                    fullDetail: Joi.string(),
                    level: Joi.string(),
                    architecture: Joi.string(),
                    proccessingUnit: Joi.string(),
                    language: Joi.string(),
                    refInfo: Joi.string(),
                }
            }
        },
        handler: (request, reply) => {
            if (request.payload) {
                request.payload.updateDate = new Date();
                request.payload._id = objectid();
                request.payload.idImages = "";
                request.payload.idImagesScreenShot = [];
                let path = util_1.Util.rootlogoImagePath() + request.payload.refInfo;
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
                db.collection('analytics').insert(request.payload);
                return reply({
                    statusCode: 200,
                    message: "OK",
                    data: "analytics Successd"
                });
            }
            else
                return reply({
                    statusCode: 400,
                    message: "Bad Request",
                    data: "No payload"
                });
        }
    },
    {
        method: 'POST',
        path: '/analytics/update',
        config: {
            tags: ['api'],
            description: 'Update analytics data',
            notes: 'Update analytics data',
            validate: {
                payload: {
                    _id: Joi.string().required(),
                    name: Joi.string(),
                    parameter: Joi.array(),
                    cmd: Joi.string(),
                    price: Joi.string(),
                    shortDetail: Joi.string(),
                    fullDetail: Joi.string(),
                    level: Joi.string(),
                    architecture: Joi.string(),
                    proccessingUnit: Joi.string(),
                    language: Joi.string(),
                }
            }
        },
        handler: function (request, reply) {
            if (request.payload) {
                request.payload.updateDate = new Date();
                db.collection('analytics').modify(request.payload).make(function (builder) {
                    builder.where("_id", request.payload._id);
                    builder.callback(function (err, res) {
                        db.collection('assignAnalytics').modify({ type: request.payload.name, analyticsInfo: request.payload }).make(function (builder) {
                            builder.where("_refAnalyticsId", request.payload._id);
                            builder.callback(function (err, res) {
                                return reply({
                                    statusCode: 200,
                                    message: "OK",
                                    data: "Update Succeed"
                                });
                            });
                        });
                    });
                });
            }
            else {
                return reply({
                    statusCode: 400,
                    message: "Bad Request",
                    data: "No payload"
                });
            }
        }
    },
    {
        method: 'POST',
        path: '/analytics/delete',
        config: {
            tags: ['api'],
            description: 'Delete analytics data',
            notes: 'Delete  analytics data',
            validate: {
                payload: {
                    _id: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => {
            db.collection('assignAnalytics').find().make((builder) => {
                builder.where("_refAnalyticsId", request.payload._id);
                builder.first();
                builder.callback((err, res) => {
                    if (typeof res == 'undefined') {
                        db.collection('analytics').find().make((builder) => {
                            builder.where("_id", request.payload._id);
                            builder.first();
                            builder.callback((err, res) => {
                                const path = util_1.Util.logoImagePath() + res.idImages;
                                del([path]).then(paths => {
                                    if (paths != "") {
                                        return reply({
                                            statusCode: 200,
                                            message: 'Deleted files and folders:\n' + paths.join('\n')
                                        });
                                    }
                                    else {
                                        db.collection('analytics').remove().make((builder) => {
                                            builder.where("_id", request.payload._id);
                                            builder.callback((err, res) => {
                                                if (err) {
                                                    return reply({
                                                        statusCode: 500,
                                                        message: "Can't delete id : " + request.payload._id,
                                                    });
                                                }
                                                else {
                                                    return reply({
                                                        statusCode: 200,
                                                        message: "OK",
                                                    });
                                                }
                                            });
                                        });
                                    }
                                });
                            });
                        });
                    }
                    else {
                        return reply({
                            statusCode: 500,
                            message: "Some data's used in assignAnalytics",
                        });
                    }
                });
            });
        }
    },
    {
        method: 'POST',
        path: '/analytics/upload-images',
        config: {
            tags: ['api'],
            description: 'Upload images',
            notes: 'Upload images',
            validate: {
                payload: {
                    file: Joi.any().meta({ swaggerType: 'file' }).description('file upload'),
                    refInfo: Joi.string().required()
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
                let path = util_1.Util.logoImagePath() + payload.refInfo + pathSep.sep;
                let filename = payload.file.hapi.filename.split('.');
                let fileType = filename.splice(filename.length - 1, 1)[0];
                filename = filename.join('.');
                let storeName = util_1.Util.uniqid() + "." + fileType.toLowerCase();
                let id = objectid();
                let imageInfo = {
                    _id: id,
                    name: filename,
                    storeName: storeName,
                    fileType: fileType,
                    ts: new Date(),
                    refInfo: payload.refInfo
                };
                let file = fs.createWriteStream(path + imageInfo.storeName);
                console.log("Upload logo image ... path /analytics/upload-images : " + path);
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
                    db.collection('analytics').modify({ idImages: id }).make((builder) => {
                        builder.where('refInfo', payload.refInfo);
                        builder.callback((err, res) => {
                            db.collection('analytics-images').insert(imageInfo);
                            return reply({
                                statusCode: 200,
                                msg: 'updata status success',
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
        path: '/analytics/get-images/{id}',
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
            db.collection('analytics-images').find().make((builder) => {
                builder.where("_id", request.params.id);
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
                        let path = util_1.Util.rootlogoImagePath() + res.refInfo + pathSep.sep + res.storeName;
                        return reply.file(path, {
                            filename: res.name + '.' + res.fileType,
                            mode: 'inline'
                        }).type(contentType);
                    }
                });
            });
        }
    },
    {
        method: 'POST',
        path: '/analytics/upload-images-screenshot',
        config: {
            tags: ['api'],
            description: 'Upload images',
            notes: 'Upload images',
            validate: {
                payload: {
                    file: Joi.any().meta({ swaggerType: 'file' }).description('file upload'),
                    refInfo: Joi.string().required()
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
                let path = util_1.Util.logoImagePath() + payload.refInfo + pathSep.sep;
                let filename = payload.file.hapi.filename.split('.');
                let fileType = filename.splice(filename.length - 1, 1)[0];
                filename = filename.join('.');
                let storeName = util_1.Util.uniqid() + "." + fileType.toLowerCase();
                let id = objectid();
                let imageInfo = {
                    _id: id,
                    name: filename,
                    storeName: storeName,
                    fileType: fileType,
                    ts: new Date(),
                    refInfo: payload.refInfo
                };
                let file = fs.createWriteStream(path + imageInfo.storeName);
                console.log("Upload Screenshot path '/analytics/upload-images-screenshot'" + path);
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
                    db.collection('analytics').find().make((builder) => {
                        builder.where('refInfo', payload.refInfo);
                        builder.first();
                        builder.callback((err, res) => {
                            let arr;
                            if (typeof res.idImagesScreenShot == 'undefined') {
                                res.idImagesScreenShot = [];
                                console.log('undified');
                            }
                            else {
                                arr = res.idImagesScreenShot;
                                arr.push(id);
                            }
                            db.collection('analytics').modify({ idImagesScreenShot: arr }).make((builder) => {
                                builder.where('refInfo', payload.refInfo);
                                builder.callback((err, res) => {
                                    db.collection('analytics-images').insert(imageInfo);
                                    return reply({
                                        statusCode: 200,
                                        msg: 'updata status success',
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
        method: 'POST',
        path: '/analytics/upload-profile',
        config: {
            tags: ['api'],
            description: 'Upload images',
            notes: 'Upload images',
            validate: {
                payload: {
                    file: Joi.any().meta({ swaggerType: 'file' }).description('file upload'),
                    refInfo: Joi.any(),
                }
            },
            payload: {
                parse: true,
                output: 'stream'
            },
        },
        handler: (request, reply) => {
            let req = request;
            let payload = req.payload;
            if (payload.file) {
                let filename = payload.file.hapi.filename.split('.');
                let fileType = filename.splice(filename.length - 1, 1)[0];
                filename = filename.join('.');
                let storeName = util_1.Util.uniqid() + "." + fileType.toLowerCase();
                let id = objectid();
                let analyticsFileInfo = {
                    name: filename,
                    storeName: storeName,
                    fileType: fileType,
                    ts: new Date(),
                    refInfo: payload.refInfo
                };
                let path = util_1.Util.analyticsPath() + filename + pathSep.sep;
                mkdirp(path, function (err) {
                    if (err) {
                        console.log("can't crate folder : " + err);
                        return reply({
                            statusCode: 500,
                            msg: 'Server error',
                            data: 'can\'t crate folder'
                        });
                    }
                    else {
                        let fileUploadName = path + analyticsFileInfo.name + "." + fileType;
                        let file = fs.createWriteStream(fileUploadName);
                        console.log("Upload Analytics Profile ... path /analytics/upload-profile : " + path);
                        file.on('error', (err) => {
                            console.log("can't upload analytics profile : " + err);
                            return reply({
                                statusCode: 500,
                                msg: 'Server error',
                                data: 'can\'t upload profile'
                            });
                        });
                        payload.file.pipe(file);
                        payload.file.on('end', (err) => {
                            var filestat = fs.statSync(fileUploadName);
                            analyticsFileInfo.fileSize = filestat.size;
                            analyticsFileInfo.createdata = new Date();
                            console.log("upload profile successful");
                            extract(fileUploadName, { dir: path }, function (err) {
                                if (err) {
                                    console.log(err);
                                }
                                else {
                                    console.log("extract success  path : " + path);
                                    YAML.load(path + filename + '/docker-compose.yaml', function (result) {
                                        var analytics = {
                                            id: id,
                                            refInfo: payload.refInfo,
                                            analyticsProfile: result.analytics,
                                            analyticsFileInfo: analyticsFileInfo,
                                        };
                                        db.collection('analytics').insert(analytics).callback(function (err) {
                                            if (err) {
                                                return reply({
                                                    statusCode: 500,
                                                    message: "Can't insert analytics profile ",
                                                });
                                            }
                                            else {
                                                return reply({
                                                    statusCode: 200,
                                                    message: "OK",
                                                    data: "Upload Analytics  Successful"
                                                });
                                            }
                                        });
                                    });
                                }
                            });
                        });
                    }
                });
            }
            else
                return reply({
                    statusCode: 400,
                    msg: 'Bad Request',
                    data: 'No file in payload'
                });
        }
    }
];
//# sourceMappingURL=analytics.js.map