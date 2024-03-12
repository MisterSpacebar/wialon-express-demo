const express = require('express');
const session = require('express-session');
const axios = require('axios');
const { error } = require('console');
//const wialon = require('wialonjs-api');
require('dotenv').config();

const app = express();
const port = 3000;

// Replace 'YOUR_WIALON_TOKEN' with your actual Wialon token
const wialonToken = process.env.TOKEN;
const wialonBaseUrl = 'https://hst-api.wialon.us';

const secretKey = 'TEST_SECRET_KEY';

app.use(session({
    secret: secretKey, // A secret key used to sign the session ID cookie
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // 'auto' chooses based on the connection type, but explicitly set to true for HTTPS
}));

function errorCheck(e){
    errorList = {
        "-101": '-101: Internal error (network timeout)',
        "-100": '100: Internal error (wrong network response)',
        "0": '0: No error',
        "1": '1: Invalid session',
        "2": '2: Invalid service',
        "3": '3: Invalid result',
        "4": '4: Invalid input',
        "5": '5: Error performing request',
        "6": '6: Unknown error',
        "7": '7: Access denied',
        "8": '8: Invalid user name or password',
        "9": '9: Authorization server is unavailable',
        "10": '10: Reached limit of concurrent requests',
        "11": '11: Password reset error',
        "14": '14: Billing error',
        "1001": '1001: No messages for selected interval',
        "1002": '1002: Item with such unique property already exists or Item cannot be created according to billing restrictions',
        "1003": '1003: reason 1 - Only one request is allowed at the moment, reason 2 - "reason":"LIMIT api_concurrent", reason 3 - "reason":"LAYERS_MAX_COUNT", reason 4 - "reason":"NO_SESSION", reason 5 - "reason":"LOCKER_ERROR"',
        "1004": '1004: Limit of messages has been exceeded',
        "1005": '1005: Execution time has exceeded the limit',
        "1006": '1006: Exceeding the limit of attempts to enter a two-factor authorization code',
        "1011": '1011: Your IP has changed or session has expired',
        "2006": '2006: No possible to transfer unit to this account',
        "2008": '2008: User doesn\'t have access to unit (due transferring to new account)',
        "2014": '2014: Selected user is a creator for some system objects, thus this user cannot be bound to a new account',
        "2015": '2015: Sensor deleting is forbidden because of using in another sensor or advanced properties of the unit'
    }

    if(e == undefined || e == null){
       return "Error code: " + e + " is not found in error list. Check the server console for more details.";
    } else {
        return errorList[e.toString()];
    }
}

app.get('/login', async (req, res) => {
    try {
        const response = await axios.get(`${wialonBaseUrl}/wialon/ajax.html?svc=token/login&params={"token":"${wialonToken}"}`);
        if(response.data.error == undefined){
            console.log("No error on server");
        } else {
            console.log(`server response: ${response.data.error}`);
        }
        if (response.data && response.data.eid)     {
            console.log('Logged in successfully. Session ID:', response.data.eid)
            console.log(response.data);

            req.session.user = {
                // unique session id per login
                session_id: response.data.eid,
                name: response.data.au,
                user_id: response.data.user.id
            };
             req.session.save();

            res.send(`Logged in successfully. Hello, ${req.session.user.name}, check the server console for more details.`);
        } else {
            console.log('Failed to log in:', response.data.error);
            res.send('Failed to log in.  Error code: ' + response.data.error);
        }
    } catch (error) {
        console.error('Error logging into Wialon:', error);
        res.send('Error logging into Wialon.  Error code: ' + error);
    }
});

app.get('/logout',  async (req, res) => {
    console.log(req.session.user.session_id);
    console.log('Logging out of Wialon...');

    try {
        const response = await axios.get(`${wialonBaseUrl}/wialon/ajax.html?svc=core/logout&params={"token":"${wialonToken}"}&sid=${req.session.user.session_id}`);
        console.log(`server response: ${errorCheck(response.data.error)}`);
        if (response.data && response.data.error === 0)     {
            console.log('Logged out successfully.');
            res.send('Logged out successfully. Check the server console for more details.');
        } else {
            console.log('Failed to log out:', response.data);
            res.send('Failed to log out. Check the server console for more details.');
        }
    } catch (error) {
        console.error('Error logging out of Wialon:', error);
        res.send('Error logging out of Wialon.  Error code: ' + errorCheck(error));
    }
});

