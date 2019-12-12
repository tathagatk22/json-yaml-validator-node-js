var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var multer = require('multer');
var fs = require('fs');
var yaml = require('js-yaml');
var download_folder = '' //update the download folder
var payloadChecker = require('payload-validator');
var cmd = require('node-command-line'),
  Promise = require('bluebird');
// this is an example of expected json format which is needed from user 
var expectedPayload = {
    "kind": "Config",
    "apiVersion": "v1",
    "clusters": [{
        "name": "",
        "cluster": {
            "certificate-authority-data": "",
            "server": "",
        },
    }],
    "contexts": [{
        "name": "",
        "context": {
            "cluster": "",
            "user": "",
        },
    }],
    "current-context": "",
    "users": [{
        "name": "",
        "user": {
            "client-certificate-data": "",
            "client-key-data": "",
        },
    }]
};

app.use(function (req, res, next) { //allow cross origin requests
    res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

/** Serving from the same express Server
No cors required */
app.use(express.static('../client'));
app.use(bodyParser.json());
var filename;
var storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        // destination of file storage can be changed
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {

        cb(null, file.originalname);
        filename = file.originalname;
    }
});


var upload = multer({ //multer settings
    storage: storage
}).single('file');

/** API path that will upload the files */
app.post('/upload', function (req, res) {

    upload(req, res, function (err) {
        if (err) {
            //return ERROR
            res.json({ error_code: 1, err_desc: err });
            return;
        } else {
            var obj;
            var count = 0;
          // if file uploaded is json
            fs.readFile(download_folder + filename, 'utf8', function (err, data) {
                try {
                    if (err) throw err;
                    obj = JSON.parse(data);
                     // expected payload if not found returns error and kind, apiVersion, current-context are those parameters which are mandatory, if not found returns error,more or less parameters can be added 
                    var result = payloadChecker.validator(obj, expectedPayload, ["kind", "apiVersion", "current-context"], false);
                    if (result.success) {
                        count = 1;
                        cmd.run('node --version');
                        //return SUCCESS
                        res.json({ error_code: 0, err_desc: null });
                        return
                    }
                } catch (err) {
                }
                if (count == 0) {
                  // if file uploaded is yaml  
                  try {
                        var doc = yaml.safeLoad(fs.readFileSync(download_folder + filename, 'utf8'));
                        // expected payload if not found returns error and kind, apiVersion, current-context are those parameters which are mandatory, if not found returns error,more or less parameters can be added 
                        var result = payloadChecker.validator(doc, expectedPayload, ["kind", "apiVersion", "current-context"], false);
                        if (result.success) {
                            cmd.run('node --version');
                            //return SUCCESS
                            res.json({ error_code: 0, err_desc: null });
                            return
                        }
                    }
                    catch (err) {
                      // will delete the file if the file does not meet the expected json  
                      fs.unlink(download_folder + filename, function (err) {
                            if (err) {
                                console.error(err.toString());
                            } else {
                                // console.warn('deleted');
                            }
                        });
                        //return ERROR
                        res.json({ error_code: 1, err_desc: err });
                        return;
                    }
                }
                // will delete the file if the file does not meet the expected json
                fs.unlink(download_folder + filename, function (err) {
                    if (err) {
                        console.error(err.toString());
                    } else {
                        // console.warn('deleted');
                    }
                });
                //return ERROR
                res.json({ error_code: 1, err_desc: err });
                return;
            });
        }
    });
});

app.listen('3000', function () {
    console.log('running on 3000...');
});
