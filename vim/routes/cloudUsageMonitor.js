const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const parseUrlencoded = bodyParser.urlencoded({extended: false});
const parseJSON = bodyParser.json();
const db = require('../database');

/* 
    vmID
    ccID
    vmConfig
    eventType
    timestamp
*/

router.route('/')
    .post(parseUrlencoded, parseJSON, (req, res) => {

        var vmID = req.body.vmID;
        var ccID = req.body.ccID;
        var vmConfig = req.body.vmConfig;
        var eventType = req.body.eventType;
        var timestamp = req.body.timestamp;

        var eventParams = [vmID, ccID, vmConfig, eventType, timestamp];

        try {
            db.query('INSERT INTO events (VMID, userID, VMConfigTypeID, eventType, eventTimeStamp) VALUES (?, ?, ?, ?, ?)', eventParams, (insertError, insertResult) => {
                if (insertError) throw insertError;
                res.send("posted even successfully");
            })
        } catch (err) {
            console.log(err);
            res.sendStatus(500);
            res.send(err);
        }
    });


module.exports = router;