const pathSep = require('path');
const crypto = require('crypto');
const dateFormat = require('dateformat');
const fs = require('fs');
const differenceInMinutes = require('date-fns/difference_in_minutes')
let rimraf = require('rimraf')
let timezone = (7) * 60 * 60 * 1000;
let now: any = new Date(new Date().getTime() + timezone); // * timezone thai
let tomorrow = new Date(new Date().getTime() + (24 + 7) * 60 * 60 * 1000); // * timezone thai * 24 hours
let dayModel = { mon: "1", tue: "2", wed: "3", thu: "4", fri: "5", sat: "6", sun: "7" }
import { Db } from 'mongodb';

//pathSep.sep is check os that use / or \
exports.MONGODB = {
	URL: "mongodb",// "10.0.0.71",
	PORT: "27017"
}
exports.SECRET_KEY = "2CD1DF62C76F2122599E17B894A92"
export class Util {
	static getDb(request: any): Db {
		return request.mongo.db;
		// if (request.auth.isAuthenticated) {
		//     let dbName = request.auth.credentials.domain;
		//     let req: any = request;
		//     let db = req.mongo.db;
		//     for (var i = 0, len = db.length; i < len; i++) {
		//         if (db[i].databaseName == dbName)
		//             return db[i];
		//     }
		//     //            console.log(db.length);
		// }
	}
	static validate(model: any, obj: any): any {
		var validation: any = {
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
	static replyError(err: any, reply: any) {
		if (err) {
			let error: any = {
				statusCode: 500,
				message: "Internal Error",
				data: "Internal Error"
			}
			if (err.name) error.message = err.name;
			if (err.message) error.data = err.message;
			return reply(error);
		}
		return;
	}
	static deepCopy(obj: any) {
		let copy: any;

		// Handle the 3 simple types, and null or undefined
		if (null == obj || "object" != typeof obj) return obj;

		// Handle Date
		if (obj instanceof Date) {
			copy = new Date();
			copy.setTime(obj.getTime());
			return copy;
		}

		// Handle Array
		if (obj instanceof Array) {
			copy = [];
			for (let i = 0, len = obj.length; i < len; i++) {
				copy[i] = this.deepCopy(obj[i]);
			}
			return copy;
		}

		// Handle Object
		if (obj instanceof Object) {
			if (obj._bsontype && obj._bsontype == "ObjectID") {
				let { ObjectId } = require('mongodb');
				let objectId: any = obj.toString();
				let safeObjectId = ObjectId.isValid(objectId) ? new ObjectId(objectId) : null;
				return safeObjectId;
			} else {
				copy = {};
				for (let attr in obj) {
					if (obj.hasOwnProperty(attr)) copy[attr] = this.deepCopy(obj[attr]);
				}
				return copy;
			}
		}

		throw new Error("Unable to copy obj! Its type isn't supported.");
	}
	static msToTime(s: number) {
		let ms = s % 1000;
		s = (s - ms) / 1000;
		let secs = s % 60;
		s = (s - secs) / 60;
		let mins = s % 60;
		let hrs = (s - mins) / 60;

		let msg = "";
		if (hrs > 0) msg += hrs + ":";
		if (mins > 0) msg += mins + ":";
		if (hrs == 0 && mins == 0) {
			if (secs > 0) {
				msg += secs + "." + ms + " s";
			} else {
				msg += ms + " ms";
			}
		} else {
			msg += secs + "." + ms;
		}

		return msg;
	}
	static isMongoObjectId(strId: string) {
		let { ObjectId } = require('mongodb');
		let objectId: any = strId.toString();
		return ObjectId.isValid(objectId) ? true : false;
	}
	static uniqid() {
		let uniqid = require('uniqid');
		return uniqid();
	}
	static uploadPath() {
		let path = pathSep.join(__dirname, 'vam-data', 'uploads', 'files') + pathSep.sep
		return path;
	}
	static JSMpegPath() {
		let path = pathSep.join(__dirname, 'JSMpeg') + pathSep.sep
		return path;
	}
	static csvPath() {
		let path = pathSep.join(__dirname, 'vam-data', 'uploads', 'cctv') + pathSep.sep
		return path
	}
	static dockerAnalyticsCameraPath() {
		let path = pathSep.join(__dirname, 'vam-data', 'uploads', 'docker-analytics-camera') + pathSep.sep
		return path
	}
	static analyticsPath() {
		let path = pathSep.join(__dirname, 'vam-data', 'uploads', 'analytics') + pathSep.sep
		return path
	}
	static uploadImagePath() {
		let path = pathSep.join(__dirname, 'vam-data', 'uploads', 'register-images') + pathSep.sep
		return path;
	}
	static uploadMatchImagePath() {
		let path = pathSep.join(__dirname, 'vam-data', 'uploads', 'recognition-match-images') + pathSep.sep
		return path;
	}
	static uploadRootPath() {

		let path = pathSep.join(__dirname, 'vam-data', 'uploads') + pathSep.sep

		return path;
	}
	static imageCamera() {
		let path = pathSep.join(__dirname, 'vam-data', 'uploads', 'camera') + pathSep.sep

		return path;
	}
	static calculatePageQuery(pageIndex: any, pageSize: any) {
		if (isNaN(pageIndex) || isNaN(pageSize)) return false;
		let pageSkip = +pageSize * +pageIndex;
		let pageLimit = +pageSize;

		if (pageIndex == -1) pageSkip = 0;
		if (pageSize == -1) pageLimit = 0;
		return { skip: pageSkip, limit: pageLimit };
	}
	static hash(data: any) {
		let hash = crypto.createHash('sha256')
		hash.update(JSON.stringify(data));
		let key = hash.digest('hex');
		return key;
	}
	static isNotification(data) {
		let isToday = false;
		let year = parseInt(dateFormat(now, "yyy"))
		let month = parseInt(dateFormat(now, "m"))
		let day = parseInt(dateFormat(now, "d"))
		let hour = parseInt(dateFormat(now, "HH"))
		let min = parseInt(dateFormat(now, "MM"))
		let tomorrowYear = parseInt(dateFormat(tomorrow, "yyy"))
		let tomorrowMonth = parseInt(dateFormat(tomorrow, "m"))
		let tomorrowDay = parseInt(dateFormat(tomorrow, "d"))
		let valueDayStart;
		let valueDayEnd;
		let valueToday;
		if (data.dayStart == data.dayEnd && data.dayStart == dateFormat(now, "ddd").toLowerCase()) {
			isToday = true
		}

		if (data.dayStart != data.dayEnd) {
			for (let fieldDay in dayModel) {  // day to value = 1-7 (mon-sun)
				if (data.dayStart == fieldDay) {
					valueDayStart = dayModel[fieldDay];
				}
				if (data.dayEnd == fieldDay) {
					valueDayEnd = dayModel[fieldDay];
				}
				if (dateFormat(now, "ddd").toLowerCase() == fieldDay) {
					valueToday = dayModel[fieldDay]
				}
			}

			// compare day
			if (valueDayStart < valueDayEnd) {  //ถ้าเลขหน้าน้อยกว่าเลขหลัง เช่น  1-3
				if (valueToday >= valueDayStart && valueToday <= valueDayEnd) {  // if  1-3 = mon, tue, wed
					isToday = true
				}
			} else {       //ถ้าเลขหน้ามากกว่าเลขหลัง เช่น  3 - 1
				if (!(valueToday < valueDayStart && valueToday > valueDayEnd)) { // if  7-3  sun,mon,tue,wed
					isToday = true
				}
			}
		}
		if (isToday) {
			let timeEndH = parseInt(data.timeEnd.split(':')[0])
			let timeStartH = parseInt(data.timeStart.split(':')[0])
			let timeEndM = parseInt(data.timeEnd.split(':')[1])
			let timeStartM = parseInt(data.timeStart.split(':')[1])
			var TodayDiffTimeStart = differenceInMinutes( // diff กันแล้วผลลัพธ์  - คือยังไม่ถึงเวลา แต่ถ้าเป็น + คือผ่านมาแล้ว
				new Date(year, month, day, hour, min, 0), //เวลาปัจจุบัน
				new Date(year, month, day, timeStartH, timeStartM, 0) //เวลาเทียบ
			)
			var TodayDiffTimeEnd = differenceInMinutes(
				new Date(year, month, day, hour, min, 0),
				new Date(year, month, day, timeEndH, timeEndM, 0)
			)
			if (data.dayStart == data.dayEnd) { // ถ้ากำหนดเป็นวันเดียว เช่น  Mon 17.00 - 23.59
				if (timeStartH < timeEndH || (timeStartH == timeEndH) && (timeStartM <= timeEndM)) { //ถ้าเวลาเริ่มน้อยกว่าเวลาจบ เช่น 5.30-22.30 , 23.30-23.31 , 14.00-14.00
					console.log(TodayDiffTimeStart + " " + TodayDiffTimeEnd)
					if (TodayDiffTimeStart >= 0 && TodayDiffTimeEnd <= 0) { //  ถ้า TodayDiffTimeStart เป็น +  และ  TodayDiffTimeEnd เป็น -  แสดงว่าเวลาปัจจุบันอยู่ระหว่างเวลาที่กำหนด
						return true
					}
				}
			}
			else {
				if (valueDayStart < valueDayEnd) {  // if  1-3 = mon, tue, wed
					if (valueToday > valueDayStart && valueToday < valueDayEnd) { // ถ้าวันปัจจุบันอยู่ระหว่างเวลาที่กำหนด 
						return true
					} else if (valueToday == valueDayStart) { // ถ้าวันปัจจุบันตรงกับวันแรกที่กำหนด
						if (TodayDiffTimeStart >= 0) { //  ถ้า TodayDiffTimeStart เป็น + แสดงว่าเวลาผ่านมาแล้ว 
							return true
						}
					} else if (valueToday == valueDayEnd) { // ถ้าวันปัจจุบันตรงกำวันสุดท้ายที่กำหนด
						if (TodayDiffTimeEnd <= 0) { //  ถ้า TodayDiffTimeEnd เป็น -  แสดงว่าเวลาปัจจุบันอยู่ยังไม่เลยเวลาที่กำหนด
							return true
						}
					}
				} else {        // if  7-3  sun,mon,tue,wed
					if (valueToday == valueDayStart) { // ถ้าวันปัจจุบันตรงกับวันแรกที่กำหนด
						if (TodayDiffTimeStart >= 0) { //  ถ้า TodayDiffTimeStart เป็น + แสดงว่าเวลาผ่านมาแล้ว 
							return true
						}
					} else if (valueToday == valueDayEnd) { // ถ้าวันปัจจุบันตรงกำวันสุดท้ายที่กำหนด
						if (TodayDiffTimeEnd <= 0) { //  ถ้า TodayDiffTimeEnd เป็น -  แสดงว่าเวลาปัจจุบันอยู่ยังไม่เลยเวลาที่กำหนด
							return true
						}
					} else if (!(valueToday < valueDayStart && valueToday > valueDayEnd)) {  // ถ้าวันปัจจุบันอยู่ระหว่างเวลาที่กำหนด 
						return true
					}
				}
			}
		}
		return false
	}
	static existFolder(path) {
		let createPath = pathSep.join(__dirname, path)
		fs.stat(createPath, async (err, stats) => {
			if (err) {
				fs.mkdir(createPath, (err) => {
					return true
				})
			}
			return true
		})
	}
	static removeFolder(path) {
		if (fs.existsSync(path)) {
			rimraf.sync(path)
			return true
		} else {
			return false
		}
	}

}