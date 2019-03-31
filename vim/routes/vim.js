const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const parseUrlencoded = bodyParser.urlencoded({extended: false});
const parseJSON = bodyParser.json();
const db = require('../database');

const axios = require('axios');
const usageMonitorEndpt = process.env.USAGE_MONITOR_ENDPOINT;

const VIMEvent = require('../classes/vimEvent');

router.route('/login')
    .post(parseUrlencoded, parseJSON, (req, res) => {
        try {
            if (!req.body.username) {
                res.sendStatus(401);
                throw new Error('Username must be provided');
            }
            if (!req.body.password) {
                res.sendStatus(401);
                throw new Error('Password must be provided');
            }

            db.query('SELECT * FROM users WHERE username = ?', req.body.username, (error, result) => {
                if (error) {
                    throw error;
                } else {
                    if (result.length > 0 && result[0].password === req.body.password) {
                        res.render("pages/home",{ccID: result[0].userID});
                    } else {
                        res.sendStatus(401);  // No user with that username was found or the password was wrong, so return 401 unauthorized
                    }
                }
            });
        } catch (err) {
            console.log(err);
            res.send(err);
        }
    });

router.route('/create')
    .put(parseUrlencoded, parseJSON, (req, res) => {
        try {
            const params = [true, true];                    // First parameters set the VM as active and on
            if (req.body.template === 'UltraLarge') {       // Convert incoming template name into an ID and validate
                params.push(2);
            } else if (req.body.template === 'Large') {
                params.push(1);
            } else if (req.body.template === 'Basic') {
                params.push(0);
            } else {
                throw new Error(`Unsupported VM template '${req.body.template}'`);
            }

            if (!req.body.ccID) {                           // Validate incoming ccID
                throw new Error('Cloud Consumer ID must be provided');
            }

            db.query('INSERT INTO vms (active, turnedOn, configTypeID) VALUES (?, ?, ?)', params, (error, result, fields) => {
                if (error) {
                    throw error;
                } else {
                    const event = new VIMEvent(
                        result.insertId,
                        req.body.ccID,
                        params[1],
                        'create',
                        new Date(Date.now())
                    );

                    axios.post(usageMonitorEndpt, {
                        vmID: event.vmID,
                        ccID: event.ccID,
                        vmConfig: event.vmConfig,
                        eventType: event.eventType,
                        timestamp: event.timestamp
                    }).then(function (resp) {
                        console.log(resp.status);
                    }).catch(function (error) {
                        console.log(error);
                    });

                    res.render("pages/home", {ccID: req.body.ccID});
                    console.log("Status: 200 OK")
                }
            });
        } catch (err) {
            console.log(err);
            res.send("error trying to insert into vms " + err);
        }
    });

router.route('/start')
    .put(parseUrlencoded, parseJSON, (req, res) => {
        try {
            if (!req.body.vmID) {                           // Validate incoming vmID
                throw new Error('VM ID must be provided');
            }
            if (!req.body.ccID) {                           // Validate incoming ccID
                throw new Error('Cloud Consumer ID must be provided');
            }

            const updateParams = [true, req.body.vmID];     // Parameters set the vm as active

            db.query('UPDATE vms SET turnedOn = ? WHERE VMID = ?', updateParams, (updateError, updateResult) => {
                if (updateError) {
                    throw updateError;
                } else {
                    if (updateResult.affectedRows > 0) {
                        // VM was updated, now get the extra info needed for the event
                        const selectParams = [req.body.vmID];
                        db.query('SELECT * FROM vms WHERE VMID = ?', selectParams, (selectError, selectResult) => {
                            if (selectError) {
                                throw selectError;
                            } else {
                                const event = new VIMEvent(
                                    req.body.vmID,
                                    req.body.ccID,
                                    selectResult[0].configTypeID,
                                    'start',
                                    new Date(Date.now())
                                );
            
                                axios.post(usageMonitorEndpt, {
                                    vmID: event.vmID,
                                    ccID: event.ccID,
                                    vmConfig: event.vmConfig,
                                    eventType: event.eventType,
                                    timestamp: event.timestamp
                                }).then(function (resp) {
                                    console.log(resp.status);
                                }).catch(function (error) {
                                    console.log(error);
                                });
                                
                                res.render("pages/home", {ccID: req.body.ccID});
                            }
                        });
                    } else {
                        res.sendStatus(404);  // Return a 404 error if the VM couldn't be found
                    }
                }
            });
        } catch (err) {
            console.log(err);
            res.send(err);
        }
    });

