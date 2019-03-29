const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const parseUrlencoded = bodyParser.urlencoded({extended: false});
const parseJSON = bodyParser.json();
const db = require('../database');
const fs = require('fs');

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
                if (insertError) {
                    throw insertError;
                }

                const logData = `${Date.now()} --- vmID: ${vmID}, ccID: ${ccID}, vmConfig: ${vmConfig}, eventType: ${eventType}, timestap: ${timestamp}\n`;
                fs.writeFile('logs/event.log', logData, {
                    flag: 'a'   // open file for appending
                }, function(err) {
                    if (err) {
                        throw err;
                    } else {
                        res.send("posted event successfully");
                    }
                });
            })
        } catch (err) {
            console.log(err);
            res.sendStatus(500);
            res.send(err);
        }
    });


module.exports = router;