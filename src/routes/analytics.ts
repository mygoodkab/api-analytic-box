import * as db from '../nosql-util';
import { Util } from '../util';
import { collection } from '../nosql-util';
var ObjectIdMongo = require('mongodb').ObjectId;
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
import * as  Boom from 'boom'
import { ObjectID } from 'bson';
//import { sqliteUtil } from '../sqlite-util';
//import { dbpath } from '../server';


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

    // //================================================================================== versino 2 ==============================================================================================================
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
        handler: async (request, reply) => {
            const mongo = Util.getDb(request)
            let payload = request.payload;

            if (payload.file) {
                // separate filename, fileType from fullname
                let pathAnalytics = Util.analyticsPath();
                // check path file doesn't exist or something.
                fs.stat(pathAnalytics, async (err, stats) => {
                    if (err) { // if file analytics not exist
                        fs.mkdir(Util.uploadRootPath() + "analytics", (err) => {
                            existFile()
                        })
                    } else { // if file cctv exist
                        existFile()
                    }
                    async function existFile() {
                        // separate filename, fileType from fullname
                        let filename = payload.file.hapi.filename.split('.');
                        let fileType = filename.splice(filename.length - 1, 1)[0];
                        filename = filename.join('.')
                        let storeName = Util.uniqid() + "." + fileType.toLowerCase()
                        // create imageInfo for insert info db
                        //let id = objectid()
                        let analyticsFileInfo: any = {
                            name: filename,
                            storeName: storeName,
                            fileType: fileType,
                            ts: new Date(),
                            refInfo: payload.refInfo
                        }
                        // check exist file name
                        if (fs.existsSync(Util.analyticsPath() + filename)) {
                            console.log("file name's exist")
                            filename = filename + objectid.toString().substring(0, 5);
                        }

                        let path = Util.analyticsPath() + filename + pathSep.sep;
                        console.log("Upload Analytics Profile ... path /analytics/upload-profile : " + path)
                        // create folder
                        mkdirp(path, function (err) {
                            // create file Stream
                            let fileUploadName = path + analyticsFileInfo.name + "." + fileType;
                            let file = fs.createWriteStream(fileUploadName);
                            payload.file.pipe(file);
                            payload.file.on('end', (err: any) => {
                                var filestat = fs.statSync(fileUploadName);
                                var analytics: any;
                                analyticsFileInfo.fileSize = filestat.size;
                                analyticsFileInfo.createdata = new Date();
                                console.log("upload profile successful")
                                // extract file zip to folder
                                extract(fileUploadName, { dir: path }, async (err) => {
                                    if (err) {
                                        console.log(err)
                                        removeFile(path)
                                        // badRequest("Can't extract file")
                                    } else {
                                        console.log("extract success  path : " + path)
                                        //read profile.json
                                        try {
                                            // check YAML file
                                            YAML.load(path + 'docker-compose.yaml', (result) => {
                                                if (!result) {
                                                    console.log("can't find 'docker-compose.yaml'")
                                                    removeFile(path)
                                                    //badRequest("can't find 'docker-compose.yaml'")
                                                } else {
                                                    jsonfile.readFile(path + '/profile.json', async (err, result) => {
                                                        var analyticsProfile = result.analytics;
                                                        if (!result) {//  can't read or find JSON file 
                                                            removeFile(path)
                                                            badRequest("Can't read or find JSON file")
                                                        } else {
                                                            // check ข้อมูลภายในไฟล์ JSON ว่าครบไหม
                                                            let isMissingField = false;
                                                            for (let field in analyticProfileModel) {
                                                                if (typeof analyticsProfile[field] == 'undefined') {
                                                                    isMissingField = true;
                                                                    break;
                                                                }
                                                            }
                                                            if (isMissingField) {
                                                                removeFile(path)
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
                                                                        removeFile(path)
                                                                        badRequest("JSON analytics.screenchot not match folder")
                                                                    }
                                                                }
                                                                if (fileimages) {
                                                                    analytics = {
                                                                        //id: id,
                                                                        refInfo: payload.refInfo,
                                                                        analyticsProfile: result.analytics,
                                                                        analyticsFileInfo: analyticsFileInfo,
                                                                    };
                                                                    // insert  analytics profile to db
                                                                    const insertAnalytics: any = await mongo.collection('analytics').insertOne(analytics)

                                                                    // if (insertAnalytics.acknowledged) {
                                                                    reply({
                                                                        statusCode: 200,
                                                                        message: "OK",
                                                                        data: "Upload Analytics Successful"
                                                                    })
                                                                    //  }

                                                                } else {
                                                                    removeFile(path)
                                                                    badRequest("Please check your screenshot/logo images")
                                                                }
                                                            }
                                                        }
                                                    });
                                                }
                                            })

                                        } catch (err) { // try catch error 
                                            console.log(err)
                                            removeFile(path)
                                            reply(Boom.badGateway(err))
                                        }
                                    }
                                })
                            })

                        });

                    }
                })
            } else {
                badRequest("No file in payload")
            }

            function badRequest(msg) {
                reply(Boom.badRequest(msg))
            }

            function removeFile(path) {
                if (Util.removeFolder(path)) {
                    console.log("Remove file success Analytics : " + path)
                } else {
                    console.log("Can't Remove no such file ot dir " + path)
                }
            }
        }

    },
    {  // Get all analytics profile
        method: 'GET',
        path: '/analytics',
        config: {
            tags: ['api'],
            description: 'Get All analytics data',
            notes: 'Get All analytics data'
        },
        handler: async (request, reply) => {
            const mongo = Util.getDb(request)
            try {
                const resAnalytics = await mongo.collection('analytics').find().toArray()
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: resAnalytics
                })
            } catch (error) {
                reply(Boom.badGateway(error))
            }
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
        handler: async (request, reply) => {

            const mongo = Util.getDb(request)
            try {
                const resAnalytics = await mongo.collection('analytics').findOne({ _id: ObjectIdMongo(request.params._id) })
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: resAnalytics
                })
            } catch (error) {
                reply(Boom.badGateway(error))
            }
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
                    _id: Joi.string().required(),
                    analyticsProfile: Joi.object(),
                }
            }
        },
        handler: async (request, reply) => {
            try {
                if (request.payload) {
                    const mongo = Util.getDb(request)
                    const payload = request.payload
                    payload.updateDate = new Date();
                    const updateAnalytics: any = await mongo.collection('analytics').updateOne({ _id: ObjectIdMongo(payload._id) }, { $set: { analyticsProfile: payload.analyticsProfile } })
                    const updateAssignAnalytics: any = await mongo.collection('assignAnalytics').updateMany({ _refAnalyticsId: payload._id }, { $set: { analyticsProfile: payload.analyticsProfile } })
                    reply({
                        statusCode: 200,
                        message: "OK",
                        data: "Update Succeed"
                    })
                } else {
                    reply(Boom.badRequest("No payload"))
                }
            } catch (error) {
                reply(Boom.badGateway(error))
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
        handler: async (request, reply) => {
            try {
                let payload = request.payload;
                const mongo = Util.getDb(request)
                const resAnalytics = await mongo.collection('analytics').findOne({ _id: ObjectIdMongo(payload._id) })
                console.log(resAnalytics.name)
                if (resAnalytics) {
                    const resAssignAnalytics = await mongo.collection('assignAnalytics').findOne({ _id: ObjectIdMongo(payload._id) })
                    if (!resAssignAnalytics) {
                        let path = Util.analyticsPath() + resAnalytics.analyticsFileInfo.name
                        if (Util.removeFolder(path)) {
                            const removeAnalytics: any = await mongo.collection('analytics').deleteOne({ _id: ObjectIdMongo(payload._id) })
                            reply({
                                statusCode: 200,
                                message: "OK",
                            })

                        } else {
                            badRequest("Can't remove no such file or dir " + path)
                        }

                    } else {
                        badRequest("Can't delete because data is used")
                    }
                } else {
                    badRequest("No data")
                }
            } catch (error) {
                reply(Boom.badGateway(error))
            }

            function badRequest(msg) {
                reply(Boom.badRequest(msg))
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
        handler: async (request, reply) => {
            const mongo = Util.getDb(request)
            try {
                const resAnalytics = await mongo.collection('analytics').findOne({ _id: ObjectIdMongo(request.params.id) })
                if (!resAnalytics) {
                    reply({
                        statusCode: 404,
                        message: "Bad Request",
                        data: "Data not found"
                    })
                } else {
                    // if not image
                    var contentType
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
                    let analyticsFileInfo = resAnalytics.analyticsFileInfo
                    let analyticsProfile = resAnalytics.analyticsProfile

                    let path: any = Util.analyticsPath() + analyticsFileInfo.name + pathSep.sep + analyticsProfile.logo // path + folder + \ + filename.png
                    reply.file(path,
                        {
                            filename: resAnalytics.name + '.' + resAnalytics.fileType,
                            mode: 'inline'
                        }).type(contentType)

                }
            } catch (error) {
                reply(Boom.badGateway(error))
            }
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
        handler: async (request, reply) => {

            const mongo = Util.getDb(request)
            try {
                const resAnalytics = await mongo.collection('analytics').findOne({ _id: ObjectIdMongo(request.params.id) })
                if (resAnalytics) {
                    // if not image
                    var contentType
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
                    let analyticsFileInfo = resAnalytics.analyticsFileInfo
                    let analyticsProfile = resAnalytics.analyticsProfile
                    let path: any = Util.analyticsPath() + analyticsFileInfo.name + pathSep.sep + request.params.image // path + folder + \ + filename.png
                    //console.log("Path analytics logo : " + path)
                    reply.file(path,
                        {
                            filename: resAnalytics.name + '.' + resAnalytics.fileType,
                            mode: 'inline'
                        }).type(contentType)
                } else {
                    reply({
                        statusCode: 404,
                        message: "Bad Request",
                        data: "Data not found"
                    })
                }
            } catch (error) {
                reply(Boom.badGateway(error))
            }
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
        handler: async (request, reply) => {
            const payload = request.payload
            const mongo = Util.getDb(request)
            try {
                const res = await mongo.collection('analytics').findOne({ _id: ObjectIdMongo(payload._analyticsId) })
                const folderName = res.analyticsFileInfo.name
                const path = Util.analyticsPath() + folderName + pathSep.sep
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

                function badRequest(msg) {
                    reply({
                        statusCode: 400,
                        message: "Bad request",
                        data: msg
                    })
                }
            } catch (error) {
                reply(Boom.badGateway(error))
            }
        }
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
        handler: async (request, reply) => {

        }
    }

];