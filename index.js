const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

const ENDPOINT_ET = "https://elektrotechnieker-backend-production.up.railway.app/";
const AIRCALL_ROOT = "https://api.aircall.io/v1/";

const api_id = "09b6995dd8b6f94922a2b7f9744aa8aa";
const api_token = "5c25cd93d033e4dc99d87f6b954b33c8";


// base 64 encode for basic auth
const basic_auth = Buffer.from(api_id + ':' + api_token).toString('base64');





app.post('/aircall/webhook', (req, res) => {
    const callData = req.body;
    console.log("callData", callData);



    // const resource = callData.resource;






    res.sendStatus(200);
});




/**
 * Show info card to user on call_id
 */


app.listen(PORT, () => {
    console.log(`Server running at ${PORT}`);
});
