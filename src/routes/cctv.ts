import * as db from '../nosql-util';
import { Util } from '../util';
import * as  Boom from 'boom'
import { collection } from '../nosql-util';
const objectid = require('objectid');
const Joi = require('joi')
const fs = require('fs');
const pathSep = require('path');
var csv = require('csvtojson');
const { exec } = require('child_process');
const mongoObjectId = require('mongodb').ObjectId;
module.exports = [
    {  // Get all cctv profile
        method: 'GET',
        path: '/cctv',
        config: {
            tags: ['api'],
            description: 'Get All cctv data',
            notes: 'Get All cctv data'
        },
        handler: async (request, reply) => {
            let dbm = Util.getDb(request)
            try {
                const res = await dbm.collection('cctv').find().toArray()
                if (res.length > 0) {
                    reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    })
                } else {
                    reply(Boom.notFound("NO data"))
                }

            } catch (error) {
                reply(Boom.badGateway(error))
            }
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
        handler: async (request, reply) => {
            let dbm = Util.getDb(request)
            try {
                const res = await dbm.collection('cctv').findOne({ _id: mongoObjectId(request.params._id) })
                if (res) {
                    reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    })
                } else {
                    reply(Boom.notFound("NO data"))
                }

            } catch (error) {
                reply(Boom.badGateway(error))
            }
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
        handler: async (request, reply) => {
            let dbm = Util.getDb(request)
            try {
                const insertUser = await dbm.collection('cctv').insertOne(request.payload)
                reply({
                    statusCode: 200,
                    message: "OK",
                })
            } catch (error) {
                reply(Boom.badGateway(error))
            }
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
        handler: async (request, reply) => {
            let dbm = Util.getDb(request)
            let payload = request.payload
            try {
                const payloadUpdate = {
                    format: payload.format,
                    brand: payload.brand,
                    model: payload.model
                }
                const update = await dbm.collection('cctv').updateOne({ _id:mongoObjectId(request.payload._id) }, { $set: payloadUpdate })
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: "Update Succeed"
                })
            } catch (error) {
                reply(Boom.badGateway(error))
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
        handler: async (request, reply) => {
            let dbm = Util.getDb(request)
            try {
                const del = await dbm.collection('cctv').deleteOne({ _id: mongoObjectId(request.payload._id) })
                reply({
                    statusCode: 200,
                    message: "OK",
                })
            } catch (error) {
                reply(Boom.badGateway(error))
            }
        }
    },
    {  // Upload csv convert to json and save to db 
        //===================================STEP==================================================
        // 1. check folder cctv if not exist ,this will create new one
        // 2. read fileInfo
        // 3. convert csv to json  (result is array)
        // 4. insert to DB  (by loop data in array) 
        //=========================================================================================
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
            let dbm = Util.getDb(request)
            try {

                if (payload.file) {
                    // separate filename, fileType from fullname
                    let path = Util.csvPath();
                    // check path file doesn't exist or something.
                    fs.stat(path, function (err, stats) {
                        if (err) { // if file cctv not exist
                            fs.mkdir(Util.uploadRootPath() + "cctv", (err) => {
                                existFile()
                            })

                        } else { // if file cctv exist
                            existFile()
                        }

                        function existFile() {
                            let filename = payload.file.hapi.filename.split('.');
                            let fileType = filename.splice(filename.length - 1, 1)[0];
                            if (fileType != 'csv') {
                                reply(Boom.badRequest("Invalid file type"))
                            } else {
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

                                // file.on('error', (err: any) => {
                                //     serverError("can't upload file")
                                // })
                                // pass payload file to file stream for write info directory
                                payload.file.pipe(file);
                                payload.file.on('end', (err: any) => {
                                    const filestat = fs.statSync(pathCSV);
                                    fileInfo.fileSize = filestat.size;
                                    fileInfo.createdata = new Date();
                                    let csvtojson: any = [];
                                    csv()
                                        .fromFile(pathCSV)
                                        .on('json', async (jsonObj) => {
                                            if (typeof jsonObj != 'undefined') {
                                                console.log("convert csv to json : ", jsonObj)
                                                csvtojson.push(jsonObj)
                                                //csvtojson.push(jsonObj)
                                            }
                                        })
                                        .on('done', async (error) => {
                                            let isErr = false;
                                            console.log("end : ", csvtojson)
                                            let i = 1;
                                            // loop insert data 
                                            if (csvtojson.length == 0) {

                                                removeFile(filename + "." + fileType)
                                                reply(Boom.badRequest("No data in file.csv"))
                                            } else {
                                                // check ตัวแปร ว่าตรงตามกำหนดไหม
                                                if (typeof csvtojson[0].model == 'undefined' || typeof csvtojson[0].format == 'undefined') {
                                                    removeFile(filename + "." + fileType)
                                                    reply(Boom.badRequest("Format data not match please check 'model' or 'format' "))
                                                } else {
                                                    for (let data of csvtojson) {
                                                        const insert = await dbm.collection('cctv').insertOne(data)
                                                        //ถ้า loop จนเสร็จแล้ว
                                                        if (i == csvtojson.length) {
                                                            insertData()
                                                        }
                                                        i++;
                                                    }
                                                }

                                            }
                                            // ต้องมา return แบบนี้เพราะ วนลูบแล้ว reply ได้รอบเดียว 
                                            function insertData() {
                                                reply({
                                                    statusCode: 200,
                                                    msg: 'OK',
                                                    data: csvtojson
                                                })
                                            }
                                        })
                                })
                            }
                        }
                    })
                } else {
                    Boom.badRequest("No such file in payload")
                }

                function removeFile(file) {
                    let cmd = "cd ../.." + Util.csvPath() + " &&  rm -rf " + file + " && echo eslab";
                    console.log(cmd)
                    exec(cmd, (error, stdout, stderr) => {
                        if (stdout) {
                            console.log("Remove file success Analytics : " + file)
                        } else {
                            console.log("Can't Remove")
                        }
                    })
                }
            } catch (error) {
                reply(Boom.badGateway(error))
            }
        }
    },
    //==============================================================================================================================================
    // {  // Get all cctv profile
    //     method: 'GET',
    //     path: '/cctv',
    //     config: {
    //         tags: ['api'],
    //         description: 'Get All cctv data',
    //         notes: 'Get All cctv data'
    //     },
    //     handler: (request, reply) => {
    //         db.collectionServer('cctv').find().make((builder: any) => {
    //             builder.callback((err: any, res: any) => {
    //                 reply({
    //                     statusCode: 200,
    //                     message: "OK",
    //                     data: res
    //                 })
    //             });
    //         });
    //     }
    // },
    // {  // Get id cctv profile
    //     method: 'GET',
    //     path: '/cctv/{_id}',
    //     config: {
    //         tags: ['api'],
    //         description: 'Get id cctv data',
    //         notes: 'Get id cctv data',
    //         validate: {
    //             params: {
    //                 _id: Joi.string()
    //                     .required()
    //             }
    //         }
    //     },
    //     handler: (request, reply) => {
    //         db.collectionServer('cctv').find().make((builder: any) => {
    //             builder.where("_id", request.params._id)
    //             builder.callback((err: any, res: any) => {
    //                 reply({
    //                     statusCode: 200,
    //                     message: "OK",
    //                     data: res
    //                 })
    //             });
    //         });
    //     }
    // },
    // {  // Insert cctv  
    //     method: 'POST',
    //     path: '/cctv/insert',
    //     config: {
    //         tags: ['api'],
    //         description: 'Insert cctv data',
    //         notes: 'Insert cctv data',
    //         validate: {
    //             payload: {
    //                 format: Joi.string().required(),
    //                 brand: Joi.string().required(),
    //                 model: Joi.string().required(),

    //             }
    //         }
    //     },
    //     handler: (request, reply) => {
    //         if (request.payload) {
    //             request.payload._id = objectid();
    //             db.collectionServer('cctv').insert(request.payload)
    //             reply({
    //                 statusCode: 200,
    //                 message: "OK",
    //                 data: "cctv Succeed"
    //             })
    //         } else reply({
    //             statusCode: 400,
    //             message: "Bad Request",
    //             data: "No payload"
    //         })
    //     }
    // },
    // {  // Update cctv
    //     method: 'POST',
    //     path: '/cctv/update',
    //     config: {
    //         tags: ['api'],
    //         description: 'Update cctv data',
    //         notes: 'Update cctv data',
    //         validate: {
    //             payload: {
    //                 _id: Joi.string().required(),
    //                 format: Joi.string(),
    //                 brand: Joi.string(),
    //                 model: Joi.string(),
    //             }
    //         }
    //     },
    //     handler: function (request, reply) {
    //         if (request.payload) {
    //             db.collectionServer('cctv').modify(request.payload).make(function (builder) {
    //                 builder.where("_id", request.payload._id);
    //                 builder.callback(function (err, res) {
    //                     reply({
    //                         statusCode: 200,
    //                         message: "OK",
    //                         data: "Update Succeed"
    //                     })
    //                 });
    //             })
    //         } else {
    //             reply({
    //                 statusCode: 400,
    //                 message: "Bad Request",
    //                 data: "No payload"
    //             })
    //         }
    //     }
    // },
    // {  //  Delete
    //     method: 'POST',
    //     path: '/cctv/delete',
    //     config: {
    //         tags: ['api'],
    //         description: 'Delete cctv data',
    //         notes: 'Delete  cctv data',
    //         validate: {
    //             payload: {
    //                 _id: Joi.string().required()
    //             }
    //         }
    //     },
    //     handler: (request, reply) => {
    //         db.collectionServer('cctv').remove().make((builder: any) => {
    //             builder.where("_id", request.payload._id)
    //             builder.callback((err: any, res: any) => {
    //                 if (err) {
    //                     reply({
    //                         statusCode: 500,
    //                         message: "Can't delete id : " + request.payload._id,
    //                     })
    //                 } else {
    //                     reply({
    //                         statusCode: 200,
    //                         message: "OK",
    //                     })
    //                 }

    //             });
    //         });
    //     }
    // },
    // {  // Upload csv convert to json and save to db 
    //     //===================================STEP==================================================
    //     // 1. check folder cctv if not exist ,this will create new one
    //     // 2. read fileInfo
    //     // 3. convert csv to json  (result is array)
    //     // 4. insert to DB  (by loop data in array) 
    //     //=========================================================================================
    //     method: 'POST',
    //     path: '/cctv/upload',
    //     config: {
    //         tags: ['api'],
    //         description: 'Upload file csv',
    //         notes: 'Upload file csv',
    //         validate: {
    //             payload: {
    //                 file: Joi.any().meta({ swaggerType: 'file' }).description('upload file csv'),
    //             }
    //         },
    //         payload: {
    //             maxBytes: 5000000,
    //             parse: true,
    //             output: 'stream'
    //         },
    //     },
    //     handler: (request, reply) => {
    //         let req: any = request;
    //         let payload = req.payload;

    //         if (payload.file) {

    //             // separate filename, fileType from fullname
    //             let path = Util.csvPath();
    //             // check path file doesn't exist or something.
    //             fs.stat(path, function (err, stats) {
    //                 if (err) { // if file cctv not exist
    //                     fs.mkdir(Util.uploadRootPath() + "cctv", (err) => {
    //                         if (err) {
    //                             serverError("can't create folder")
    //                         }
    //                         existFile()
    //                     })

    //                 } else { // if file cctv exist
    //                     existFile()
    //                 }

    //                 function existFile() {
    //                     let filename = payload.file.hapi.filename.split('.');
    //                     let fileType = filename.splice(filename.length - 1, 1)[0];
    //                     if (fileType != 'csv') {
    //                         badRequest("Invalid file type")
    //                     } else {
    //                         filename = filename.join('.')
    //                         let storeName = Util.uniqid() + "." + fileType.toLowerCase()
    //                         // create imageInfo for insert info db
    //                         let id = objectid()
    //                         let fileInfo: any = {
    //                             id: id,
    //                             name: filename,
    //                             storeName: storeName,
    //                             fileType: fileType,
    //                             ts: new Date(),
    //                         }
    //                         // create file Stream
    //                         const pathCSV = path + fileInfo.name + "." + fileType.toLowerCase()
    //                         let file = fs.createWriteStream(pathCSV);

    //                         file.on('error', (err: any) => {
    //                             serverError("can't upload file")
    //                         })
    //                         // pass payload file to file stream for write info directory
    //                         payload.file.pipe(file);
    //                         payload.file.on('end', (err: any) => {
    //                             const filestat = fs.statSync(pathCSV);
    //                             fileInfo.fileSize = filestat.size;
    //                             fileInfo.createdata = new Date();
    //                             let csvtojson: any = [];
    //                             csv()
    //                                 .fromFile(pathCSV)
    //                                 .on('json', (jsonObj) => {
    //                                     if (typeof jsonObj != 'undefined') {
    //                                         console.log("convert csv to json : ", jsonObj)
    //                                         csvtojson.push(jsonObj)
    //                                         //csvtojson.push(jsonObj)
    //                                     }
    //                                 })
    //                                 .on('done', (error) => {
    //                                     let isErr = false;
    //                                     console.log("end : ", csvtojson)
    //                                     let i = 1;
    //                                     // loop insert data 
    //                                     if (csvtojson.length == 0) {
    //                                         badRequest("No data in file.csv")
    //                                         removeFile(filename + "." + fileType)
    //                                     } else {
    //                                         // check ตัวแปร ว่าตรงตามกำหนดไหม
    //                                         if (typeof csvtojson[0].model == 'undefined' || typeof csvtojson[0].format == 'undefined') {
    //                                             badRequest("Format data not match please check 'model' or 'format' ")
    //                                             removeFile(filename + "." + fileType)
    //                                         } else {
    //                                             for (let data of csvtojson) {
    //                                                 db.collectionServer('cctv').insert(data).callback((err) => {
    //                                                     if (err) {
    //                                                         isErr = true
    //                                                     }
    //                                                 })
    //                                                 //ถ้า loop จนเสร็จแล้ว
    //                                                 if (i == csvtojson.length) {
    //                                                     insertData(isErr)
    //                                                 }
    //                                                 i++;
    //                                             }
    //                                         }

    //                                     }
    //                                     // ต้องมา return แบบนี้เพราะ วนลูบแล้ว reply ได้รอบเดียว 
    //                                     function insertData(isErr) {
    //                                         if (isErr) {
    //                                             serverError("Can't insert data")
    //                                         } else {
    //                                             reply({
    //                                                 statusCode: 200,
    //                                                 msg: 'OK',
    //                                                 data: csvtojson
    //                                             })
    //                                         }
    //                                     }

    //                                 })
    //                                 .on('error', (error) => {
    //                                     badRequest(error)
    //                                 })
    //                         })
    //                     }

    //                 }

    //             })
    //         } else {
    //             badRequest("No such file in payload")
    //         }

    //         function badRequest(msg) {
    //             reply({
    //                 statusCode: 400,
    //                 msg: 'Bad Request',
    //                 data: msg
    //             })
    //         }
    //         function serverError(msg) {
    //             reply({
    //                 statusCode: 500,
    //                 msg: 'Server Error',
    //                 data: msg
    //             })
    //         }

    //         function removeFile(file) {
    //             let cmd = "cd ../.." + Util.csvPath() + " &&  rm -rf " + file + " && echo eslab";
    //             console.log(cmd)
    //             exec(cmd, (error, stdout, stderr) => {
    //                 if (stdout) {
    //                     console.log("Remove file success Analytics : " + file)
    //                 } else {
    //                     console.log("Can't Remove")
    //                 }
    //             })
    //         }
    //     }
    // }
];