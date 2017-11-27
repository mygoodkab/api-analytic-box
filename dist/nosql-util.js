"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const noSQL = require('nosql');
function collection(name) {
    let path = '/vam-data/db/' + name + '.nosql';
    return noSQL.load(path);
}
exports.collection = collection;
//# sourceMappingURL=nosql-util.js.map