"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db = require("../nosql-util");
const util_1 = require("../util");
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
        handler: (request, reply) => {
            db.collectionServer('cctv').find().make((builder) => {
                builder.callback((err, res) => {
                    reply({
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
        handler: (request, reply) => {
            db.collectionServer('cctv').find().make((builder) => {
                builder.where("_id", request.params._id);
                builder.callback((err, res) => {
                    reply({
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
        handler: (request, reply) => {
            if (request.payload) {
                request.payload._id = objectid();
                db.collectionServer('cctv').insert(request.payload);
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: "cctv Succeed"
                });
            }
            else
                reply({
                    statusCode: 400,
                    message: "Bad Request",
                    data: "No payload"
                });
        }
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
        handler: function (request, reply) {
            if (request.payload) {
                db.collectionServer('cctv').modify(request.payload).make(function (builder) {
                    builder.where("_id", request.payload._id);
                    builder.callback(function (err, res) {
                        reply({
                            statusCode: 200,
                            message: "OK",
                            data: "Update Succeed"
                        });
                    });
                });
            }
            else {
                reply({
                    statusCode: 400,
                    message: "Bad Request",
                    data: "No payload"
                });
            }
        }
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
        handler: (request, reply) => {
            db.collectionServer('cctv').remove().make((builder) => {
                builder.where("_id", request.payload._id);
                builder.callback((err, res) => {
                    if (err) {
                        reply({
                            statusCode: 500,
                            message: "Can't delete id : " + request.payload._id,
                        });
                    }
                    else {
                        reply({
                            statusCode: 200,
                            message: "OK",
                        });
                    }
                });
            });
        }
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
            if (payload.file) {
                let path = util_1.Util.csvPath();
                fs.stat(path, function (err, stats) {
                    if (err) {
                        fs.mkdir(util_1.Util.uploadRootPath() + "cctv", (err) => {
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
                        if (fileType != 'csv') {
                            badRequest("Invalid file type");
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
                            file.on('error', (err) => {
                                serverError("can't upload file");
                            });
                            payload.file.pipe(file);
                            payload.file.on('end', (err) => {
                                const filestat = fs.statSync(pathCSV);
                                fileInfo.fileSize = filestat.size;
                                fileInfo.createdata = new Date();
                                let csvtojson = [];
                                csv()
                                    .fromFile(pathCSV)
                                    .on('json', (jsonObj) => {
                                    if (typeof jsonObj != 'undefined') {
                                        console.log("convert csv to json : ", jsonObj);
                                        csvtojson.push(jsonObj);
                                    }
                                })
                                    .on('done', (error) => {
                                    let isErr = false;
                                    console.log("end : ", csvtojson);
                                    let i = 1;
                                    if (csvtojson.length == 0) {
                                        badRequest("No data in file.csv");
                                        removeFile(filename + "." + fileType);
                                    }
                                    else {
                                        if (typeof csvtojson[0].model == 'undefined' || typeof csvtojson[0].format == 'undefined') {
                                            badRequest("Format data not match please check 'model' or 'format' ");
                                            removeFile(filename + "." + fileType);
                                        }
                                        else {
                                            for (let data of csvtojson) {
                                                db.collectionServer('cctv').insert(data).callback((err) => {
                                                    if (err) {
                                                        isErr = true;
                                                    }
                                                });
                                                if (i == csvtojson.length) {
                                                    insertData(isErr);
                                                }
                                                i++;
                                            }
                                        }
                                    }
                                    function insertData(isErr) {
                                        if (isErr) {
                                            serverError("Can't insert data");
                                        }
                                        else {
                                            reply({
                                                statusCode: 200,
                                                msg: 'OK',
                                                data: csvtojson
                                            });
                                        }
                                    }
                                })
                                    .on('error', (error) => {
                                    badRequest(error);
                                });
                            });
                        }
                    }
                });
            }
            else {
                badRequest("No such file in payload");
            }
            function badRequest(msg) {
                reply({
                    statusCode: 400,
                    msg: 'Bad Request',
                    data: msg
                });
            }
            function serverError(msg) {
                reply({
                    statusCode: 500,
                    msg: 'Server Error',
                    data: msg
                });
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
    }
];
//# sourceMappingURL=cctv.js.map