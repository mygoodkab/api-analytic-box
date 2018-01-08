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
//# sourceMappingURL=nosql-util.js.map