//Document NOSQL Lib: https://docs.totaljs.com/latest/en.html#api~Database
import { Util } from './util';
const fs = require('fs');
const noSQL = require('nosql');

export function collection(name: any) {
    let pathdb = '/vam-data/db'
    // check path file doesn't exist or something.
    if (!fs.existsSync(pathdb)) {
        fs.mkdir("/vam-data/db", (err) => {
            if (err) {
                console.log("Error create folder DB")
                return "Error create folder DB"
            }else{
                console.log("Create folder DB success")
            }
        })
    }
    
    
        let path = '/vam-data/db/' + name + '.nosql';
        // console.log(path);
        return noSQL.load(path);

    

    // function existFile() {
    //     console.log("6")
    //     let path = '/vam-data/db/' + name + '.nosql';
    //     // console.log(path);
    //     return noSQL.load(path);
    // }

}