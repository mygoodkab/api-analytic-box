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
        path: '/rules',
        config: {
            tags: ['api'],
            description: 'Select all rules ',
            notes: 'Select all rules '
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            let dbm = util_1.Util.getDb(request);
            try {
                const res = yield dbm.collection('rules').find().toArray();
                if (res.length > 0) {
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
        path: '/rules/{id}',
        config: {
            tags: ['api'],
            description: 'Get id rules data',
            notes: 'Get id rules data',
            validate: {
                params: {
                    id: Joi.string()
                        .required()
                        .description('id feature'),
                }
            }
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            let dbm = util_1.Util.getDb(request);
            try {
                const res = yield dbm.collection('rules').findOne({ _id: mongoObjectId(request.params.id) });
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
        path: '/rules/dockerNickname/{id}',
        config: {
            tags: ['api'],
            description: 'Get id rules data',
            notes: 'Get id rules data',
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
                const res = yield dbm.collection('rules').findOne({ dockerNickname: request.params.id });
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
        path: '/rules/insert',
        config: {
            tags: ['api'],
            description: 'Insert rules data',
            notes: 'Insert rules data',
            validate: {
                payload: {
                    dockerNickname: Joi.string().required(),
                    type: Joi.string().required(),
                    dayStart: Joi.string().required(),
                    dayEnd: Joi.string().required(),
                    timeStart: Joi.string().required(),
                    timeEnd: Joi.string().required(),
                    metadata: Joi.any()
                }
            }
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            let payload = request.payload;
            let dbm = util_1.Util.getDb(request);
            let validate = payload.rule;
            try {
                const insert = yield dbm.collection('rules').insertOne(payload);
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: "Create rule Success"
                });
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
    },
    {
        method: 'POST',
        path: '/rules/update',
        config: {
            tags: ['api'],
            description: 'Update rules data',
            notes: 'Update rules data',
            validate: {
                payload: {
                    dockerNickname: Joi.string().required(),
                    type: Joi.string().required(),
                    dayStart: Joi.string().required(),
                    dayEnd: Joi.string().required(),
                    timeStart: Joi.string().required(),
                    timeEnd: Joi.string().required(),
                    metadata: Joi.any()
                }
            }
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            let dbm = util_1.Util.getDb(request);
            let payload = request.payload;
            let validate = payload.rule[0];
            let ruleUpdate = {
                type: payload.type,
                dayStart: payload.type,
                dayEnd: payload.type,
                timeStart: payload.type,
                timeEnd: payload.type,
                metadata: payload.type,
            };
            try {
                const update = yield dbm.collection('rules').updateOne({ dockerNickname: payload.dockerNickname }, { $set: ruleUpdate });
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: "Update rule Success"
                });
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
    },
    {
        method: 'POST',
        path: '/rules/delete',
        config: {
            tags: ['api'],
            description: 'delete all',
            notes: 'delete all',
            validate: {
                payload: {
                    id: Joi.string().required(),
                }
            }
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            let dbm = util_1.Util.getDb(request);
            let payload = request.payload;
            try {
                const del = yield dbm.collection('rules').deleteOne({ _id: mongoObjectId(payload.id) });
                reply({
                    statusCode: 200,
                    message: "OK",
                    data: "Delete rule Success"
                });
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
    },
];
//# sourceMappingURL=rule.js.map