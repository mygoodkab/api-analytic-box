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
const util_1 = require("../util");
const Boom = require("boom");
const objectid = require('objectid');
const Joi = require('joi');
const { MONGODB } = require('../util');
const mongoObjectId = require('mongodb').ObjectId;
module.exports = [
    {
        method: 'GET',
        path: '/notification',
        config: {
            tags: ['api'],
            description: 'Select all notification  ',
            notes: 'Select all notification '
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            let dbm = util_1.Util.getDb(request);
            try {
                const res = yield dbm.collection('notification').find({ isHide: false }).sort({ timedb: -1 }).toArray();
                if (res.length == 0) {
                    reply(Boom.notFound("NO data"));
                }
                else {
                    reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    });
                }
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
    },
    {
        method: 'GET',
        path: '/notification/{id}',
        config: {
            tags: ['api'],
            description: 'Get id notification data',
            notes: 'Get id notification data',
            validate: {
                params: {
                    id: Joi.string()
                        .required()
                }
            }
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            let dbm = util_1.Util.getDb(request);
            try {
                const res = yield dbm.collection('notification').findOne({ _id: mongoObjectId(request.params.id) });
                if (res) {
                    reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    });
                }
                else {
                    reply(Boom.notFound("NO data"));
                }
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
    },
    {
        method: 'GET',
        path: '/notification/sort-dockerNickname/{dockerNickname}',
        config: {
            tags: ['api'],
            description: 'Get id notification data',
            notes: 'Get id notification data',
            validate: {
                params: {
                    dockerNickname: Joi.string()
                        .required()
                }
            }
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            let dbm = util_1.Util.getDb(request);
            try {
                const res = yield dbm.collection('notification').find({ dockerNickname: request.params.dockerNickname }).sort({ timedb: -1 }).toArray();
                if (res) {
                    reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    });
                }
                else {
                    reply(Boom.notFound("NO data"));
                }
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
    },
    {
        method: 'GET',
        path: '/notification/sort-statusRead/{dockerNickname}',
        config: {
            tags: ['api'],
            description: 'Get id notification data',
            notes: 'Get id notification data',
            validate: {
                params: {
                    dockerNickname: Joi.string()
                        .required()
                }
            }
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            let dbm = util_1.Util.getDb(request);
            try {
                const res = yield dbm.collection('notification').find({ dockerNickname: request.params.dockerNickname, isRead: false }).sort({ timedb: -1 }).toArray();
                if (res) {
                    reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    });
                }
                else {
                    reply(Boom.notFound("NO data"));
                }
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
    },
    {
        method: 'GET',
        path: '/notification/lastest/{dockerNickname}',
        config: {
            tags: ['api'],
            description: 'Get lastest dockerNickname notification data ',
            notes: 'Get  lastest dockerNickname notification data',
            validate: {
                params: {
                    dockerNickname: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            let dbm = util_1.Util.getDb(request);
            try {
                const res = yield dbm.collection('notification').find({ dockerNickname: request.params.dockerNickname, isRead: false }).sort({ timedb: -1 }).limit(1).toArray();
                if (res) {
                    reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    });
                }
                else {
                    reply(Boom.notFound("NO data"));
                }
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
    },
    {
        method: 'POST',
        path: '/notification/hide',
        config: {
            tags: ['api'],
            description: 'hide notification',
            notes: 'hide notification',
            validate: {
                payload: {
                    id: Joi.string().required(),
                }
            }
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            let dbm = util_1.Util.getDb(request);
            try {
                const update = yield dbm.collection("notification").updateOne({ _id: mongoObjectId(request.payload.id) }, { $set: { isHide: true } });
                reply({
                    statusCode: 200,
                    message: "Update success",
                });
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
    },
    {
        method: 'GET',
        path: '/notification/sort-hide/{dockerNickname}',
        config: {
            tags: ['api'],
            description: 'Get id notification data',
            notes: 'Get id notification data',
            validate: {
                params: {
                    dockerNickname: Joi.string()
                        .required()
                }
            }
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            let dbm = util_1.Util.getDb(request);
            try {
                const res = yield dbm.collection("notification").find({ dockerNickname: request.params.dockerNickname, isHide: false }).sort({ timedb: -1 }).toArray();
                if (res) {
                    reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    });
                }
                else {
                    reply(Boom.notFound("NO data"));
                }
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
    },
    {
        method: 'POST',
        path: '/notification/insert',
        config: {
            tags: ['api'],
            description: 'insert notification data',
            notes: 'insert notification data',
            validate: {
                payload: {
                    dockerNickname: Joi.object()
                }
            }
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            let dbm = util_1.Util.getDb(request);
            try {
                const insertAnalyticsRecord = yield dbm.collection('notification').insertOne(request.payload);
                reply({
                    statusCode: 200,
                    message: "OK",
                });
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
    },
    {
        method: 'POST',
        path: '/notification/delete',
        config: {
            tags: ['api'],
            description: 'delete all',
            notes: 'delete all',
            validate: {
                payload: {
                    pass: Joi.string().required(),
                }
            }
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            let dbm = util_1.Util.getDb(request);
            let payload = request.payload;
            if (payload.pass == "pass") {
                try {
                    const del = yield dbm.collection('notification').remove({});
                    reply({
                        statusCode: 200,
                        message: "OK",
                        data: "Delete rule Success"
                    });
                }
                catch (error) {
                    reply(Boom.badGateway(error));
                }
            }
            else {
                reply(Boom.badRequest("Invalid password"));
            }
        })
    },
    {
        method: 'GET',
        path: '/notification/test',
        config: {
            tags: ['api'],
            description: 'Select all notification  ',
            notes: 'Select all notification '
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            let dbm = util_1.Util.getDb(request);
            try {
                const res = yield dbm.collection('notification').find().toArray();
                if (res.length == 0) {
                    reply(Boom.notFound);
                }
                else {
                    reply({
                        statusCode: 200,
                        message: "OK",
                        data: res
                    });
                }
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
    },
];
//# sourceMappingURL=notification.js.map