app.get('/getUnits/:itemid/', async (req, res) => {
    const parameters = {
        id: parseInt(req.params.itemid),
        flags: 1025
    };

    console.log(parameters);
    console.log("session id: "+req.session.user.session_id);
    
    try {
        const response = await axios.get(`${wialonBaseUrl}/wialon/ajax.html?svc=core/search_items&params=${JSON.stringify(parameters)}&sid=${req.session.user.session_id}`);
        console.log(response);
        console.log(`server response: ${errorCheck(response.data.error)}`);
        if (response.data && response.data.error === 0) {
            console.log('Units:', response.data);
            res.send('Units: Check the server console for more details.');
        }
    } catch (error){
        console.error('Error getting units:', error);
        res.send('Error getting units.  Error code: ' + errorCheck(error));
    
    }
});

app.get('/availableUnits', async (req, res) => {
    console.log("session id: "+req.session.user.session_id);

    try {
        const response = await axios.get(`${wialonBaseUrl}/wialon/ajax.html?svc=core/search_items&params={"spec":{"itemsType":"avl_unit","propName":"sys_name","propValueMask":"*100*","sortType":"sys_name"},"force":1,"flags":1,"from":0,"to":0}&sid=${req.session.user.session_id}`);
        console.log(response);
        console.log(`server response: ${errorCheck(response.data.error)}`);
        if (response.data && response.data.error === 0) {
            console.log('Available units:', response.data);
            res.send('Available units: Check the server console for more details.');
        } else {
            console.log('Failed to get available units:', response.data);
            res.send('Failed to get available units.  Error code: ' + response.data.error);
        }

    } catch (error) {
        console.error('Error getting available units:', error);
        res.send('Error getting available units.  Error code: ' + errorCheck(error));
    }
});

app.get('/createUnit/:creator_id/:name/:hw_id/:data_flag/', async (req, res) => {
    const item = {
        "creatorId":parseInt(req.params.creator_id),
        "name":req.params.name,
        "hwTypeId":parseInt(req.params.hw_id),
        "dataFlags":parseInt(req.params.data_flag)
    };

    console.log(req.session.user.session_id);
    let create_unit_url = `${wialonBaseUrl}/wialon/ajax.html?svc=core/create_unit&params={"creatorId":${BigInt(req.params.creator_id)},"name":"${req.params.name.toString()}","hwTypeId":${BigInt(req.params.hw_id)},"dataFlags":${BigInt(req.params.data_flag)}}&sid=${req.session.user.session_id}`;
    console.log('Parameters:', item);
    //let create_unit_url = `${wialonBaseUrl}/wialon/ajax.html?svc=core/create_unit&params=${JSON.stringify(item)}&sid=${req.session.user.session_id}`;
    console.log(create_unit_url);

    try {
        console.log(req.session.user.session_id);
        // `${wialonBaseUrl}/wialon/ajax.html?svc=core/create_unit&params=${JSON.stringify(item)}&sid=${req.session.user.session_id}
        const response = await axios.get(create_unit_url);
        console.log(response);
        if(response.data.error){
            console.log(`server response: ${errorCheck(response.data.error)}`);
        } else {
            console.log(`server response error: ${response.data.error}`);
        }
        if (response.data && response.data.error === 0) {
            console.log('Unit created:', response.data);
            res.send('Unit created: Check the server console for more details.');
        }
    } catch (error){    
        console.error('Error creating unit:', error);
        res.send('Error creating unit. Check the server console for more details.');
    }
});

app.get('/deleteUnit/:unit_id/', async (req, res) => {
    console.log(req.session.user.session_id);
    try{
        const response = await axios.get(`${wialonBaseUrl}/wialon/ajax.html?svc=core/delete_item&params={"itemId":${parseInt(req.params.unit_id)}}&sid=${req.session.user.session_id}`);
        console.log(response);
        console.log(`server response: ${errorCheck(response.data.error)}`);

        if (response.data && response.data.error === 0) {
            try {
                const response = await axios.get(`${wialonBaseUrl}/wialon/ajax.html?svc=core/search_item&params={"id":${parseInt(req.params.unit_id)},"flags":1}&sid=${req.session.user.session_id}`);
                if (response.data && response.data.error === 7) {
                    console.log('Unit deleted:', response.data);
                    res.send('Unit deleted: Check the server console for more details.');
                }
            } catch (error) {
                console.error('Error deleting unit:', error);
                res.send('Error deleting unit. Check the server console for more details.');
            }
            console.log('Unit deleted:', response.data);
            res.send('Unit deleted: Check the server console for more details.');
        }
    } catch (error){
        console.error('Error deleting unit:', error);
        res.send('Error deleting unit. Check the server console for more details.');
    }
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});