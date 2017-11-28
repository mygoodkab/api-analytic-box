// =================================================================================================================================
//                                                              Upload Image
// =================================================================================================================================
//   When upload image 
//      1) Upload profile         path '/images/upload-profile'     db 'faceInfo'
//           + firstname          payload
//           + lastname           payload
//           + type               payload
//           + age                payload
//           + gender             payload
//           + refInfo            payload
//           + _id                auto
//        *** upload profile ***
//            1 create folder by using refInfo as folder name 
//            2 insert profile name  
//
//      2) Upload file image      path '/images/upload'              db  'iamges' , 'assignAnalytics'
//            + _idImageRegister  auto
//            + name              auto
//            + storeName         auto
//            + fileType          auto
//            + ts                auto
//            + refInfo           payload
//            + fileSize          auto
//            + createdata        auto
//        *** upload file image  ***
//            1 upload file to new folder as refInfo name   
//            2 select faceInfo to get lastest imagesId where refInfo  && update (add) current imagesId to faceInfo 
//            3 insert data of image to images db
//            4 get assignAnalytic to find cmd/nickname to stop docker where type 'regnition' 
//            5 loop for run cmd && update status assignAnalytics to 'offline' if not error
//
//      3) When client (web ui) get image
//            1 get all faceInfo                           path   '/images'                   db  'faceInfo'
//            2 get file image from image id               path   '/images/get-images/{id}'   folder image 
//
//      4) Delete image && folder by refnInfo              path    '/images/delete-folder'     db 'faceInfo' ,'images' 
//            1 remove imageInfo  from faceInfo 
//            2 remove faceInfo from images
//            2 delete folder by refInfo                  
// =================================================================================================================================
import * as db from '../nosql-util';
import { Util } from '../util';
const pathSep = require('path');
const objectid = require('objectid');
const Joi = require('joi')
const fs = require('fs');
const DIR = '../uploads/';
const mkdirp = require('mkdirp');
const del = require('del');
const child_process = require('child_process');
const {spawn} = require('child_process');
module.exports = [
    { // Upload image-profile
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
            let req: any = request;
            let payload = req.payload;
            payload.idImages = [];
            if (payload) {
                let path = Util.uploadImagePath() + payload.refInfo;
                mkdirp(path, function (err) {
                    if (err) {
                        return reply({
                            statusCode: 500,
                            msg: 'Server error',
                            data: 'can\'t crate folder'
                        })
                    }
                    else console.log('create folder!' + path)
                });
                payload._id = objectid()
                db.collection('faceInfo').insert(payload);
                return reply({
                    statusCode: 200,
                    msg: 'OK',
                })
            } else return reply({
                statusCode: 400,
                msg: 'Bad Request',
                data: 'No file in payload'
            })
        }
    },
    { // Upload image file
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
            let req: any = request;
            let payload = req.payload;

            if (payload.file) {

                // separate filename, fileType from fullname
                let path = Util.uploadImagePath() + payload.refInfo + pathSep.sep;
                let filename = payload.file.hapi.filename.split('.');
                let fileType = filename.splice(filename.length - 1, 1)[0];
                filename = filename.join('.')
                let storeName = Util.uniqid() + "." + fileType.toLowerCase()
                // create imageInfo for insert info db
                let id = objectid()
                let imageInfo: any = {
                    _idImageRegister: id,
                    name: filename,
                    storeName: storeName,
                    fileType: fileType,
                    ts: new Date(),
                    refInfo: payload.refInfo
                }
                // create file Stream
                let file = fs.createWriteStream(path + imageInfo.storeName);

                file.on('error', (err: any) => {
                    return reply({
                        statusCode: 500,
                        msg: 'Server error',
                        data: 'can\'t upload image'
                    })
                })
                // pass payload file to file stream for write info directory
                payload.file.pipe(file);
                payload.file.on('end', (err: any) => {
                    var filestat = fs.statSync(path + imageInfo.storeName);
                    imageInfo.fileSize = filestat.size;
                    imageInfo.createdata = new Date();
                    // update image id to faceinfo 
                    db.collection('faceInfo').find().make((builder: any) => {
                        builder.where('refInfo', payload.refInfo)
                        builder.callback((err: any, res: any) => {
                            res = res[0]
                            let arr = res.idImages;
                            arr.push(id)
                            // update image id to faceinfo 
                            db.collection('faceInfo').modify({ idImages: arr }).make((builder: any) => {
                                builder.where('refInfo', payload.refInfo)
                                builder.callback((err: any, res: any) => {
                                    // insert image Info to db
                                    db.collection('images').insert(imageInfo);
                                    // select assignAnalytics where type recognition to stop
                                    db.collection('assignAnalytics').modify({ status: 'stop' }).make((builder: any) => {
                                        builder.where('type', 'recognition')
                                        builder.callback((err: any, res: any) => {
                                            if (res.length == 0) {
                                                return reply({
                                                    statusCode: 200,
                                                    msg: 'have no assignAnalytics data to stop docker',
                                                })
                                            } else {
                                                return reply({
                                                    statusCode: 200,
                                                    msg: 'updata status success',
                                                })
                                            }
                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            } else return reply({
                statusCode: 400,
                msg: 'Bad Request',
                data: 'No file in payload'
            })
        }

    },
    { // Select all images
        method: 'GET',
        path: '/images',
        config: {
            tags: ['api'],
            description: 'Get all faceinfo Profile',
            notes: 'Get all faceinfo Profile'
        },
        handler: (request, reply) => {
            db.collection('faceInfo').find().make((builder: any) => {
                builder.callback((err: any, res: any) => {
                    if (err) {
                        return reply({
                            statusCode: 400,
                            message: "Bad Request",
                            data: "Error"
                        })
                    } else {
                        return reply({
                            statusCode: 200,
                            message: "OK",
                            data: res
                        })
                    }
                });
            });
        }
    },
    { // Get image file by id
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
            db.collection('images').find().make((builder: any) => {
                builder.where("_idImageRegister", request.params.id)
                builder.callback((err: any, res: any) => {
                    if (res.length == 0) {
                        return reply({
                            statusCode: 404,
                            message: "Bad Request",
                            data: "Data not found"
                        })
                    } else {
                        // if not image
                        res = res[0]
                        var contentType
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
                        let path: any = Util.uploadImagePath() + res.refInfo + pathSep.sep + res.storeName; // path + folder + \ + filename.png
                        console.log('Getting image . . . . . success')
                        return reply.file(path,
                            {
                                filename: res.name + '.' + res.fileType,
                                mode: 'inline',
                                confine: false
                            }).type(contentType)
                    }
                });
            });
        }
    },
    { // Delete image and folder
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
            db.collection('images').remove().make((builder: any) => {
                builder.where('refInfo', request.payload.refInfo)
                builder.callback((err: any, res: any) => {

                    if (err) {
                        return reply({
                            statusCode: 400,
                            message: "Bad Request",
                            data: "Error"
                        })
                    } else {
                        db.collection('faceInfo').remove().make((builder: any) => {
                            builder.where('refInfo', request.payload.refInfo)
                            builder.callback((err: any, res: any) => {
                                if (err) {
                                    return reply({
                                        statusCode: 400,
                                        message: "Bad Request",
                                        data: "Error"
                                    })
                                } else {
                                    const path = Util.uploadImagePath() + request.payload.refInfo;
                                    const cmd = 'echo eslab | sudo -S rm -rf ../..' + path;
                                    child_process.exec(cmd, function (error, stdout, stderr) {
                                        if (stdout) {
                                            console.log("Delete Image Folder Successful" + stdout)
                                            return reply({
                                                statusCode: 200,
                                                message: "Delete Image Folder Successful",
                                                data: stdout
                                            })
                                        } else if (stderr) {
                                            console.log("stderr" + stderr)
                                            return reply({
                                                statusCode: 400,
                                                message: "Std Error Can't Delete Image Folder",
                                                data: stderr
                                            })
                                        } else {
                                            console.log("Error "+error)
                                            return reply({
                                                statusCode: 400,
                                                message: "Error Can't Delete Image Folder",
                                                data: error
                                            })
                                        }
                                    })

                                    // del([path]).then(paths => {

                                    //     if (paths != "") {

                                    //         return reply({
                                    //             statusCode: 200,
                                    //             message: 'Deleted files and folders:\n' + paths.join('\n')
                                    //         })
                                    //     } else {
                                    //         return reply({
                                    //             statusCode: 200,
                                    //             message: "Can\'t delete this folder or Have no folder",
                                    //         })
                                    //     }

                                    // });

                                }

                            })
                        })

                    }
                });
            });
        }
    },
    // {  //test
    //     method: 'GET',
    //     path: '/test/',
    //     config: {
    //         tags: ['api'],
    //         description: 'Get all faceinfo Profile',
    //         notes: 'Get all faceinfo Profile'
    //     },
    //     handler: (request, reply) => {
    //         const path = Util.uploadImagePath() ;
    //         const cmd = 'echo eslab | sudo -S rm -rf ../..' + path + 'a';

    //         child_process.exec(cmd, function (error, stdout, stderr) {
    //             if (stdout) {
    //                 console.log("Delete Image Folder Successful" + stdout)
    //                 return reply({
    //                     statusCode: 200,
    //                     message: "Delete Image Folder Successful",
    //                     data: stdout
    //                 })
    //             } else if (stderr) {
    //                 console.log("stderr" + stderr)
    //                 return reply({
    //                     statusCode: 400,
    //                     message: "Std Error Can't Delete Image Folder",
    //                     data: stderr
    //                 })
    //             } else {
    //                 console.log("Error "+error)
    //                 return reply({
    //                     statusCode: 400,
    //                     message: "Error Can't Delete Image Folder",
    //                     data: error
    //                 })
    //             }
    //         })


    //     }
    // }
    // { // Get image profile from refInfo
    //     method: 'GET',
    //     path: '/images/{refInfo}',
    //     config: {
    //         tags: ['api'],
    //         description: 'Get image Profile by refInfo',
    //         notes: 'Get image Profile by refInfo',
    //         validate: {
    //             params: {
    //                 refInfo: Joi.string().required()
    //             }
    //         }
    //     },
    //     handler: (request, reply) => {
    //         db.collection('images').find().make((builder: any) => {
    //             builder.where('refInfo', request.params.refInfo)
    //             builder.callback((err: any, res: any) => {
    //                 if (err) {
    //                     return reply({
    //                         statusCode: 400,
    //                         message: "Bad Request",
    //                         data: "Error"
    //                     })
    //                 } else {
    //                     return reply({
    //                         statusCode: 200,
    //                         message: "OK",
    //                         data: res
    //                     })
    //                 }
    //             });
    //         });
    //     }
    // },
]