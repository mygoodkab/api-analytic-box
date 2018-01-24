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
const { exec } = require('child_process');
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
            db.collectionServer('analytics').find().make((builder: any) => {
                builder.callback((err: any, res: any) => {
                     reply({
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
            db.collectionServer('analytics').find().make((builder: any) => {
                builder.where("id", request.params._id)
                builder.callback((err: any, res: any) => {
                    reply({
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
                db.collectionServer('analytics').modify(request.payload).make((builder) => {
                    builder.where("id", request.payload.id);
                    builder.callback(function (err, res) {
                        db.collectionServer('analytics').find().make((builder) => {
                            builder.where("id", request.payload.id);
                            builder.first()
                            builder.callback(function (err, res) {
                                console.log("update analytics : ")
                                console.log(res)
                                db.collection('assignAnalytics').modify({ analyticsInfo: res }).make(function (builder) {
                                    builder.where("_refAnalyticsId", request.payload.id);
                                    builder.callback(function (err, res) {
                                         reply({
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
                reply({
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
            let payload = request.payload;
            // check ก่อนว่าข้อมูลนี้ถูก  assignAnalytics ใช้อยู่หรือไม่ 
            db.collectionServer('analytics').find().make((builder) => {
                builder.where('id', payload._id)
                builder.first()
                builder.callback((err, res) => {
                    if (err) {
                        badRequest("Error can't data in analytics")
                    } else {
                        let analyticsFileInfo = res.analyticsFileInfo
                        db.collection("assignAnalytics").find().make((builder) => {
                            builder.where('_refAnalyticsId', payload._id)
                            builder.first()
                            builder.callback((err, res) => {
                                // if res is true ,can't delete file
                                if (res) {
                                    badRequest("Can't delete because data is used")
                                } else {
                                    // update assignAnalytics status to stop before delete container
                                    db.collection('assignAnalytics').modify({ status: 'stop' }).make((builder: any) => {
                                        builder.where('_id', payload._assignAnayticsId)
                                        builder.callback((err: any, res: any) => {
                                            if (err) {
                                                badRequest("Can't up status")
                                            } else {
                                                const cmd = "cd ../.." + Util.analyticsPath() + " &&  rm -rf " + analyticsFileInfo.name + " && echo eslab";
                                                //const test = "cd ../.." + Util.analyticsPath() + " && ls"
                                                exec(cmd, (error, stdout, stderr) => {
                                                    if (error) {
                                                        console.log("Error " + error)
                                                        badRequest("Error " + error)
                                                    } else if (stdout) {
                                                        db.collectionServer('analytics').remove().make((builder: any) => {
                                                            builder.where("id", request.payload._id)
                                                            builder.callback((err: any, res: any) => {
                                                                if (err) {
                                                                    badRequest("Can't Delete data")
                                                                } else {
                                                                     reply({
                                                                        statusCode: 200,
                                                                        message: "OK",
                                                                    })
                                                                }
                                                            });
                                                        });
                                                    } else {
                                                        console.log("Stderr " + stderr)
                                                        badRequest("Stderr" + stderr)
                                                    }
                                                });
                                            }
                                        });
                                    });

                                }
                            })
                        })

                    }
                })
            })

            // db.collection('assignAnalytics').find().make((builder: any) => {
            //     builder.where("_refAnalyticsId", request.payload._id)
            //     builder.first()
            //     builder.callback((err: any, res: any) => {
            //         if (typeof res == 'undefined') {
            //             db.collectionServer('analytics').remove().make((builder: any) => {
            //                 builder.where("id", request.payload._id)
            //                 builder.callback((err: any, res: any) => {
            //                     if (err) {
            //                         badRequest("Can't get data")
            //                     } else {
            //                         reply({
            //                             statusCode: 200,
            //                             message: "OK",
            //                         })
            //                     }
            //                 });
            //             });
            //         } else {
            //             reply({
            //                 statusCode: 500,
            //                 message: "Some data's used in assignAnalytics",
            //             })
            //         }
            //     })
            // })
            function badRequest(msg) {
                reply({
                    statusCode: 400,
                    message: "Bad Request",
                    data: msg
                })
            }
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
                let pathAnalytics = Util.analyticsPath();
                // check path file doesn't exist or something.
                fs.stat(pathAnalytics, function (err, stats) {
                    if (err) { // if file analytics not exist
                        fs.mkdir(Util.uploadRootPath() + "analytics", (err) => {
                            if (err) {
                                serverError("can't create folder")
                            }
                            existFile()
                        })

                    } else { // if file cctv exist
                        existFile()
                    }
                    function existFile() {
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
                        console.log("Upload Analytics Profile ... path /analytics/upload-profile : " + path)
                        // check exist file name
                        if (fs.existsSync(Util.analyticsPath() + filename)) {
                            badRequest("file name's exist ")
                        } else {
                            mkdirp(path, function (err) {
                                if (err) {
                                    console.log("can't crate folder : " + err)
                                     reply({
                                        statusCode: 500,
                                        msg: 'Server error',
                                        data: 'can\'t crate folder'
                                    })
                                }
                                else {
                                    // create file Stream
                                    let fileUploadName = path + analyticsFileInfo.name + "." + fileType;
                                    let file = fs.createWriteStream(fileUploadName);

                                    file.on('error', (err: any) => {
                                        console.log("can't upload analytics profile : " + err)
                                         reply({
                                            statusCode: 500,
                                            msg: 'Server error',
                                            data: 'can\'t upload profile'
                                        })
                                    })
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
                                                removeFile(filename)
                                                badRequest("Can't extract file")
                                            } else {
                                                console.log("extract success  path : " + path)
                                                //read profile.json
                                                try {
                                                    // check YAML file
                                                    YAML.load(path + 'docker-compose.yaml', (result) => {
                                                        if (!result) {
                                                            console.log("can't find 'docker-compose.yaml'")
                                                            removeFile(filename)
                                                            badRequest("can't find 'docker-compose.yaml'")
                                                        } else {
                                                            jsonfile.readFile(path + '/profile.json', function (err, result) {
                                                                var analyticsProfile = result.analytics;
                                                                if (err || !result) {//  can't read or find JSON file 
                                                                    removeFile(filename)
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
                                                                        removeFile(filename)
                                                                        badRequest("Invaild data please check your file JSON")
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
                                                                                removeFile(filename)
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
                                                                            db.collectionServer('analytics').insert(analytics).callback(function (err) {
                                                                                if (err) {
                                                                                    removeFile(filename)
                                                                                     reply({ // can't insert data
                                                                                        statusCode: 500,
                                                                                        message: "Can't insert analytics profile ",
                                                                                    })
                                                                                } else {
                                                                                     reply({
                                                                                        statusCode: 200,
                                                                                        message: "OK",
                                                                                        data: "Upload Analytics Successful"
                                                                                    })
                                                                                }
                                                                            });
                                                                        } else {
                                                                            removeFile(filename)
                                                                            badRequest("Please check your screenshot/logo images")
                                                                        }
                                                                    }
                                                                }
                                                            });
                                                        }
                                                    })

                                                } catch (err) { // try catch error 
                                                    console.log(err)
                                                    removeFile(filename)
                                                    badRequest("Can't read or find JSON file")
                                                }
                                            }
                                        })
                                    })
                                }
                            });
                        }
                    }
                })
            } else {
                badRequest("No file in payload")
            }

            function serverError(msg) {
                reply({
                    statusCode: 500,
                    msg: 'Server error',
                    data: msg
                })
            }

            function badRequest(msg) {
                reply({
                    statusCode: 400,
                    msg: 'Bad Request',
                    data: msg
                })
            }

            function removeFile(analytics) {
                let cmd = "cd ../.." + Util.analyticsPath() + " &&  rm -rf " + analytics + " && echo eslab";
                exec(cmd, (error, stdout, stderr) => {
                    if (stdout) {
                        console.log("Remove file success Analytics : " + analytics)
                    } else {
                        console.log("Can't  Remove")
                    }
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
            db.collectionServer('analytics').find().make((builder: any) => {
                builder.where("id", request.params.id)
                builder.callback((err: any, res: any) => {
                    if (res.length == 0) {
                         reply({
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
                        //console.log("Path analytics logo : " + path)
                        reply.file(path,
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
            db.collectionServer('analytics').find().make((builder: any) => {
                builder.where("id", request.params.id)
                builder.callback((err: any, res: any) => {
                    if (res.length == 0) {
                         reply({
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
                        reply.file(path,
                            {
                                filename: res.name + '.' + res.fileType,
                                mode: 'inline'
                            }).type(contentType)
                    }
                });
            });
        }
    },
    {  // Read yaml file convert to json
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
            db.collectionServer('analytics').find().make((builder: any) => {
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
                                        reply({
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
                reply({
                    statusCode: 400,
                    message: "Bad request",
                    data: msg
                })
            }
        }
    }

];