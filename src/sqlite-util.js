"use strict";
exports.__esModule = true;
var sqlite3 = require('sqlite3');
var sqliteLib = sqlite3.verbose();
var db = [];
var sqliteUtil = /** @class */ (function () {
    function sqliteUtil() {
    }
    sqliteUtil.connect = function (path) {
        if (db.length < 1) {
            var dbcon = new sqliteLib.Database(path, function (err) {
                if (err) {
                    console.error(err.message);
                }
                else {
                    console.log('Connected to the database at: ' + path);
                }
            });
            db.push({
                path: path,
                db: dbcon
            });
        }
        return db.filter(function (db) { return db.path == path; })[0].db;
    };
    sqliteUtil.get = function (path) {
        return db.filter(function (db) { return db.path == path; })[0].db;
    };
    sqliteUtil.register = function (db, table) {
        var sql = 'CREATE TABLE IF NOT EXISTS ';
        if (table.name)
            sql += table.name + ' (';
        else
            return false;
        for (var _i = 0, _a = table.fields; _i < _a.length; _i++) {
            var field = _a[_i];
            if (field.name) {
                sql += field.name + ' ';
                if (field.type)
                    sql += field.type.toUpperCase() + ' ';
                else
                    sql += 'TEXT ';
                if (field.notNull == true)
                    sql += 'NOT NULL';
                if (field.primary == true)
                    sql += ' PRIMARY KEY';
                if (field.autoIncrement == true)
                    sql += ' AUTOINCREMENT';
                sql += ',';
            }
        }
        sql = sql.substring(0, sql.length - 1) + ');';
        db.run(sql);
    };
    return sqliteUtil;
}());
exports.sqliteUtil = sqliteUtil;
