
const sqlite3 = require('sqlite3');
const sqliteLib = sqlite3.verbose();

var db:any = [];

export class sqliteUtil {
    static connect(path:any):any {
        if(db.length < 1) {
            let dbcon = new sqliteLib.Database(path, (err) => {
                if (err) {
                    console.error(err.message);
                } else {
                    console.log('Connected to the database at: ' + path);
                }
            });

            db.push({
                path: path,
                db: dbcon
            })
        }
        return db.filter((db:any) => {return db.path == path})[0].db;
    }

    static get(path:any) :any {
        return db.filter((db:any) => {return db.path == path})[0].db;
    }

    static register(db:any,table:any) :any {
        let sql = 'CREATE TABLE IF NOT EXISTS ';
        if(table.name) sql += table.name + ' (';
        else return false;
        for(let field of table.fields) {
            if(field.name) {
                sql += field.name + ' ';
                if(field.type) sql += field.type.toUpperCase() + ' ';
                else sql += 'TEXT ';
                if(field.notNull == true) sql += 'NOT NULL';
                if(field.primary == true) sql += ' PRIMARY KEY';
                if(field.autoIncrement == true) sql += ' AUTOINCREMENT';
                sql += ',';
            }
        }
        sql = sql.substring(0,sql.length-1) + ');';
        db.run(sql);
    }
}