router.route('/stop')
    .put(parseUrlencoded, parseJSON, (req, res) => {
        try {
            if (!req.body.vmID) {                           // Validate incoming vmID
                throw new Error('VM ID must be provided');
            }
            if (!req.body.ccID) {                           // Validate incoming ccID
                throw new Error('Cloud Consumer ID must be provided');
            }

            const updateParams = [false, req.body.vmID];    // Parameters set the VM as inactive

            db.query('UPDATE vms SET turnedOn = ? WHERE VMID = ?', updateParams, (updateError, updateResult) => {
                if (updateError) {
                    throw updateError;
                } else {
                    if (updateResult.affectedRows > 0) {
                        // VM was updated, now get the extra info needed for the event
                        const selectParams = [req.body.vmID];
                        db.query('SELECT * FROM vms WHERE VMID = ?', selectParams, (selectError, selectResult) => {
                            if (selectError) {
                                throw selectError;
                            } else {
                                const event = new VIMEvent(
                                    req.body.vmID,
                                    req.body.ccID,
                                    selectResult[0].configTypeID,
                                    'stop',
                                    new Date(Date.now())
                                );
            
                                axios.post(usageMonitorEndpt, {
                                    vmID: event.vmID,
                                    ccID: event.ccID,
                                    vmConfig: event.vmConfig,
                                    eventType: event.eventType,
                                    timestamp: event.timestamp
                                }).then(function (resp) {
                                    console.log(resp.status);
                                }).catch(function (error) {
                                    console.log(error);
                                });

                                res.render("pages/home", {ccID: req.body.ccID});
                            }
                        });
                    } else {
                        res.sendStatus(404);  // Return a 404 error if the VM couldn't be found
                    }
                }
            });
        } catch (err) {
            console.log(err);
            res.send(err);
        }
    });

router.route('/delete')
    .delete(parseUrlencoded, parseJSON, (req, res) => {
        try {
            if (!req.body.vmID) {                           // Validate incoming vmID
                throw new Error('VM ID must be provided');
            }
            if (!req.body.ccID) {                           // Validate incoming ccID
                throw new Error('Cloud Consumer ID must be provided');
            }

            const updateParams = [false, req.body.vmID];    // Parameters set the VM as inactive

            db.query('UPDATE vms SET active = ? WHERE VMID = ?', updateParams, (updateError, updateResult) => {
                if (updateError) {
                    throw updateError;
                } else {
                    if (updateResult.affectedRows > 0) {
                        // VM was updated, now get the extra info needed for the event
                        const selectParams = [req.body.vmID];
                        db.query('SELECT * FROM vms WHERE VMID = ?', selectParams, (selectError, selectResult) => {
                            if (selectError) {
                                throw selectError;
                            } else {
                                const event = new VIMEvent(
                                    req.body.vmID,
                                    req.body.ccID,
                                    selectResult[0].configTypeID,
                                    'delete',
                                    new Date(Date.now())
                                );
            
                                axios.post(usageMonitorEndpt, {
                                    vmID: event.vmID,
                                    ccID: event.ccID,
                                    vmConfig: event.vmConfig,
                                    eventType: event.eventType,
                                    timestamp: event.timestamp
                                }).then(function (resp) {
                                    console.log(resp.status);
                                }).catch(function (error) {
                                    console.log(error);
                                });

                                res.render("pages/home", {ccID: req.body.ccID});
                            }
                        });
                    } else {
                        res.sendStatus(404);  // Return a 404 error if the VM couldn't be found
                    }
                }
            });
        } catch (err) {
            console.log(err);
            res.send(err);
        }
    });

