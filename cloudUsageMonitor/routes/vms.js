const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const parseUrlencoded = bodyParser.urlencoded({extended: false});
const parseJSON = bodyParser.json();
const db = require('../database');


router.route('/')
    .get(parseUrlencoded, parseJSON, (req, res) => {

        try {
            db.query('select vms.*, configtype.* from vms join configtype on vms.configTypeID = configtype.configTypeID where active = 1;', (error, results) => {
                if (error) throw error;

                res.send(results);
            })
        } catch (err) {
            console.log(err);
            res.sendStatus(500);
            res.send(err);
        }
    });


module.exports = router;