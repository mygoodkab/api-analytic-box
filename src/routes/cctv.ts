import * as db from '../nosql-util';
import { Util } from '../util';
const objectid = require('objectid');
const Joi = require('joi')
const fs = require('fs');
const pathSep = require('path');
var csv = require('csvtojson');

//import { sqliteUtil } from '../sqlite-util';
//import { dbpath } from '../server';

module.exports = [
    {  // Get all cctv profile
        method: 'GET',
        path: '/cctv',
        config: {
            tags: ['api'],
            description: 'Get All cctv data',
            notes: 'Get All cctv data'
        },
        handler: (request, reply) => {
            db.collection('cctv').find().make((builder: any) => {
                builder.callback((err: any, res: any) => {
                    return reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    })
                });
            });
        }
    },
    {  // Get id cctv profile
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
            db.collection('cctv').find().make((builder: any) => {
                builder.where("_id", request.params._id)
                builder.callback((err: any, res: any) => {
                    return reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    })
                });
            });
        }
    },
    {  // Insert cctv  
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
                db.collection('cctv').insert(request.payload)
                return reply({
                    statusCode: 200,
                    message: "OK",
                    data: "cctv Succeed"
                })
            } else return reply({
                statusCode: 400,
                message: "Bad Request",
                data: "No payload"
            })
        }
    },
    {  // Update cctv
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
                db.collection('cctv').modify(request.payload).make(function (builder) {
                    builder.where("_id", request.payload._id);
                    builder.callback(function (err, res) {
                        return reply({
                            statusCode: 200,
                            message: "OK",
                            data: "Update Succeed"
                        })
                    });
                })
            } else {
                return reply({
                    statusCode: 400,
                    message: "Bad Request",
                    data: "No payload"
                })
            }
        }
    },
    {  //  Delete
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
            db.collection('cctv').remove().make((builder: any) => {
                builder.where("_id", request.payload._id)
                builder.callback((err: any, res: any) => {
                    if (err) {
                        return reply({
                            statusCode: 500,
                            message: "Can't delete id : " + request.payload._id,
                        })
                    } else {
                        return reply({
                            statusCode: 200,
                            message: "OK",
                        })
                    }

                });
            });
        }
    },
    {  // Upload csv convert to json and save to db 
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
            let req: any = request;
            let payload = req.payload;

            if (payload.file) {

                // separate filename, fileType from fullname
                let path = Util.csvPath();
                // check path file doesn't exist or something.
                fs.stat(path, function (err, stats) {
                    if (err) { // if file cctv not exist
                        fs.mkdir(Util.uploadRootPath() + "cctv", (err) => {
                            if (err) {
                                serverError("can't create folder")
                            }
                            existFile()
                        })

                    } else { // if file cctv exist
                        existFile()
                    }

                    function existFile() {
                        let filename = payload.file.hapi.filename.split('.');
                        let fileType = filename.splice(filename.length - 1, 1)[0];
                        if (fileType != 'csv') {
                            badRequest("Invalid file type")
                        }
                        filename = filename.join('.')
                        let storeName = Util.uniqid() + "." + fileType.toLowerCase()
                        // create imageInfo for insert info db
                        let id = objectid()
                        let fileInfo: any = {
                            id: id,
                            name: filename,
                            storeName: storeName,
                            fileType: fileType,
                            ts: new Date(),
                        }
                        // create file Stream
                        const pathCSV = path + fileInfo.name + "." + fileType.toLowerCase()
                        let file = fs.createWriteStream(pathCSV);

                        file.on('error', (err: any) => {
                            serverError("can't upload file")
                        })
                        // pass payload file to file stream for write info directory
                        payload.file.pipe(file);
                        payload.file.on('end', (err: any) => {
                            const filestat = fs.statSync(pathCSV);
                            fileInfo.fileSize = filestat.size;
                            fileInfo.createdata = new Date();
                            let csvtojson: any = [];
                            csv()
                                .fromFile(pathCSV)
                                .on('json', (jsonObj) => {
                                    if (typeof jsonObj != 'undefined') {
                                        console.log("convert csv to json : ", jsonObj)
                                        csvtojson.push(jsonObj)
                                        //csvtojson.push(jsonObj)
                                    }
                                })
                                .on('done', (error) => {
                                    let isErr = false;
                                    console.log("end : ", csvtojson)
                                    let i = 1;
                                      // loop insert data 
                                    for (let data of csvtojson) {
                                        db.collection('cctv').insert(data).callback((err) => {
                                            if (err) {
                                                isErr = true
                                            }
                                        })
                                        //ถ้า loop จนเสร็จแล้ว
                                        if (i == csvtojson.length) {
                                            insertData(isErr)
                                        }
                                        i++;
                                    }
                                     // ต้องมา return แบบนี้เพราะ วนลูบแล้ว reply ได้รอบเดียว 
                                    function insertData(isErr) {
                                        if (isErr) {
                                            serverError("Can't insert data")
                                        } else {
                                            return reply({
                                                statusCode: 200,
                                                msg: 'OK',
                                                data: csvtojson
                                            })
                                        }
                                    }

                                })
                                .on('error', (error) => {
                                    badRequest(error)
                                })
                        })
                    }

                })
            } else {
                badRequest("No such file in payload")
            }

            function badRequest(msg) {
                return reply({
                    statusCode: 400,
                    msg: 'Bad Request',
                    data: msg
                })
            }
            function serverError(msg) {
                return reply({
                    statusCode: 500,
                    msg: 'Server Error',
                    data: msg
                })
            }
        }
    }
];