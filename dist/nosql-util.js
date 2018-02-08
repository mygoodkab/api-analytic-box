"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
const noSQL = require('nosql');
function collection(name) {
    let pathdb = '/vam-data/db';
    if (!fs.existsSync(pathdb)) {
        fs.mkdir("/vam-data/db", (err) => {
            if (err) {
                console.log("Error create folder DB");
                return "Error create folder DB";
            }
            else {
                console.log("Create folder DB success");
            }
        });
    }
    let path = '/vam-data/db/' + name + '.nosql';
    return noSQL.load(path);
}
exports.collection = collection;
function collectionServer(name) {
    let pathdb = '/vam-data/db-server';
    if (!fs.existsSync(pathdb)) {
        fs.mkdir("/vam-data/db-server", (err) => {
            if (err) {
                console.log("Error create folder DB-Server");
                return "Error create folder DB";
            }
            else {
                console.log("Create folder DB-Server success");
            }
        });
    }
    let path = '/vam-data/db-server/' + name + '.nosql';
    return noSQL.load(path);
}
exports.collectionServer = collectionServer;
//# sourceMappingURL=nosql-util.js.map