router.route('/upgrade')
    .put(parseUrlencoded, parseJSON, (req, res) => {
        try {
            if (!req.body.vmID) {   // Validate incoming vmID
                throw new Error('VM ID must be provided');
            }
            if (!req.body.ccID) {   // Validate incoming ccID
                throw new Error('Cloud Consumer ID must be provided');
            }

            db.query('SELECT * FROM vms WHERE VMID = ?', req.body.vmID, (selectError, selectResult) => {
                if (selectError) {
                    throw selectError;
                } else {
                    if (selectResult.length > 0) {
                        // Now that the VM is confirmed to exist, figure out the upgraded config and update it
                        let newConfigID = Math.min(selectResult[0].configTypeID + 1, 3);
                        const updateParams = [newConfigID, req.body.vmID];

                        db.query('UPDATE vms SET configTypeID = ? WHERE VMID = ?', updateParams, (updateError, updateResult) => {
                            if (updateError) {
                                throw updateError;
                            } else {
                                const event = new VIMEvent(
                                    req.body.vmID,
                                    req.body.ccID,
                                    newConfigID,
                                    'upgrade',
                                    new Date(Date.now())
                                );

                                axios.post(usageMonitorEndpt, {
                                    vmID: event.vmID,
                                    ccID: event.ccID,
                                    vmConfig: event.vmConfig,
                                    eventType: event.eventType,
                                    timestamp: event.timestamp
                                }).then(function (resp) {
                                    console.log(resp.status);
                                }).catch(function (error) {
                                    console.log(error);
                                });
                                
                                res.render("pages/home", {ccID: req.body.ccID});
                            }
                        });
                    } else {
                        res.sendStatus(404);  // Return 404 if the VM couldn't be found
                    }
                }
            });
        } catch (err) {
            console.log(err);
            res.send(err);
        }
    });

router.route('/downgrade')
    .put(parseUrlencoded, parseJSON, (req, res) => {
        try {
            if (!req.body.vmID) {   // Validate incoming vmID
                throw new Error('VM ID must be provided');
            }
            if (!req.body.ccID) {   // Validate incoming ccID
                throw new Error('Cloud Consumer ID must be provided');
            }

            db.query('SELECT * FROM vms WHERE VMID = ?', req.body.vmID, (selectError, selectResult) => {
                if (selectError) {
                    throw selectError;
                } else {
                    if (selectResult.length > 0) {
                        // Now that the VM is confirmed to exist, figure out the downgraded config and update it
                        let newConfigID = Math.max(selectResult[0].configTypeID - 1, 1);
                        const updateParams = [newConfigID, req.body.vmID];

                        db.query('UPDATE vms SET configTypeID = ? WHERE VMID = ?', updateParams, (updateError, updateResult) => {
                            if (updateError) {
                                throw updateError;
                            } else {
                                const event = new VIMEvent(
                                    req.body.vmID,
                                    req.body.ccID,
                                    newConfigID,
                                    'downgrade',
                                    new Date(Date.now())
                                );

                                axios.post(usageMonitorEndpt, {
                                    vmID: event.vmID,
                                    ccID: event.ccID,
                                    vmConfig: event.vmConfig,
                                    eventType: event.eventType,
                                    timestamp: event.timestamp
                                }).then(function (resp) {
                                    console.log(resp.status);
                                }).catch(function (error) {
                                    console.log(error);
                                });
                                
                                res.render("pages/home", {ccID: req.body.ccID});
                            }
                        });
                    } else {
                        res.sendStatus(404);  // Send 404 error if the VM couldn't be found
                    }
                }
            });
        } catch (err) {
            console.log(err);
            res.send(err);
        }
    });

module.exports = router;