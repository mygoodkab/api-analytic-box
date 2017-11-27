import * as db from '../nosql-util';
import { Util } from '../util';
const pathSep = require('path');
const objectid = require('objectid');
const Joi = require('joi')
const fs = require('fs');
const DIR = '../uploads/';
const del = require('del');
const child_process = require('child_process');
module.exports = [
    { // Get image file by id
        method: 'GET',
        path: '/bodySkeleton/get-images/',
        config: {
            tags: ['api'],
            description: 'Get image for UI',
            notes: 'Get image ',
        },
        handler: (request, reply) => {
            let path: any = Util.imageBodySkeletonPath() + "skeleton_output.jpg" // path + folder + \ + filename.png
            //let path: any = "C:\\Users\\ESLab\\Desktop\\api\\api-analytic-box\\uploads\\analytics-logo-images\\rjh5uq3d4j9y8rik7.png"
            console.log(path)
            return reply.file(path,
                {
                    filename: 'output.jpg',
                    mode: 'inline',
                    confine: false
                })
        }
    }
]