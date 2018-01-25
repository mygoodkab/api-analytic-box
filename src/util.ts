const pathSep = require('path');
const crypto = require('crypto');
import { Db } from 'mongodb'
//pathSep.sep is check os that use / or \
exports.MONGODB = { URL:  "mongodb",// "10.0.0.71",
                    PORT: "27017" }
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
		let path: any = process.cwd().split(pathSep.sep);
		//	path.splice(path.indexOf('src'), path.length - path.indexOf('src'));
		path = path.join(pathSep.sep) + pathSep.sep + "uploads" + pathSep.sep + "files" + pathSep.sep;
		// if(!process.env.NODE_ENV || process.env.NODE_ENV != 'dev') {
		// 	path = '/var/ab-storage/files/';
		// }
		return path;
	}
	static JSMpegPath() {
		let path: any = process.cwd().split(pathSep.sep);
		path = path.join(pathSep.sep) + pathSep.sep + "JSMpeg" + pathSep.sep;
		return path;
	}
	static csvPath() {
		let path: any = process.cwd().split(pathSep.sep);
		path = path.join(pathSep.sep) + pathSep.sep + "uploads" + pathSep.sep + "cctv"
		if (!process.env.NODE_ENV || process.env.NODE_ENV != 'dev') {
			path = '/vam-data/uploads/cctv/';
			// path = '/vam_env/webconfig-api/analytics/';			
		}
		return path
	}
	static dockerAnalyticsCameraPath() {
		let path: any = process.cwd().split(pathSep.sep);
		path = path.join(pathSep.sep) + pathSep.sep + "uploads" + pathSep.sep + "docker-analytics-camera"
		if (!process.env.NODE_ENV || process.env.NODE_ENV != 'dev') {
			path = '/vam-data/uploads/docker-analytics-camera/';
			// path = '/vam_env/webconfig-api/analytics/';			
		}
		return path
	}
	static analyticsPath() {
		let path: any = process.cwd().split(pathSep.sep);
		path = path.join(pathSep.sep) + pathSep.sep + "uploads" + pathSep.sep + "analytics"
		if (!process.env.NODE_ENV || process.env.NODE_ENV != 'dev') {
			path = '/vam-data/uploads/analytics/';
			// path = '/vam_env/webconfig-api/analytics/';			
		}
		return path
	}
	static uploadImagePath() {
		//pathSep.sep is check os that use / or \
		let path: any = process.cwd().split(pathSep.sep);
		//	path.splice(path.indexOf('src'), path.length - path.indexOf('src'));
		path = path.join(pathSep.sep) + pathSep.sep + "uploads" + pathSep.sep + "register-images" + pathSep.sep;
		if (!process.env.NODE_ENV || process.env.NODE_ENV != 'dev') {
			path = '/vam-data/uploads/register-images/';
		}
		return path;
	}
	static uploadMatchImagePath() {

		//pathSep.sep is check os that use / or \
		let path: any = process.cwd().split(pathSep.sep);
		//	path.splice(path.indexOf('src'), path.length - path.indexOf('src'));
		path = path.join(pathSep.sep) + pathSep.sep + "uploads" + pathSep.sep + "recognition-match-images" + pathSep.sep;
		if (!process.env.NODE_ENV || process.env.NODE_ENV != 'dev') {
			path = '/vam-data/uploads/recognition-match-images/';
		}
		return path;
	}
	static uploadRootPath() {

		let path: any = process.cwd().split(pathSep.sep);
		//	path.splice(path.indexOf('src'), path.length - path.indexOf('src'));
		path = path.join(pathSep.sep) + pathSep.sep + "uploads" + pathSep.sep;

		if (!process.env.NODE_ENV || process.env.NODE_ENV != 'dev') {
			path = '/vam-data/uploads/';
		}
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

}