"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../util");
const pathSep = require('path');
const objectid = require('objectid');
const Joi = require('joi');
const fs = require('fs');
const DIR = '../uploads/';
const del = require('del');
const child_process = require('child_process');
module.exports = [
    {
        method: 'GET',
        path: '/bodySkeleton/get-images/',
        config: {
            tags: ['api'],
            description: 'Get image for UI',
            notes: 'Get image ',
        },
        handler: (request, reply) => {
            let path = util_1.Util.imageBodySkeletonPath() + "skeleton_output.jpg";
            console.log(path);
            return reply.file(path, {
                filename: 'output.jpg',
                mode: 'inline',
                confine: false
            });
        }
    }
];
//# sourceMappingURL=bodySkeleton.js.map