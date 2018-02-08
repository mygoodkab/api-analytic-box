import { Util } from './util';
const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');
const Pack = require('./../package');
const util = require('./util')
const autoRoute = { dir: process.cwd() + "/dist/routes" };
const Boom = require('boom');
const optionsSwagger = {
    auth: false,
    info: {
        'title': 'API Documentation',
        'version': Pack.version,
    }
};
const optionsMongo = {
    url: 'mongodb://' + util.MONGODB.URL + ':' + util.MONGODB.PORT + '/admin',
    // url: 'mongodb://localhost:27017/db',
    settings: {
        poolSize: 10
    },
    decorate: true
}

const server = new Hapi.Server();
server.connection({
    port: 8000,//process.env.PORT,
    routes: {
        cors: true,
        files: {
            relativeTo: Util.uploadRootPath()
        }
    }
});

server.register([
    {
        register: require('hapi-mongodb'),
        options: optionsMongo
    },
    Inert,
    Vision,
    {
        register: require('hapi-auto-route'),
        options: autoRoute
    }
    , {
        register: require('hapi-swagger'),
        options: optionsSwagger
    },

], (error: any) => {
    if (error) throw error
    server.start((err) => {
        if (err) {
            throw err;
        }
        console.log('Server running at:', server.info.uri);
    });

    function validate(decoded, request, callback) {
        return callback(null, true);
        // if (decoded.name === 'Chai Phonbopit') {
        //     return callback(null, true);
        // } else {
        //     return callback(null, false);
        // }
    }
})



// import { Util } from './util';
// const Hapi = require('hapi');
// const Inert = require('inert');
// const Vision = require('vision');
// const Pack = require('./../package');
// const util = require('./util')
// const autoRoute = { dir: process.cwd() + "/dist/routes" };
// const options = {
//     auth: false,
//     info: {
//         'title': 'API Documentation',
//         'version': Pack.version,
//     }
// };
// const server = new Hapi.Server();
// server.connection({
//     port: 8000,
//     routes: {
//         cors: true,
//         files: {
//             relativeTo: Util.uploadRootPath()
//         }
//     }
// });

// server.register([
//     Inert,
//     Vision,
//     {
//         register: require('hapi-auto-route'),
//         options: autoRoute
//     }
//     , {
//         register: require('hapi-swagger'),
//         options: options
//     },
//     // {
//     //     register: require('hapi-auth-jwt2')
//     // },
// ], (error: any) => {
//     if (error) throw error

//     // server.auth.strategy('jwt', 'jwt', {
//     //     key: util.SECRET_KEY,
//     //     validateFunc: validate,
//     //     verifyOptions: { algorithms: ['HS256'] }
//     // });

//    // server.auth.default('jwt');

//     server.start((err) => {
//         if (err) {
//             throw err;
//         }
//         console.log('Server running at:', server.info.uri);

//     });

//     function validate(decoded, request, callback) {
//         return callback(null, true);
//         // if (decoded.name === 'Chai Phonbopit') {
//         //     return callback(null, true);
//         // } else {
//         //     return callback(null, false);
//         // }
//     }
// })



