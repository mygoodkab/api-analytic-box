import * as db from '../nosql-util';
import { Util } from '../util';
const objectid = require('objectid');
const Joi = require('joi')
const fs = require('fs');
const pathSep = require('path');
const del = require('del');
const mkdirp = require('mkdirp');
var extract = require('extract-zip')
var YAML = require('yamljs');
var jsonfile = require('jsonfile')
//import { sqliteUtil } from '../sqlite-util';
//import { dbpath } from '../server';

module.exports = [
    {  // Get all analytics profile
        method: 'GET',
        path: '/analytics',
        config: {
            tags: ['api'],
            description: 'Get All analytics data',
            notes: 'Get All analytics data'
        },
        handler: (request, reply) => {
            db.collection('analytics').find().make((builder: any) => {
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
    {  // Get id analytics profile
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
            db.collection('analytics').find().make((builder: any) => {
                builder.where("id", request.params._id)
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
    {  // Update analytics and analyticsInfo in assignAnalytics
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
                            builder.first()
                            builder.callback(function (err, res) {
                                console.log("update analytics : ")
                                console.log(res)
                                db.collection('assignAnalytics').modify({ analyticsInfo: res }).make(function (builder) {
                                    builder.where("_refAnalyticsId", request.payload.id);
                                    builder.callback(function (err, res) {
                                        return reply({
                                            statusCode: 200,
                                            message: "OK",
                                            data: "Update Succeed"
                                        })
                                    })
                                })
                            })
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
    {  // Delete analytics
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
            // check ก่อนว่าข้อมูลนี้ถูก  assignAnalytics ใช้อยู่หรือไม่
            db.collection('assignAnalytics').find().make((builder: any) => {
                builder.where("_refAnalyticsId", request.payload._id)
                builder.first()
                builder.callback((err: any, res: any) => {
                    if (typeof res == 'undefined') {
                        db.collection('analytics').remove().make((builder: any) => {
                            builder.where("id", request.payload._id)
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
                    } else {
                        return reply({
                            statusCode: 500,
                            message: "Some data's used in assignAnalytics",
                        })
                    }
                })
            })
        }
    },
    {  // Upload Analytics Profile 
        //=========================================================================================================
        //                                                   STEP
        //=========================================================================================================
        // 1. Create folder to recive zip file 
        // 2. Upload zip file to folder
        // 3. Extract zip file 
        // 4. Read json file 
        // 5. Validate profile data 
        // 6. Check logo image
        // 7. Chcek screenshot images
        //=========================================================================================================
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
            let req: any = request;
            let payload = req.payload;

            if (payload.file) {
                // separate filename, fileType from fullname
                let filename = payload.file.hapi.filename.split('.');
                let fileType = filename.splice(filename.length - 1, 1)[0];
                filename = filename.join('.')
                let storeName = Util.uniqid() + "." + fileType.toLowerCase()
                // create imageInfo for insert info db
                let id = objectid()
                let analyticsFileInfo: any = {
                    name: filename,
                    storeName: storeName,
                    fileType: fileType,
                    ts: new Date(),
                    refInfo: payload.refInfo
                }
                let path = Util.analyticsPath() + filename + pathSep.sep;
                // create folder 
                mkdirp(path, function (err) {
                    if (err) {
                        console.log("can't crate folder : " + err)
                        return reply({
                            statusCode: 500,
                            msg: 'Server error',
                            data: 'can\'t crate folder'
                        })
                    }
                    else {
                        // create file Stream
                        let fileUploadName = path + analyticsFileInfo.name + "." + fileType;
                        let file = fs.createWriteStream(fileUploadName);
                        console.log("Upload Analytics Profile ... path /analytics/upload-profile : " + path)
                        file.on('error', (err: any) => {
                            console.log("can't upload analytics profile : " + err)
                            return reply({
                                statusCode: 500,
                                msg: 'Server error',
                                data: 'can\'t upload profile'
                            })
                        })
                        // pass payload file to file stream for write info directory
                        payload.file.pipe(file);
                        payload.file.on('end', (err: any) => {
                            var filestat = fs.statSync(fileUploadName);
                            var analytics: any;
                            analyticsFileInfo.fileSize = filestat.size;
                            analyticsFileInfo.createdata = new Date();
                            console.log("upload profile successful")
                            // extract file zip to folder
                            extract(fileUploadName, { dir: path }, function (err) {
                                if (err) {
                                    console.log(err)
                                } else {
                                    console.log("extract success  path : " + path)
                                    //read profile.json
                                    try {
                                        jsonfile.readFile(path + '/profile.json', function (err, result) {
                                            var analyticsProfile = result.analytics;
                                            if (err || !result) {//  can't read or find JSON file 
                                                 badRequest("Can't read or find JSON file")
                                            } else {
                                                // check ข้อมูลภายในไฟล์ JSON ว่าครบไหม
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
                                                    badRequest("Invaild data please check your file JOSN")
                                                } else {
                                                    // check ข้อมูลรูปว่าตรงกับใน folder ไหม
                                                    var fileimages = true;
                                                    if (!fs.existsSync(path + analyticsProfile.logo)) { // check logo ถ้าไม่มีไฟล์
                                                        fileimages = false;
                                                        //badRequest("JSON analytics.logo not match folder")
                                                    } else {
                                                        if (analyticsProfile.screenshot) {
                                                            for (var screenchot of analyticsProfile.screenshot) { // check screenshot
                                                                if (!fs.existsSync(path + screenchot)) {
                                                                    fileimages = false;
                                                                    console.log("JSON analytics.screenchot not match folder")
                                                                    //badRequest("JSON analytics.screenchot not match folder")
                                                                }
                                                            }
                                                        } else {
                                                            badRequest("JSON analytics.screenchot not match folder")
                                                        }
                                                    }
                                                    if (fileimages) {
                                                        analytics = {
                                                            id: id,
                                                            refInfo: payload.refInfo,
                                                            analyticsProfile: result.analytics,
                                                            analyticsFileInfo: analyticsFileInfo,
                                                        };
                                                        // insert  analytics profile to db
                                                        db.collection('analytics').insert(analytics).callback(function (err) {
                                                            if (err) {
                                                                return reply({ // can't insert data
                                                                    statusCode: 500,
                                                                    message: "Can't insert analytics profile ",
                                                                })
                                                            } else {
                                                                return reply({
                                                                    statusCode: 200,
                                                                    message: "OK",
                                                                    data: "Upload Analytics Successful"
                                                                })
                                                            }
                                                        });
                                                    } else {
                                                        badRequest("Please check your screenshot/logo images")
                                                    }
                                                }
                                            }
                                        });
                                     } catch (err) { // try catch error 
                                        console.log(err)
                                        badRequest("Can't read or find JSON file")
                                    }
                                }
                            })
                        })
                    }
                });
            } else {
                badRequest("No file in payload")
            }
            function badRequest(msg) {
                return reply({
                    statusCode: 400,
                    msg: 'Bad Request',
                    data: msg
                })
            }
        }

    },
    {  // Get image-logo  from Analytics Profile 
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
            db.collection('analytics').find().make((builder: any) => {
                builder.where("id", request.params.id)
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
                        let analyticsFileInfo = res.analyticsFileInfo
                        let analyticsProfile = res.analyticsProfile
                        let path: any = Util.analyticsPath() + analyticsFileInfo.name + pathSep.sep + analyticsProfile.logo // path + folder + \ + filename.png
                        console.log("Path analytics logo : " + path)
                        return reply.file(path,
                            {
                                filename: res.name + '.' + res.fileType,
                                mode: 'inline'
                            }).type(contentType)
                    }
                });
            });
        }
    },
    {  // Get iamge-screenshot from Analytics Profile
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
            db.collection('analytics').find().make((builder: any) => {
                builder.where("id", request.params.id)
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
                        let analyticsFileInfo = res.analyticsFileInfo
                        let analyticsProfile = res.analyticsProfile
                        let path: any = Util.analyticsPath() + analyticsFileInfo.name + pathSep.sep + request.params.image// path + folder + \ + filename.png
                        console.log("Path analytics logo : " + path)
                        return reply.file(path,
                            {
                                filename: res.name + '.' + res.fileType,
                                mode: 'inline'
                            }).type(contentType)
                    }
                });
            });
        }
    },
    { // Read yaml file convert to json
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
            const payload = request.payload
            db.collection('analytics').find().make((builder: any) => {
                builder.where('id', payload._analyticsId)
                builder.first()
                builder.callback((err: any, res: any) => {
                    const folderName = res.analyticsFileInfo.name
                    const path = Util.analyticsPath() + folderName + pathSep.sep
                    try {
                        YAML.load(path + 'docker-compose.yaml', (result) => {
                            // result.services[a[0]].environment
                            if (result != null) {
                                // console.log("docker-compose.yaml: ", result.services)
                                if (typeof result.services != 'undefined') {
                                    let key = Object.keys(result.services) // json docker-compose  result.services
                                    let environment = result.services[key[0]].environment;

                                    if (typeof environment != 'undefined') { // json docker-compose  result.services.*.environment
                                        let inputSchema: any = { properties: {} };

                                        for (let data of environment) {
                                            let isTrue = true;
                                            //let properties: any = {}
                                            let str = data.split("=")
                                            // change to be inputSchema 
                                            if (str[1].toLowerCase() == 'true' || str[1].toLowerCase() == 'false') { //ถ้าเป็นประเภทของ boolean ต้อง check แบบนี้เพราะ เราจะได้แค่ string อย่างเดียว
                                                if (str[1].toLowerCase() == 'false') {
                                                    isTrue = false
                                                }
                                                inputSchema.properties[str[0]] = JSON.parse('{"type":"' + typeof isTrue + '","default":"' + isTrue + '","description":"' + str[0] + '"}')
                                            } else {
                                                inputSchema.properties[str[0]] = JSON.parse('{"type":"' + typeof str[1] + '","default":"' + str[1] + '","description":"' + str[0] + '"}')
                                            }
                                            // console.log("convert to inputSchema : ",JSON.parse(properties))
                                            //inputSchema.properties.push(JSON.parse(properties))
                                            //inputSchema = Object.assign(JSON.parse(properties), inputSchema.properties)
                                        }
                                        return reply({
                                            statusCode: 200,
                                            message: "Read Yaml convent to Json success",
                                            data: inputSchema
                                        })
                                    } else {
                                        badRequest("Can't find  result.services.*.environment in docker-compose.yaml")
                                    }

                                } else {
                                    badRequest("Can't find result.services in docker-compose.yaml")
                                }

                            } else {
                                badRequest("Can't find folder " + folderName)
                            }
                        });
                    } catch (e) {
                        console.log("ERROR docker compose : " + e)
                        badRequest(e)
                    }
                })
            })
            function badRequest(msg) {
                return reply({
                    statusCode: 400,
                    message: "Bad request",
                    data: msg
                })
            }
        }
    }
    // {  // Insert analytics  
    //         method: 'POST',
    //         path: '/analytics/insert',
    //         config: {
    //             tags: ['api'],
    //             description: 'Insert analytics data',
    //             notes: 'Insert analytics data <br><b> example command </b> <br> nvidia-docker exec --env=\"DISPLAY\" darknet /bin/sh -c \"cd /home/dev/host/darknet && ./darknet detector demo cfg/coco.data cfg/yolo.cfg weights/yolo.weights <br><b> PS. last don\'t close \" </b>',
    //             validate: {
    //                 payload: {
    //                     name: Joi.string().required(),
    //                     parameter: Joi.array(),
    //                     cmd: Joi.string(), //ตอนบันทึก command ไม่ต้องพิมพ์ปิด " เพราะว่าจะต้องดึงไปต่อ string กับ rtsp ก่อน 
    //                     price: Joi.string(),
    //                     shortDetail: Joi.string(),
    //                     fullDetail: Joi.string(),
    //                     level: Joi.string(),
    //                     architecture: Joi.string(),
    //                     proccessingUnit: Joi.string(),
    //                     language: Joi.string(),
    //                     refInfo: Joi.string(),
    //                 }
    //             }
    //         },
    //         handler: (request, reply) => {
    //             if (request.payload) {
    //                 request.payload.updateDate = new Date();
    //                 request.payload._id = objectid();
    //                 request.payload.idImages = "";
    //                 request.payload.idImagesScreenShot = [];
    //                 let path = Util.rootlogoImagePath() + request.payload.refInfo;
    //                 mkdirp(path, function (err) {
    //                     if (err) {
    //                         return reply({
    //                             statusCode: 500,
    //                             msg: 'Server error',
    //                             data: 'can\'t crate folder'
    //                         })
    //                     }
    //                     else console.log('create folder!' + path)
    //                 });
    //                 db.collection('analytics').insert(request.payload)
    //                 return reply({
    //                     statusCode: 200,
    //                     message: "OK",
    //                     data: "analytics Successd"
    //                 })
    //             } else return reply({
    //                 statusCode: 400,
    //                 message: "Bad Request",
    //                 data: "No payload"
    //             })
    //         }
    //     },
    //  {  // Upload logo file
    //         method: 'POST',
    //         path: '/analytics/upload-images',
    //         config: {
    //             tags: ['api'],
    //             description: 'Upload images',
    //             notes: 'Upload images',
    //             validate: {
    //                 payload: {
    //                     file: Joi.any().meta({ swaggerType: 'file' }).description('file upload'),
    //                     refInfo: Joi.string().required()
    //                 }
    //             },
    //             payload: {
    //                 maxBytes: 5000000,
    //                 parse: true,
    //                 output: 'stream'
    //             },
    //         },
    //         handler: (request, reply) => {
    //             let req: any = request;
    //             let payload = req.payload;

    //             if (payload.file) {
    //                 //  console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
    //                 // separate filename, fileType from fullname
    //                 let path = Util.logoImagePath() + payload.refInfo + pathSep.sep
    //                 let filename = payload.file.hapi.filename.split('.');
    //                 let fileType = filename.splice(filename.length - 1, 1)[0];
    //                 filename = filename.join('.')
    //                 let storeName = Util.uniqid() + "." + fileType.toLowerCase()
    //                 // create imageInfo for insert info db
    //                 let id = objectid()
    //                 let imageInfo: any = {
    //                     _id: id,
    //                     name: filename,
    //                     storeName: storeName,
    //                     fileType: fileType,
    //                     ts: new Date(),
    //                     refInfo: payload.refInfo
    //                 }
    //                 // create file Stream
    //                 let file = fs.createWriteStream(path + imageInfo.storeName);
    //                 console.log("Upload logo image ... path /analytics/upload-images : " + path)
    //                 file.on('error', (err: any) => {
    //                     return reply({
    //                         statusCode: 500,
    //                         msg: 'Server error',
    //                         data: 'can\'t upload image'
    //                     })
    //                 })
    //                 // pass payload file to file stream for write info directory
    //                 payload.file.pipe(file);
    //                 payload.file.on('end', (err: any) => {
    //                     var filestat = fs.statSync(path + imageInfo.storeName);
    //                     imageInfo.fileSize = filestat.size;
    //                     imageInfo.createdata = new Date();
    //                     // update image id to analytics 
    //                     db.collection('analytics').modify({ idImages: id }).make((builder: any) => {
    //                         builder.where('refInfo', payload.refInfo)
    //                         builder.callback((err: any, res: any) => {
    //                             // insert image Info to db
    //                             db.collection('analytics-images').insert(imageInfo);
    //                             return reply({
    //                                 statusCode: 200,
    //                                 msg: 'updata status success',
    //                             })
    //                         })
    //                     })
    //                 })
    //             } else return reply({
    //                 statusCode: 400,
    //                 msg: 'Bad Request',
    //                 data: 'No file in payload'
    //             })
    //         }
    //     },
    // {  // Upload image ScreenShot   
    //     method: 'POST',
    //     path: '/analytics/upload-images-screenshot',
    //     config: {
    //         tags: ['api'],
    //         description: 'Upload images',
    //         notes: 'Upload images',
    //         validate: {
    //             payload: {
    //                 file: Joi.any().meta({ swaggerType: 'file' }).description('file upload'),
    //                 refInfo: Joi.string().required()
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
    //             let path = Util.logoImagePath() + payload.refInfo + pathSep.sep
    //             let filename = payload.file.hapi.filename.split('.');
    //             let fileType = filename.splice(filename.length - 1, 1)[0];
    //             filename = filename.join('.')
    //             let storeName = Util.uniqid() + "." + fileType.toLowerCase()
    //             // create imageInfo for insert info db
    //             let id = objectid()
    //             let imageInfo: any = {
    //                 _id: id,
    //                 name: filename,
    //                 storeName: storeName,
    //                 fileType: fileType,
    //                 ts: new Date(),
    //                 refInfo: payload.refInfo
    //             }
    //             // create file Stream
    //             let file = fs.createWriteStream(path + imageInfo.storeName);
    //             console.log("Upload Screenshot path '/analytics/upload-images-screenshot'" + path)
    //             file.on('error', (err: any) => {
    //                 return reply({
    //                     statusCode: 500,
    //                     msg: 'Server error',
    //                     data: 'can\'t upload image'
    //                 })
    //             })
    //             // pass payload file to file stream for write info directory
    //             payload.file.pipe(file);
    //             payload.file.on('end', (err: any) => {
    //                 var filestat = fs.statSync(path + imageInfo.storeName);
    //                 imageInfo.fileSize = filestat.size;
    //                 imageInfo.createdata = new Date();
    //                 db.collection('analytics').find().make((builder: any) => {
    //                     builder.where('refInfo', payload.refInfo)
    //                     builder.first()
    //                     builder.callback((err: any, res: any) => {
    //                         let arr;
    //                         if (typeof res.idImagesScreenShot == 'undefined') {
    //                             res.idImagesScreenShot = []
    //                             console.log('undified')
    //                         } else {
    //                             arr = res.idImagesScreenShot
    //                             arr.push(id);
    //                         }

    //                         // update image id to analytics 
    //                         db.collection('analytics').modify({ idImagesScreenShot: arr }).make((builder: any) => {
    //                             builder.where('refInfo', payload.refInfo)
    //                             builder.callback((err: any, res: any) => {
    //                                 // insert image Info to db
    //                                 db.collection('analytics-images').insert(imageInfo);
    //                                 return reply({
    //                                     statusCode: 200,
    //                                     msg: 'updata status success',
    //                                 })
    //                             })
    //                         })
    //                     })
    //                 })
    //             })
    //         } else return reply({
    //             statusCode: 400,
    //             msg: 'Bad Request',
    //             data: 'No file in payload'
    //         })
    //     }
    // },
    // {  // GET image file 
    //     method: 'GET',
    //     path: '/analytics/get-images/{id}',
    //     config: {
    //         tags: ['api'],
    //         description: 'Get image for UI',
    //         notes: 'Get image ',
    //         validate: {
    //             params: {
    //                 id: Joi.string().required()
    //             }
    //         }
    //     },
    //     handler: (request, reply) => {
    //         db.collection('analytics-images').find().make((builder: any) => {
    //             builder.where("_id", request.params.id)
    //             builder.callback((err: any, res: any) => {
    //                 if (res.length == 0) {
    //                     return reply({
    //                         statusCode: 404,
    //                         message: "Bad Request",
    //                         data: "Data not found"
    //                     })
    //                 } else {
    //                     // if not image
    //                     res = res[0]
    //                     var contentType
    //                     switch (res.fileType) {
    //                         case "pdf":
    //                             contentType = 'application/pdf';
    //                             break;
    //                         case "ppt":
    //                             contentType = 'application/vnd.ms-powerpoint';
    //                             break;
    //                         case "pptx":
    //                             contentType = 'application/vnd.openxmlformats-officedocument.preplyentationml.preplyentation';
    //                             break;
    //                         case "xls":
    //                             contentType = 'application/vnd.ms-excel';
    //                             break;
    //                         case "xlsx":
    //                             contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    //                             break;
    //                         case "doc":
    //                             contentType = 'application/msword';
    //                             break;
    //                         case "docx":
    //                             contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    //                             break;
    //                         case "csv":
    //                             contentType = 'application/octet-stream';
    //                             break;
    //                     }
    //                     let path: any = Util.rootlogoImagePath() + res.refInfo + pathSep.sep + res.storeName; // path + folder + \ + filename.png
    //                     return reply.file(path,
    //                         {
    //                             filename: res.name + '.' + res.fileType,
    //                             mode: 'inline'
    //                         }).type(contentType)
    //                 }
    //             });
    //         });
    //     }
    // },
];