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
const Boom = require("boom");
const util_1 = require("../util");
const Joi = require('joi');
const JWT = require('jsonwebtoken');
const mongoObjectId = require('mongodb').ObjectId;
const { MONGODB } = require('../util');
module.exports = [
    {
        method: 'POST',
        path: '/login',
        config: {
            tags: ['api'],
            description: 'Check login',
            notes: 'Check login',
            validate: {
                payload: {
                    username: Joi.string().required(),
                    password: Joi.string().required(),
                }
            }
        },
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            let mongo = util_1.Util.getDb(request);
            try {
                const login = yield mongo.collection('users').findOne({ username: request.payload.username, password: request.payload.password });
                if (login) {
                    reply({
                        statusCode: 200,
                        message: "Login success",
                    });
                }
                else {
                    reply(Boom.notFound("Invaild username or password"));
                }
            }
            catch (error) {
                reply(Boom.badGateway(error));
            }
        })
    }
];
//# sourceMappingURL=login.js.map