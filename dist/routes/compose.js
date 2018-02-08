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
const db = require("../nosql-util");
const objectid = require('objectid');
const Joi = require('joi');
const util_1 = require("../util");
const Boom = require("boom");
const mongoObjectId = require('mongodb').ObjectId;
module.exports = [
    {
        method: 'GET',
        path: '/compose/mongo',
        config: {
            tags: ['api'],
            description: 'Get analytic offline in camera to start ',
            notes: 'Get analytic offline in camera to start',
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            let dbm = util_1.Util.getDb(request);
            try {
                const resAssignAnalytics = yield dbm.collection('assignAnalytics').find().toArray();
                let i = 1;
                let analytic = [];
                if (resAssignAnalytics.length == 0) {
                    reply(Boom.notFound);
                }
                else {
                    for (let data of resAssignAnalytics) {
                        let arrData = {
                            status: data.status,
                            dockerNickname: data.nickname,
                        };
                        analytic.push(arrData);
                        if (i == resAssignAnalytics.length) {
                            reply({
                                statusCode: 200,
                                message: "OK",
                                data: analytic
                            });
                        }
                        i++;
                    }
                }
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
    },
    {
        method: 'GET',
        path: '/compose/',
        config: {
            tags: ['api'],
            description: 'Get analytic offline in camera to start ',
            notes: 'Get analytic offline in camera to start',
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            db.collection('assignAnalytics').find().make((builder) => {
                builder.callback((err, res) => {
                    if (res) {
                        let i = 1;
                        let analytic = [];
                        if (res.length == 0) {
                            badrequest("NO data in assignAnalytics");
                        }
                        else {
                            for (let data of res) {
                                let arrData = {
                                    status: data.status,
                                    dockerNickname: data.nickname,
                                };
                                analytic.push(arrData);
                                if (i == res.length) {
                                    success(analytic);
                                }
                                i++;
                            }
                        }
                    }
                    else {
                        badrequest("no Data in payload");
                    }
                    function success(data) {
                        reply({
                            statusCode: 200,
                            message: "OK",
                            data: data
                        });
                    }
                    function badrequest(msg) {
                        reply({
                            statusCode: 400,
                            message: "Bad Request",
                            data: msg
                        });
                    }
                });
            });
        })
    },
];
//# sourceMappingURL=compose.js.map