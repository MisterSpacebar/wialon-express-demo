const express = require('express');
const session = require('express-session');
const axios = require('axios');
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

app.get('/login', async (req, res) => {
    try {
        const response = await axios.get(`${wialonBaseUrl}/wialon/ajax.html?svc=token/login&params={"token":"${wialonToken}"}`);
        
        if (response.data && response.data.eid)     {
            console.log('Logged in successfully. Session ID:', response.data.eid)

            req.session.user = {
                // unique sessin id per login
                session_id: response.data.eid,
                name: response.data.au
            };

            res.send(`Logged in successfully. Hello, ${req.session.user.name}, check the server console for more details.`);
        } else {
            console.log('Failed to log in:', response.data);
            res.send('Failed to log in. Check the server console for more details.');
        }
    } catch (error) {
        console.error('Error logging into Wialon:', error);
        res.send('Error logging into Wialon. Check the server console for more details.');
    }
});

app.get('/logout',  async (req, res) => {
    try {
        const response = await axios.get(`${wialonBaseUrl}/wialon/ajax.html?svc=core/logout&params={"token":"${wialonToken}"}`);
        
        if (response.data && response.data.error === 0)     {
            console.log('Logged out successfully.');
            res.send('Logged out successfully. Check the server console for more details.');
        } else {
            console.log('Failed to log out:', response.data);
            res.send('Failed to log out. Check the server console for more details.');
        }
    } catch (error) {
        console.error('Error logging out of Wialon:', error);
        res.send('Error logging out of Wialon. Check the server console for more details.');
    }
});

app.get('/getUnits/:itemid', async (req, res) => {
    const parameters = {
        session_id: parseInt(req.params.itemid),
        flags: 1025
    };
    const sid = req.session.user.id;
    
    try {
        const response = await axios.get(`${wialonBaseUrl}/wialon/ajax.html?svc=core/search_items&params=${parameters}&sid=${sid}`);
        if (response.data && response.data.error === 0) {
            console.log('Units:', response.data);
            res.send('Units: Check the server console for more details.');
        }
    } catch (error){
        console.error('Error getting units:', error);
        res.send('Error getting units. Check the server console for more details.');
    
    }
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});