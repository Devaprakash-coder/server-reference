const config = {
    development: {
        //url to be used in link generation
        url: 'mongodb://localhost/dine_pos',
        environment: 'development',
        base_url: 'http://localhost:4200/'
    },
    production: {
        url: 'mongodb://localhost:27017/dine_pos',  //SIS
        username: "<username>",
        password: "<password>",
        environment: 'production',
        base_url: 'http://localhost:4200/'
    },
    test: {
        url: 'mongodb://localhost:27017/dine_pos',  //SIS
        username: "<username>",
        password: "<password>",
        environment: 'test',
        base_url: 'http://localhost:4200/'
    },
    mailOptions: {

        host: "mail.whitemastery.com",
        port: 25,
        auth: {
            user: "support@dinamic.io",
            pass: "Welcome@1"
        },
        secure: false,
    }  
};

module.exports = config;

/*
* Below commands are used to create backup and restore mongo database
*/
// mongodump --host localhost:27017 --username pos_user --password pwd --db dine_pos --out /Users/rianozal/Documents/mongo_bkp_live
// mongorestore -d <database_name> D:\ashok\mongodb\file