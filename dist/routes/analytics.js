"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../util");
var ObjectIdMongo = require('mongodb').ObjectId;
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
const Boom = require("boom");
const analyticProfileModel = {
    name: "",
    cmd: "",
    price: "",
    shortDetail: "",
    fullDetail: "",
    level: "",
    framework: "",
    proccessingUnit: "",
    language: "",
    logo: "",
    screenshot: ""
};
module.exports = [
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
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const mongo = util_1.Util.getDb(request);
            let payload = request.payload;
            if (payload.file) {
                let pathAnalytics = util_1.Util.analyticsPath();
                fs.stat(pathAnalytics, (err, stats) => __awaiter(this, void 0, void 0, function* () {
                    if (err) {
                        fs.mkdir(util_1.Util.uploadRootPath() + "analytics", (err) => {
                            if (err) {
                                badRequest("can't create folder");
                            }
                            existFile();
                        });
                    }
                    else {
                        existFile();
                    }
                    function existFile() {
                        return __awaiter(this, void 0, void 0, function* () {
                            let filename = payload.file.hapi.filename.split('.');
                            let fileType = filename.splice(filename.length - 1, 1)[0];
                            filename = filename.join('.');
                            let storeName = util_1.Util.uniqid() + "." + fileType.toLowerCase();
                            let analyticsFileInfo = {
                                name: filename,
                                storeName: storeName,
                                fileType: fileType,
                                ts: new Date(),
                                refInfo: payload.refInfo
                            };
                            if (fs.existsSync(util_1.Util.analyticsPath() + filename)) {
                                console.log("file name's exist");
                                filename = filename + objectid.toString().substring(0, 5);
                            }
                            let path = util_1.Util.analyticsPath() + filename + pathSep.sep;
                            console.log("Upload Analytics Profile ... path /analytics/upload-profile : " + path);
                            mkdirp(path, function (err) {
                                let fileUploadName = path + analyticsFileInfo.name + "." + fileType;
                                let file = fs.createWriteStream(fileUploadName);
                                payload.file.pipe(file);
                                payload.file.on('end', (err) => {
                                    var filestat = fs.statSync(fileUploadName);
                                    var analytics;
                                    analyticsFileInfo.fileSize = filestat.size;
                                    analyticsFileInfo.createdata = new Date();
                                    console.log("upload profile successful");
                                    extract(fileUploadName, { dir: path }, (err) => __awaiter(this, void 0, void 0, function* () {
                                        if (err) {
                                            console.log(err);
                                            removeFile(filename);
                                        }
                                        else {
                                            console.log("extract success  path : " + path);
                                            try {
                                                YAML.load(path + 'docker-compose.yaml', (result) => {
                                                    if (!result) {
                                                        console.log("can't find 'docker-compose.yaml'");
                                                        removeFile(filename);
                                                    }
                                                    else {
                                                        jsonfile.readFile(path + '/profile.json', (err, result) => __awaiter(this, void 0, void 0, function* () {
                                                            var analyticsProfile = result.analytics;
                                                            if (!result) {
                                                                removeFile(filename);
                                                                badRequest("Can't read or find JSON file");
                                                            }
                                                            else {
                                                                let isMissingField = false;
                                                                for (let field in analyticProfileModel) {
                                                                    if (typeof analyticsProfile[field] == 'undefined') {
                                                                        isMissingField = true;
                                                                        break;
                                                                    }
                                                                }
                                                                if (isMissingField) {
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
                                                                            refInfo: payload.refInfo,
                                                                            analyticsProfile: result.analytics,
                                                                            analyticsFileInfo: analyticsFileInfo,
                                                                        };
                                                                        const insertAnalytics = yield mongo.collection('analytics').insertOne(analytics);
                                                                        console.log(analytics);
                                                                        reply({
                                                                            statusCode: 200,
                                                                            message: "OK",
                                                                            data: "Upload Analytics Successful"
                                                                        });
                                                                    }
                                                                    else {
                                                                        removeFile(filename);
                                                                        badRequest("Please check your screenshot/logo images");
                                                                    }
                                                                }
                                                            }
                                                        }));
                                                    }
                                                });
                                            }
                                            catch (err) {
                                                console.log(err);
                                                removeFile(filename);
                                                reply(Boom.badGateway(err));
                                            }
                                        }
                                    }));
                                });
                            });
                        });
                    }
                }));
            }
            else {
                badRequest("No file in payload");
            }
            function badRequest(msg) {
                reply(Boom.badRequest(msg));
            }
            function removeFile(analytics) {
                let cmd = "cd ../.." + util_1.Util.analyticsPath() + " &&  rm -rf " + analytics + " && echo eslab";
                exec(cmd, (error, stdout, stderr) => {
                    if (stdout) {
                        console.log("Remove file success Analytics : " + analytics);
                    }
                    else {
                        console.log("Can't Remove " + analytics);
                        console.log("cmd : " + cmd);
                    }
                });
            }
        })
    },
    {
        method: 'GET',
        path: '/analytics',
        config: {
            tags: ['api'],
            description: 'Get All analytics data',
            notes: 'Get All analytics data'
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const mongo = util_1.Util.getDb(request);
            try {
                const resAnalytics = yield mongo.collection('analytics').find().toArray();
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: resAnalytics
                });
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
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
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const mongo = util_1.Util.getDb(request);
            try {
                const resAnalytics = yield mongo.collection('analytics').findOne({ _id: ObjectIdMongo(request.params._id) });
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: resAnalytics
                });
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
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
                    analyticsProfile: Joi.object(),
                }
            }
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (request.payload) {
                    const mongo = util_1.Util.getDb(request);
                    const payload = request.payload;
                    payload.updateDate = new Date();
                    const updateAnalytics = yield mongo.collection('analytics').updateOne({ _id: ObjectIdMongo(payload._id) }, { $set: { analyticsProfile: payload.analyticsProfile } });
                    const updateAssignAnalytics = yield mongo.collection('assignAnalytics').updateMany({ _refAnalyticsId: payload._id }, { $set: { analyticsProfile: payload.analyticsProfile } });
                    reply({
                        statusCode: 200,
                        message: "OK",
                        data: "Update Succeed"
                    });
                }
                else {
                    reply(Boom.badRequest("No payload"));
                }
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
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
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                let payload = request.payload;
                const mongo = util_1.Util.getDb(request);
                const resAnalytics = yield mongo.collection('analytics').findOne({ _id: ObjectIdMongo(payload._id) });
                console.log(resAnalytics.name);
                if (resAnalytics) {
                    const resAssignAnalytics = yield mongo.collection('assignAnalytics').findOne({ _id: payload._id });
                    if (!resAssignAnalytics) {
                        const cmd = "cd ../.." + util_1.Util.analyticsPath() + " &&  rm -rf " + resAnalytics.analyticsFileInfo.name + " && echo eslab";
                        console.log("Command remove file  : " + cmd);
                        exec(cmd, (error, stdout, stderr) => __awaiter(this, void 0, void 0, function* () {
                            if (stdout) {
                                console.log("stdout " + stderr);
                                const removeAnalytics = yield mongo.collection('analytics').deleteOne({ _id: ObjectIdMongo(payload._id) });
                                reply({
                                    statusCode: 200,
                                    message: "OK",
                                });
                            }
                            else {
                                console.log("Stderr " + stderr);
                                badRequest("Stderr" + stderr);
                            }
                        }));
                    }
                    else {
                        badRequest("Can't delete because data is used");
                    }
                }
                else {
                    badRequest("No data");
                }
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
            function badRequest(msg) {
                reply(Boom.badRequest(msg));
            }
        })
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
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const mongo = util_1.Util.getDb(request);
            try {
                const resAnalytics = yield mongo.collection('analytics').findOne({ _id: ObjectIdMongo(request.params.id) });
                if (!resAnalytics) {
                    reply({
                        statusCode: 404,
                        message: "Bad Request",
                        data: "Data not found"
                    });
                }
                else {
                    var contentType;
                    switch (resAnalytics.fileType) {
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
                    let analyticsFileInfo = resAnalytics.analyticsFileInfo;
                    let analyticsProfile = resAnalytics.analyticsProfile;
                    let path = util_1.Util.analyticsPath() + analyticsFileInfo.name + pathSep.sep + analyticsProfile.logo;
                    reply.file(path, {
                        filename: resAnalytics.name + '.' + resAnalytics.fileType,
                        mode: 'inline'
                    }).type(contentType);
                }
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
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
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const mongo = util_1.Util.getDb(request);
            try {
                const resAnalytics = yield mongo.collection('analytics').findOne({ _id: ObjectIdMongo(request.params.id) });
                if (resAnalytics) {
                    var contentType;
                    switch (resAnalytics.fileType) {
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
                    let analyticsFileInfo = resAnalytics.analyticsFileInfo;
                    let analyticsProfile = resAnalytics.analyticsProfile;
                    let path = util_1.Util.analyticsPath() + analyticsFileInfo.name + pathSep.sep + request.params.image;
                    reply.file(path, {
                        filename: resAnalytics.name + '.' + resAnalytics.fileType,
                        mode: 'inline'
                    }).type(contentType);
                }
                else {
                    reply({
                        statusCode: 404,
                        message: "Bad Request",
                        data: "Data not found"
                    });
                }
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
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
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const payload = request.payload;
            const mongo = util_1.Util.getDb(request);
            try {
                const res = yield mongo.collection('analytics').findOne({ _id: ObjectIdMongo(payload._analyticsId) });
                const folderName = res.analyticsFileInfo.name;
                const path = util_1.Util.analyticsPath() + folderName + pathSep.sep;
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
                                reply({
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
                function badRequest(msg) {
                    reply({
                        statusCode: 400,
                        message: "Bad request",
                        data: msg
                    });
                }
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
    },
    {
        method: 'GET',
        path: '/analytics/version/{assignAnalyticsId}',
        config: {
            tags: ['api'],
            description: 'Get All analytics data',
            notes: 'Get All analytics data',
            validate: {
                params: {
                    assignAnalyticsid: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
        })
    }
];
//# sourceMappingURL=analytics.js.map