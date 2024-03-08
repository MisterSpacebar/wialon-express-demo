const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = 3000;

// Replace 'YOUR_WIALON_TOKEN' with your actual Wialon token
const wialonToken = process.env.TOKEN;
const wialonBaseUrl = 'https://hst-api.wialon.us';

app.get('/login', async (req, res) => {
    try {
        const response = await axios.get(`${wialonBaseUrl}/wialon/ajax.html?svc=token/login&params={"token":"${wialonToken}"}`);
        
        if (response.data && response.data.eid)     {
            console.log('Logged in successfully. Session ID:', response.data.eid);
            console.log('Session Data', response.data);
            res.send('Logged in successfully. Check the server console for more details.');
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
        const response = await axios.get(`${wialonBaseUrl}/wialon/ajax.html?svc=core/logout&params={${wialonToken}}`);
        
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

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});