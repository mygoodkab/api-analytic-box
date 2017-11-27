//Document NOSQL Lib: https://docs.totaljs.com/latest/en.html#api~Database

const noSQL = require('nosql');

export function collection (name:any) {
        let path = '/vam-data/db/' + name + '.nosql';
       // console.log(path);
        return noSQL.load(path);
    }