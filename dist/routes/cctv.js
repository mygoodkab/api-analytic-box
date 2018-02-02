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
const Boom = require("boom");
const objectid = require('objectid');
const Joi = require('joi');
const fs = require('fs');
const pathSep = require('path');
var csv = require('csvtojson');
const { exec } = require('child_process');
const mongoObjectId = require('mongodb').ObjectId;
module.exports = [
    {
        method: 'GET',
        path: '/cctv',
        config: {
            tags: ['api'],
            description: 'Get All cctv data',
            notes: 'Get All cctv data'
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            let dbm = util_1.Util.getDb(request);
            try {
                const res = yield dbm.collection('cctv').find().toArray();
                if (res.length > 0) {
                    reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    });
                }
                else {
                    reply(Boom.notFound("NO data"));
                }
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
    },
    {
        method: 'GET',
        path: '/cctv/{_id}',
        config: {
            tags: ['api'],
            description: 'Get id cctv data',
            notes: 'Get id cctv data',
            validate: {
                params: {
                    _id: Joi.string()
                        .required()
                }
            }
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            let dbm = util_1.Util.getDb(request);
            try {
                const res = yield dbm.collection('cctv').findOne({ _id: mongoObjectId(request.params._id) });
                if (res) {
                    reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    });
                }
                else {
                    reply(Boom.notFound("NO data"));
                }
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
    },
    {
        method: 'POST',
        path: '/cctv/insert',
        config: {
            tags: ['api'],
            description: 'Insert cctv data',
            notes: 'Insert cctv data',
            validate: {
                payload: {
                    format: Joi.string().required(),
                    brand: Joi.string().required(),
                    model: Joi.string().required(),
                }
            }
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            let dbm = util_1.Util.getDb(request);
            try {
                const insertUser = yield dbm.collection('cctv').insertOne(request.payload);
                reply({
                    statusCode: 200,
                    message: "OK",
                });
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
    },
    {
        method: 'POST',
        path: '/cctv/update',
        config: {
            tags: ['api'],
            description: 'Update cctv data',
            notes: 'Update cctv data',
            validate: {
                payload: {
                    _id: Joi.string().required(),
                    format: Joi.string(),
                    brand: Joi.string(),
                    model: Joi.string(),
                }
            }
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            let dbm = util_1.Util.getDb(request);
            let payload = request.payload;
            try {
                const payloadUpdate = {
                    format: payload.format,
                    brand: payload.brand,
                    model: payload.model
                };
                const update = yield dbm.collection('cctv').updateOne({ _id: request.payload._id }, { $set: payloadUpdate });
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: "Update Succeed"
                });
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
    },
    {
        method: 'POST',
        path: '/cctv/delete',
        config: {
            tags: ['api'],
            description: 'Delete cctv data',
            notes: 'Delete  cctv data',
            validate: {
                payload: {
                    _id: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            let dbm = util_1.Util.getDb(request);
            try {
                const del = yield dbm.collection('cctv').deleteOne({ _id: mongoObjectId(request.payload._id) });
                reply({
                    statusCode: 200,
                    message: "OK",
                });
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
    },
    {
        method: 'POST',
        path: '/cctv/upload',
        config: {
            tags: ['api'],
            description: 'Upload file csv',
            notes: 'Upload file csv',
            validate: {
                payload: {
                    file: Joi.any().meta({ swaggerType: 'file' }).description('upload file csv'),
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
            let dbm = util_1.Util.getDb(request);
            try {
                if (payload.file) {
                    let path = util_1.Util.csvPath();
                    fs.stat(path, function (err, stats) {
                        if (err) {
                            fs.mkdir(util_1.Util.uploadRootPath() + "cctv", (err) => {
                                existFile();
                            });
                        }
                        else {
                            existFile();
                        }
                        function existFile() {
                            let filename = payload.file.hapi.filename.split('.');
                            let fileType = filename.splice(filename.length - 1, 1)[0];
                            if (fileType != 'csv') {
                                reply(Boom.badRequest("Invalid file type"));
                            }
                            else {
                                filename = filename.join('.');
                                let storeName = util_1.Util.uniqid() + "." + fileType.toLowerCase();
                                let id = objectid();
                                let fileInfo = {
                                    id: id,
                                    name: filename,
                                    storeName: storeName,
                                    fileType: fileType,
                                    ts: new Date(),
                                };
                                const pathCSV = path + fileInfo.name + "." + fileType.toLowerCase();
                                let file = fs.createWriteStream(pathCSV);
                                payload.file.pipe(file);
                                payload.file.on('end', (err) => {
                                    const filestat = fs.statSync(pathCSV);
                                    fileInfo.fileSize = filestat.size;
                                    fileInfo.createdata = new Date();
                                    let csvtojson = [];
                                    csv()
                                        .fromFile(pathCSV)
                                        .on('json', (jsonObj) => __awaiter(this, void 0, void 0, function* () {
                                        if (typeof jsonObj != 'undefined') {
                                            console.log("convert csv to json : ", jsonObj);
                                            csvtojson.push(jsonObj);
                                        }
                                    }))
                                        .on('done', (error) => __awaiter(this, void 0, void 0, function* () {
                                        let isErr = false;
                                        console.log("end : ", csvtojson);
                                        let i = 1;
                                        if (csvtojson.length == 0) {
                                            removeFile(filename + "." + fileType);
                                            reply(Boom.badRequest("No data in file.csv"));
                                        }
                                        else {
                                            if (typeof csvtojson[0].model == 'undefined' || typeof csvtojson[0].format == 'undefined') {
                                                removeFile(filename + "." + fileType);
                                                reply(Boom.badRequest("Format data not match please check 'model' or 'format' "));
                                            }
                                            else {
                                                for (let data of csvtojson) {
                                                    const insert = yield dbm.collection('cctv').insertOne(data);
                                                    if (i == csvtojson.length) {
                                                        insertData();
                                                    }
                                                    i++;
                                                }
                                            }
                                        }
                                        function insertData() {
                                            reply({
                                                statusCode: 200,
                                                msg: 'OK',
                                                data: csvtojson
                                            });
                                        }
                                    }));
                                });
                            }
                        }
                    });
                }
                else {
                    Boom.badRequest("No such file in payload");
                }
                function removeFile(file) {
                    let cmd = "cd ../.." + util_1.Util.csvPath() + " &&  rm -rf " + file + " && echo eslab";
                    console.log(cmd);
                    exec(cmd, (error, stdout, stderr) => {
                        if (stdout) {
                            console.log("Remove file success Analytics : " + file);
                        }
                        else {
                            console.log("Can't Remove");
                        }
                    });
                }
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        }
    },
];
//# sourceMappingURL=cctv.js.map