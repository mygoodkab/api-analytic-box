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
const { exec } = require('child_process');
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
            let payload = request.payload;
            db.collection('analytics').find().make((builder) => {
                builder.where('id', payload._id);
                builder.first();
                builder.callback((err, res) => {
                    if (err) {
                        badRequest("Error can't data in analytics");
                    }
                    else {
                        let analyticsFileInfo = res.analyticsFileInfo;
                        db.collection("assignAnalytics").find().make((builder) => {
                            builder.where('_refAnalyticsId', payload._id);
                            builder.first();
                            builder.callback((err, res) => {
                                if (res) {
                                    badRequest("Can't delete because data is used");
                                }
                                else {
                                    const cmd = "cd ../.." + util_1.Util.analyticsPath() + " &&  rm -rf " + analyticsFileInfo.name + " && echo eslab";
                                    exec(cmd, (error, stdout, stderr) => {
                                        if (error) {
                                            console.log("Error " + error);
                                            badRequest("Error " + error);
                                        }
                                        else if (stdout) {
                                            db.collection('analytics').remove().make((builder) => {
                                                builder.where("id", request.payload._id);
                                                builder.callback((err, res) => {
                                                    if (err) {
                                                        badRequest("Can't Delete data");
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
                                            console.log("Stderr " + stderr);
                                            badRequest("Stderr" + stderr);
                                        }
                                    });
                                }
                            });
                        });
                    }
                });
            });
            function badRequest(msg) {
                return reply({
                    statusCode: 400,
                    message: "Bad Request",
                    data: msg
                });
            }
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
                maxBytes: 500000000,
                parse: true,
                output: 'stream'
            },
        },
        handler: (request, reply) => {
            let req = request;
            let payload = req.payload;
            if (payload.file) {
                let pathAnalytics = util_1.Util.analyticsPath();
                fs.stat(pathAnalytics, function (err, stats) {
                    if (err) {
                        fs.mkdir(util_1.Util.uploadRootPath() + "analytics", (err) => {
                            if (err) {
                                serverError("can't create folder");
                            }
                            existFile();
                        });
                    }
                    else {
                        existFile();
                    }
                    function existFile() {
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
                        console.log("Upload Analytics Profile ... path /analytics/upload-profile : " + path);
                        if (fs.existsSync(util_1.Util.analyticsPath() + filename)) {
                            badRequest("file name's exist ");
                        }
                        else {
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
                                                removeFile(filename);
                                                badRequest("Can't extract file");
                                            }
                                            else {
                                                console.log("extract success  path : " + path);
                                                try {
                                                    YAML.load(path + 'docker-compose.yaml', (result) => {
                                                        if (!result) {
                                                            console.log("can't find 'docker-compose.yaml'");
                                                            removeFile(filename);
                                                            badRequest("can't find 'docker-compose.yaml'");
                                                        }
                                                        else {
                                                            jsonfile.readFile(path + '/profile.json', function (err, result) {
                                                                var analyticsProfile = result.analytics;
                                                                if (err || !result) {
                                                                    removeFile(filename);
                                                                    badRequest("Can't read or find JSON file");
                                                                }
                                                                else {
                                                                    if (typeof analyticsProfile.name == "undefined" ||
                                                                        typeof analyticsProfile.cmd == "undefined" ||
                                                                        typeof analyticsProfile.price == "undefined" ||
                                                                        typeof analyticsProfile.shortDetail == "undefined" ||
                                                                        typeof analyticsProfile.fullDetail == "undefined" ||
                                                                        typeof analyticsProfile.level == "undefined" ||
                                                                        typeof analyticsProfile.framework == "undefined" ||
                                                                        typeof analyticsProfile.proccessingUnit == "undefined" ||
                                                                        typeof analyticsProfile.language == "undefined" ||
                                                                        typeof analyticsProfile.logo == "undefined" ||
                                                                        typeof analyticsProfile.screenshot == "undefined") {
                                                                        removeFile(filename);
                                                                        badRequest("Invaild data please check your file JSON");
                                                                    }
                                                                    else {
                                                                        var fileimages = true;
                                                                        if (!fs.existsSync(path + analyticsProfile.logo)) {
                                                                            fileimages = false;
                                                                        }
                                                                        else {
                                                                            if (analyticsProfile.screenshot) {
                                                                                for (var screenchot of analyticsProfile.screenshot) {
                                                                                    if (!fs.existsSync(path + screenchot)) {
                                                                                        fileimages = false;
                                                                                        console.log("JSON analytics.screenchot not match folder");
                                                                                    }
                                                                                }
                                                                            }
                                                                            else {
                                                                                removeFile(filename);
                                                                                badRequest("JSON analytics.screenchot not match folder");
                                                                            }
                                                                        }
                                                                        if (fileimages) {
                                                                            analytics = {
                                                                                id: id,
                                                                                refInfo: payload.refInfo,
                                                                                analyticsProfile: result.analytics,
                                                                                analyticsFileInfo: analyticsFileInfo,
                                                                            };
                                                                            db.collection('analytics').insert(analytics).callback(function (err) {
                                                                                if (err) {
                                                                                    removeFile(filename);
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
                                                                        else {
                                                                            removeFile(filename);
                                                                            badRequest("Please check your screenshot/logo images");
                                                                        }
                                                                    }
                                                                }
                                                            });
                                                        }
                                                    });
                                                }
                                                catch (err) {
                                                    console.log(err);
                                                    removeFile(filename);
                                                    badRequest("Can't read or find JSON file");
                                                }
                                            }
                                        });
                                    });
                                }
                            });
                        }
                    }
                });
            }
            else {
                badRequest("No file in payload");
            }
            function serverError(msg) {
                return reply({
                    statusCode: 500,
                    msg: 'Server error',
                    data: msg
                });
            }
            function badRequest(msg) {
                return reply({
                    statusCode: 400,
                    msg: 'Bad Request',
                    data: msg
                });
            }
            function removeFile(analytics) {
                let cmd = "cd ../.." + util_1.Util.analyticsPath() + " &&  rm -rf " + analytics + " && echo eslab";
                exec(cmd, (error, stdout, stderr) => {
                    if (stdout) {
                        console.log("Remove file success Analytics : " + analytics);
                    }
                    else {
                        console.log("Can't  Remove");
                    }
                });
            }
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
        method: 'POST',
        path: '/analytics/yaml',
        config: {
            tags: ['api'],
            description: 'Read yaml file convert to json ',
            notes: 'Read yaml file convert to json ',
            validate: {
                payload: {
                    _analyticsId: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => {
            const payload = request.payload;
            db.collection('analytics').find().make((builder) => {
                builder.where('id', payload._analyticsId);
                builder.first();
                builder.callback((err, res) => {
                    const folderName = res.analyticsFileInfo.name;
                    const path = util_1.Util.analyticsPath() + folderName + pathSep.sep;
                    try {
                        YAML.load(path + 'docker-compose.yaml', (result) => {
                            if (result != null) {
                                if (typeof result.services != 'undefined') {
                                    let key = Object.keys(result.services);
                                    let environment = result.services[key[0]].environment;
                                    if (typeof environment != 'undefined') {
                                        let inputSchema = { properties: {} };
                                        for (let data of environment) {
                                            let isTrue = true;
                                            let str = data.split("=");
                                            if (str[1].toLowerCase() == 'true' || str[1].toLowerCase() == 'false') {
                                                if (str[1].toLowerCase() == 'false') {
                                                    isTrue = false;
                                                }
                                                inputSchema.properties[str[0]] = JSON.parse('{"type":"' + typeof isTrue + '","default":"' + isTrue + '","description":"' + str[0] + '"}');
                                            }
                                            else {
                                                inputSchema.properties[str[0]] = JSON.parse('{"type":"' + typeof str[1] + '","default":"' + str[1] + '","description":"' + str[0] + '"}');
                                            }
                                        }
                                        return reply({
                                            statusCode: 200,
                                            message: "Read Yaml convent to Json success",
                                            data: inputSchema
                                        });
                                    }
                                    else {
                                        badRequest("Can't find  result.services.*.environment in docker-compose.yaml");
                                    }
                                }
                                else {
                                    badRequest("Can't find result.services in docker-compose.yaml");
                                }
                            }
                            else {
                                badRequest("Can't find folder " + folderName);
                            }
                        });
                    }
                    catch (e) {
                        console.log("ERROR docker compose : " + e);
                        badRequest(e);
                    }
                });
            });
            function badRequest(msg) {
                return reply({
                    statusCode: 400,
                    message: "Bad request",
                    data: msg
                });
            }
        }
    }
];
//# sourceMappingURL=analytics.js.map