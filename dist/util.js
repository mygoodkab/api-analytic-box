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
const pathSep = require('path');
const crypto = require('crypto');
const dateFormat = require('dateformat');
const fs = require('fs');
const differenceInMinutes = require('date-fns/difference_in_minutes');
let rimraf = require('rimraf');
let timezone = (7) * 60 * 60 * 1000;
let now = new Date(new Date().getTime() + timezone);
let tomorrow = new Date(new Date().getTime() + (24 + 7) * 60 * 60 * 1000);
let dayModel = { mon: "1", tue: "2", wed: "3", thu: "4", fri: "5", sat: "6", sun: "7" };
exports.MONGODB = {
    URL: "mongodb",
    PORT: "27017"
};
exports.SERVICE = {
    PORT: "8000"
};
exports.SECRET_KEY = "2CD1DF62C76F2122599E17B894A92";
class Util {
    static getDb(request) {
        return request.mongo.db;
    }
    static validate(model, obj) {
        var validation = {
            isValid: false,
            missing: []
        };
        for (var k in model) {
            if (k.charAt(0) == "_") {
                if (typeof obj[k] == "undefined" || obj[k] == null) {
                    validation.missing.push(k);
                }
            }
        }
        if (validation.missing.length == 0) {
            validation.isValid = true;
        }
        return validation;
    }
    static timestamp() {
        let time = new Date();
        return time.getFullYear() + '-' + (+time.getMonth() < 9 ? '0' + (+time.getMonth() + 1) : (+time.getMonth() + 1)) +
            '-' + (+time.getDate() < 10 ? '0' + (time.getDate()) : time.getDate()) +
            ' ' + (+time.getHours() < 10 ? '0' + (time.getHours()) : time.getHours()) +
            ':' + (+time.getMinutes() < 10 ? '0' + (time.getMinutes()) : time.getMinutes()) +
            ':' + (+time.getSeconds() < 10 ? '0' + (time.getSeconds()) : time.getSeconds());
    }
    static replyError(err, reply) {
        if (err) {
            let error = {
                statusCode: 500,
                message: "Internal Error",
                data: "Internal Error"
            };
            if (err.name)
                error.message = err.name;
            if (err.message)
                error.data = err.message;
            return reply(error);
        }
        return;
    }
    static deepCopy(obj) {
        let copy;
        if (null == obj || "object" != typeof obj)
            return obj;
        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }
        if (obj instanceof Array) {
            copy = [];
            for (let i = 0, len = obj.length; i < len; i++) {
                copy[i] = this.deepCopy(obj[i]);
            }
            return copy;
        }
        if (obj instanceof Object) {
            if (obj._bsontype && obj._bsontype == "ObjectID") {
                let { ObjectId } = require('mongodb');
                let objectId = obj.toString();
                let safeObjectId = ObjectId.isValid(objectId) ? new ObjectId(objectId) : null;
                return safeObjectId;
            }
            else {
                copy = {};
                for (let attr in obj) {
                    if (obj.hasOwnProperty(attr))
                        copy[attr] = this.deepCopy(obj[attr]);
                }
                return copy;
            }
        }
        throw new Error("Unable to copy obj! Its type isn't supported.");
    }
    static msToTime(s) {
        let ms = s % 1000;
        s = (s - ms) / 1000;
        let secs = s % 60;
        s = (s - secs) / 60;
        let mins = s % 60;
        let hrs = (s - mins) / 60;
        let msg = "";
        if (hrs > 0)
            msg += hrs + ":";
        if (mins > 0)
            msg += mins + ":";
        if (hrs == 0 && mins == 0) {
            if (secs > 0) {
                msg += secs + "." + ms + " s";
            }
            else {
                msg += ms + " ms";
            }
        }
        else {
            msg += secs + "." + ms;
        }
        return msg;
    }
    static isMongoObjectId(strId) {
        let { ObjectId } = require('mongodb');
        let objectId = strId.toString();
        return ObjectId.isValid(objectId) ? true : false;
    }
    static uniqid() {
        let uniqid = require('uniqid');
        return uniqid();
    }
    static uploadPath() {
        let path = pathSep.join(__dirname, 'vam-data', 'uploads', 'files') + pathSep.sep;
        return path;
    }
    static JSMpegPath() {
        let path = pathSep.join(__dirname, 'JSMpeg') + pathSep.sep;
        return path;
    }
    static csvPath() {
        let path = pathSep.join(__dirname, 'vam-data', 'uploads', 'cctv') + pathSep.sep;
        return path;
    }
    static dockerAnalyticsCameraPath() {
        let path = pathSep.join(__dirname, 'vam-data', 'uploads', 'docker-analytics-camera') + pathSep.sep;
        return path;
    }
    static analyticsPath() {
        let path = pathSep.join(__dirname, 'vam-data', 'uploads', 'analytics') + pathSep.sep;
        return path;
    }
    static uploadImagePath() {
        let path = pathSep.join(__dirname, 'vam-data', 'uploads', 'register-images') + pathSep.sep;
        return path;
    }
    static uploadMatchImagePath() {
        let path = pathSep.join(__dirname, 'vam-data', 'uploads', 'recognition-match-images') + pathSep.sep;
        return path;
    }
    static uploadRootPath() {
        let path = pathSep.join(__dirname, 'vam-data', 'uploads') + pathSep.sep;
        return path;
    }
    static imageCamera() {
        let path = pathSep.join(__dirname, 'vam-data', 'uploads', 'camera') + pathSep.sep;
        return path;
    }
    static calculatePageQuery(pageIndex, pageSize) {
        if (isNaN(pageIndex) || isNaN(pageSize))
            return false;
        let pageSkip = +pageSize * +pageIndex;
        let pageLimit = +pageSize;
        if (pageIndex == -1)
            pageSkip = 0;
        if (pageSize == -1)
            pageLimit = 0;
        return { skip: pageSkip, limit: pageLimit };
    }
    static hash(data) {
        let hash = crypto.createHash('sha256');
        hash.update(JSON.stringify(data));
        let key = hash.digest('hex');
        return key;
    }
    static isNotification(data) {
        let isToday = false;
        let year = parseInt(dateFormat(now, "yyy"));
        let month = parseInt(dateFormat(now, "m"));
        let day = parseInt(dateFormat(now, "d"));
        let hour = parseInt(dateFormat(now, "HH"));
        let min = parseInt(dateFormat(now, "MM"));
        let tomorrowYear = parseInt(dateFormat(tomorrow, "yyy"));
        let tomorrowMonth = parseInt(dateFormat(tomorrow, "m"));
        let tomorrowDay = parseInt(dateFormat(tomorrow, "d"));
        let valueDayStart;
        let valueDayEnd;
        let valueToday;
        if (data.dayStart == data.dayEnd && data.dayStart == dateFormat(now, "ddd").toLowerCase()) {
            isToday = true;
        }
        if (data.dayStart != data.dayEnd) {
            for (let fieldDay in dayModel) {
                if (data.dayStart == fieldDay) {
                    valueDayStart = dayModel[fieldDay];
                }
                if (data.dayEnd == fieldDay) {
                    valueDayEnd = dayModel[fieldDay];
                }
                if (dateFormat(now, "ddd").toLowerCase() == fieldDay) {
                    valueToday = dayModel[fieldDay];
                }
            }
            if (valueDayStart < valueDayEnd) {
                if (valueToday >= valueDayStart && valueToday <= valueDayEnd) {
                    isToday = true;
                }
            }
            else {
                if (!(valueToday < valueDayStart && valueToday > valueDayEnd)) {
                    isToday = true;
                }
            }
        }
        if (isToday) {
            let timeEndH = parseInt(data.timeEnd.split(':')[0]);
            let timeStartH = parseInt(data.timeStart.split(':')[0]);
            let timeEndM = parseInt(data.timeEnd.split(':')[1]);
            let timeStartM = parseInt(data.timeStart.split(':')[1]);
            var TodayDiffTimeStart = differenceInMinutes(new Date(year, month, day, hour, min, 0), new Date(year, month, day, timeStartH, timeStartM, 0));
            var TodayDiffTimeEnd = differenceInMinutes(new Date(year, month, day, hour, min, 0), new Date(year, month, day, timeEndH, timeEndM, 0));
            if (data.dayStart == data.dayEnd) {
                if (timeStartH < timeEndH || (timeStartH == timeEndH) && (timeStartM <= timeEndM)) {
                    console.log(TodayDiffTimeStart + " " + TodayDiffTimeEnd);
                    if (TodayDiffTimeStart >= 0 && TodayDiffTimeEnd <= 0) {
                        return true;
                    }
                }
            }
            else {
                if (valueDayStart < valueDayEnd) {
                    if (valueToday > valueDayStart && valueToday < valueDayEnd) {
                        return true;
                    }
                    else if (valueToday == valueDayStart) {
                        if (TodayDiffTimeStart >= 0) {
                            return true;
                        }
                    }
                    else if (valueToday == valueDayEnd) {
                        if (TodayDiffTimeEnd <= 0) {
                            return true;
                        }
                    }
                }
                else {
                    if (valueToday == valueDayStart) {
                        if (TodayDiffTimeStart >= 0) {
                            return true;
                        }
                    }
                    else if (valueToday == valueDayEnd) {
                        if (TodayDiffTimeEnd <= 0) {
                            return true;
                        }
                    }
                    else if (!(valueToday < valueDayStart && valueToday > valueDayEnd)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    static existFolder(path) {
        let createPath = pathSep.join(__dirname, path);
        fs.stat(createPath, (err, stats) => __awaiter(this, void 0, void 0, function* () {
            if (err) {
                fs.mkdir(createPath, (err) => {
                    return true;
                });
            }
            return true;
        }));
    }
    static removeFolder(path) {
        if (fs.existsSync(path)) {
            rimraf.sync(path);
            return true;
        }
        else {
            return false;
        }
    }
}
exports.Util = Util;
//# sourceMappingURL=util.js.map