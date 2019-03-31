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
            axios.get('10.0.0.7/api/events/usage/' + req.params.vmId)
			.then(function (resp) {
				console.log(resp);
				res.send(resp);
			}).catch(function (error) {
				console.log(error);
			});
        } catch (err) {
            console.log(err);
            res.send(err);
        }
});

router.route('/cost/:ccid')
    .get(parseUrlencoded, parseJSON, (req, res) => {
        try {
			axios.get('10.0.0.7/api/events/cost/' + req.params.ccid)
			.then(function (resp) {
				console.log(resp);
				res.send(resp);
			}).catch(function (error) {
				console.log(error);
			});
        } catch (err) {
            console.log(err);
            res.send(err);
        }
});

function getCost(results)
{
    var vmCostResults = [];

    if (results.length == 0)
    {
        return vmCostResults;
    }

    var activeVM = results[0].VMID;
    
    var basicCost = 0;
    var largeCost = 0;
    var ultraLargeCost = 0;

    for(var i = 1; i < results.length; i++)
    {
        // we have moved onto another VM
        if (activeVM != results[i].VMID)
        {
            // do stuff to finish up work on previous vm

            // check to see if the VM is still running
            if (results[i - 1].eventType != "stop"
            || results[i - 1].eventType != "delete")
            {        
                var configtype = results[i - 1].configName;
                var datetime1 = results[i - 1].eventTimeStamp.getTime();
                var datetime2 = Date.now();
                var minuteDifference = Math.round((datetime2 - datetime1) / 60000);
        
                if (configtype == "Basic")
                {
                    basicCost += minuteDifference * results[i - 1].costPerMinute;
                }
                else if(configtype == "Large")
                {
                    largeCost += minuteDifference * results[i - 1].costPerMinute;
                }
                else if(configtype == "UltraLarge")
                {
                    ultraLargeCost += minuteDifference * results[i - 1].costPerMinute;
                }
            }

            vmCostResults.push({VMID: activeVM, Basic: basicCost/100, Large: largeCost/100, UltraLarge: ultraLargeCost/100});
            basicCost = 0;
            largeCost = 0;
            ultraLargeCost = 0;
            activeVM = results[i].VMID
            continue;
        }

        // if we are continuing to calculate usage for the same VM

        // if we are just starting the VM up then we don't have any usage to track
        // if the previous event was to stop the VM then we don't track the time between that event and this one
        if (results[i].eventType == "start"
        || results[i].eventType == "create"
        || results[i - 1].eventType == "stop")
        {
            continue;
        }

        var datetime1 = results[i - 1].eventTimeStamp.getTime();
        var datetime2 = results[i].eventTimeStamp.getTime();
        var minuteDifference = Math.round((datetime2 - datetime1) / 60000);

        var configtype = results[i].configName;
        var costMetric  = results[i - 1].costPerMinute
        // if we are upgrading or downgrading we grab the
        // config type of the previous event to track how long we were
        // at that config type
        if (results[i].eventType == "upgrade"
        || results[i].eventType == "downgrade")
        {
            configtype = results[i - 1].configName;
        }

        if (configtype == "Basic")
        {
            basicCost += minuteDifference * costMetric;
        }
        else if(configtype == "Large")
        {
            largeCost += minuteDifference * costMetric;
        }
        else if(configtype == "UltraLarge")
        {
            ultraLargeCost += minuteDifference * costMetric;
        }
    }

    // now we check if the lasgt event in the DB leaves a VM still running at the time we are requesting costs
    
    //Add a check for if the VM is still active to compute last bit of time
    if (results[results.length - 1].eventType != "stop"
    || results[results.length - 1].eventType != "delete")
    {        
        var configtype = results[results.length - 1].configName;
        var datetime1 = results[results.length - 1].eventTimeStamp.getTime();
        var datetime2 = Date.now();
        var minuteDifference = Math.round((datetime2 - datetime1) / 60000);
        var costMetric  = results[i - 1].costPerMinute

        if (configtype == "Basic")
        {
            basicCost += minuteDifference * costMetric;
        }
        else if(configtype == "Large")
        {
            largeCost += minuteDifference * costMetric;
        }
        else if(configtype == "UltraLarge")
        {
            ultraLargeCost += minuteDifference * costMetric;
        }

        vmCostResults.push({VMID: activeVM, Basic: basicCost/100, Large: largeCost/100, UltraLarge: ultraLargeCost/100});
    }

    return vmCostResults;
}

function getVMUsage(results)
{
    var basicUsage = 0;
    var largeUsage = 0;
    var ultraLargeUsage = 0;

    // if there are no records for this then just return
    if (results.length == 0)
    {
        return {Basic: basicUsage, Large: largeUsage, UltraLarge: ultraLargeUsage};
    }

    // if there is just one result then the VM must
    // still be running in its original config
    if (results.length == 1)
    {
        var configtype = results[0].configName;
        var datetime1 = results[0].eventTimeStamp.getTime();
        var datetime2 = Date.now();
        var minuteDifference = Math.round((datetime2 - datetime1) / 60000);

        if (configtype == "Basic")
        {
            basicUsage += minuteDifference;
        }
        else if(configtype == "Large")
        {
            largeUsage += minuteDifference;
        }
        else if(configtype == "UltraLarge")
        {
            ultraLargeUsage += minuteDifference;
        }
    }

    for(var i = 1; i < results.length; i++)
    {
        // if we are just starting the VM up then we don't have any usage to track
        // if the previous event was to stop the VM then we don't track the time between that event and this one
        if (results[i].eventType == "start"
        || results[i].eventType == "create"
        || results[i - 1].eventType == "stop")
        {
            continue;
        }

        var datetime1 = results[i - 1].eventTimeStamp.getTime();
        var datetime2 = results[i].eventTimeStamp.getTime();
        var minuteDifference = Math.round((datetime2 - datetime1) / 60000);

        var configtype = results[i].configName;

        // if we are upgrading or downgrading we grab the
        // config type of the previous event to track how long we were
        // at that config type
        if (results[i].eventType == "upgrade"
        || results[i].eventType == "downgrade")
        {
            configtype = results[i - 1].configName;
        }

        if (configtype == "Basic")
        {
            basicUsage += minuteDifference;
        }
        else if(configtype == "Large")
        {
            largeUsage += minuteDifference;
        }
        else if(configtype == "UltraLarge")
        {
            ultraLargeUsage += minuteDifference;
        }
    }

    //Add a check for if the VM is still active to compute last bit of time
    if (results[results.length - 1].eventType != "stop"
    || results[results.length - 1].eventType != "delete")
    {        
        var configtype = results[results.length - 1].configName;
        var datetime1 = results[results.length - 1].eventTimeStamp.getTime();
        var datetime2 = Date.now();
        var minuteDifference = Math.round((datetime2 - datetime1) / 60000);

        if (configtype == "Basic")
        {
            basicUsage += minuteDifference;
        }
        else if(configtype == "Large")
        {
            largeUsage += minuteDifference;
        }
        else if(configtype == "UltraLarge")
        {
            ultraLargeUsage += minuteDifference;
        }
    }
    return {Basic: basicUsage, Large: largeUsage, UltraLarge: ultraLargeUsage};
}

module.exports = router;