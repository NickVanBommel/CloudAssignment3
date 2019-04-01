const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const parseUrlencoded = bodyParser.urlencoded({extended: false});
const parseJSON = bodyParser.json();
const db = require('../database');

const axios = require('axios');
const usageMonitorEndpt = process.env.USAGE_MONITOR_ENDPOINT;

router.route('/usage/:vmId')
    .get(parseUrlencoded, parseJSON, (req, res) => {
        try {
            axios.get('http://10.0.0.7:80/api/events/usage/' + req.params.vmId, { params: { startDatetime: req.query.startDatetime, endDatetime: req.query.endDatetime } })
			.then(function (resp) {
				console.log(resp.data);
				res.send(resp.data);
			}).catch(function (error) {
				throw error;
			});
        } catch (err) {
            console.log(err);
            res.send(err);
        }
});

router.route('/cost/:ccid')
    .get(parseUrlencoded, parseJSON, (req, res) => {
        try {
			axios.get('http://10.0.0.7:80/api/events/cost/' + req.params.ccid)
			.then(function (resp) {
				console.log(resp.data);
				res.send(resp.data);
			}).catch(function (error) {
				throw error;
			});
        } catch (err) {
            console.log(err);
            res.send(err);
        }
});

module.exports = router;