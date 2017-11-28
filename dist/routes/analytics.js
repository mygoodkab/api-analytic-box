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
var jsonfile = require('jsonfile');
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
                builder.where("id", request.params._id);
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
        path: '/analytics/update',
        config: {
            tags: ['api'],
            description: 'Update analytics data',
            notes: 'Update analytics data',
            validate: {
                payload: {
                    id: Joi.string().required(),
                    analyticsProfile: Joi.object(),
                }
            }
        },
        handler: function (request, reply) {
            if (request.payload) {
                request.payload.updateDate = new Date();
                db.collection('analytics').modify(request.payload).make((builder) => {
                    builder.where("id", request.payload.id);
                    builder.callback(function (err, res) {
                        db.collection('analytics').find().make((builder) => {
                            builder.where("id", request.payload.id);
                            builder.first();
                            builder.callback(function (err, res) {
                                console.log("update analytics : ");
                                console.log(res);
                                db.collection('assignAnalytics').modify({ analyticsInfo: res }).make(function (builder) {
                                    builder.where("_refAnalyticsId", request.payload.id);
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
                        db.collection('analytics').remove().make((builder) => {
                            builder.where("id", request.payload._id);
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
                            var analytics;
                            analyticsFileInfo.fileSize = filestat.size;
                            analyticsFileInfo.createdata = new Date();
                            console.log("upload profile successful");
                            extract(fileUploadName, { dir: path }, function (err) {
                                if (err) {
                                    console.log(err);
                                }
                                else {
                                    console.log("extract success  path : " + path);
                                    try {
                                        jsonfile.readFile(path + '/profile.json', function (err, result) {
                                            var analyticsProfile = result;
                                            if (err) {
                                                return reply({
                                                    statusCode: 400,
                                                    message: "Bad Request",
                                                    data: "Can't read or find JSON file"
                                                });
                                            }
                                            else {
                                                analytics = {
                                                    id: id,
                                                    refInfo: payload.refInfo,
                                                    analyticsProfile: result.analytics,
                                                    analyticsFileInfo: analyticsFileInfo,
                                                };
                                                console.log(analytics);
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
                                                            data: "Upload Analytics Successful"
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                    catch (err) {
                                        console.log(err);
                                        return reply({
                                            statusCode: 400,
                                            message: "Bad Request (Try Catch Error)",
                                            data: "Can't read or find JSON file"
                                        });
                                    }
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
    },
    {
        method: 'GET',
        path: '/analytics/get-image-logo/{id}',
        config: {
            tags: ['api'],
            description: 'Get image for UI',
            notes: 'Get image ',
            validate: {
                params: {
                    id: Joi.string().required().description('id analytics')
                }
            }
        },
        handler: (request, reply) => {
            db.collection('analytics').find().make((builder) => {
                builder.where("id", request.params.id);
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
                        let analyticsFileInfo = res.analyticsFileInfo;
                        let analyticsProfile = res.analyticsProfile;
                        let path = util_1.Util.analyticsPath() + analyticsFileInfo.name + pathSep.sep + analyticsProfile.logo;
                        console.log("Path analytics logo : " + path);
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
        method: 'GET',
        path: '/analytics/get-image-screenshot/{id}/{image}',
        config: {
            tags: ['api'],
            description: 'Get image for UI',
            notes: 'Get image ',
            validate: {
                params: {
                    id: Joi.string().required().description('id analytics'),
                    image: Joi.string().required().description('name image ("screenchot/screenshot1png")'),
                }
            }
        },
        handler: (request, reply) => {
            db.collection('analytics').find().make((builder) => {
                builder.where("id", request.params.id);
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
                        let analyticsFileInfo = res.analyticsFileInfo;
                        let analyticsProfile = res.analyticsProfile;
                        let path = util_1.Util.analyticsPath() + analyticsFileInfo.name + pathSep.sep + request.params.image;
                        console.log("Path analytics logo : " + path);
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
];
//# sourceMappingURL=analytics.js.map