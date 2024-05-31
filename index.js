const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

const api_id = "09b6995dd8b6f94922a2b7f9744aa8aa";
const api_token = "5c25cd93d033e4dc99d87f6b954b33c8";

// base 64 encode for basic auth
const basic_auth = Buffer.from(api_id + ':' + api_token).toString('base64');

app.post('/aircall/webhook', async (req, res) => {
    const callData = req.body;
    const event = callData.event;

    if (event == "call.created") {
        const call_id = callData.data.id;
        const digits = callData.data.raw_digits;
        console.log("Call created with call_id " + call_id + " and digits " + digits);

        const info = await searchInfo(digits);

        if (info == undefined || info?.length == 0) {
            console.log("No info found for " + digits);
            res.sendStatus(200);
            return;
        } else {
            console.log("Info found for " + digits);
            info.forEach((element) => {
                createInfoCard(call_id, element);
            });

            // create or update contact in Aircall
            try {
                createOrUpdateContact(info[0]);
            } catch (e) {
                console.log(e);
            }
        }
    }

    res.sendStatus(200);
});

/**
 * Search info at our own back-end
 */
async function searchInfo(call_id) {
    try {
        // Parameters to be sent with the request
        const params = {
            telephone: call_id
        };

        // Create a URLSearchParams object from the params and automatically URL-encode them
        const searchParams = new URLSearchParams(params);
        const baseURL = 'https://elektrotechnieker-backend-production.up.railway.app/tickets/findByTelephone';
        const fullURL = `${baseURL}?${searchParams.toString()}`;

        // call our own back-end
        const response = await axios.get(fullURL, {});
        console.log(JSON.stringify(response.data));

        // example return data:
        // [
        //     {
        //         "id": 2272,
        //         "name": " caby projects BV",
        //         "location": "2620, Hemiksem",
        //         "device": "Beko koel vies comb ",
        //         "status": "request_ticket",
        //         "opdrachtgever": "-"
        //     }
        // ]

        return response.data;
    } catch (e) {
        console.log(e);
    }

    return undefined;
}

/**
 * Show info card to user on call_id
 */
async function createInfoCard(call_id, info_elem) {
    try {
        const response = await axios.post(`https://api.aircall.io/v1/calls/${call_id}/insight_cards`, {
            contents: [
                {
                    type: "title",
                    text: `Ticket ${info_elem?.id}`,
                    link: `https://app.elektrotechnieker.be/dashboard/tickets/${info_elem?.id}/`
                },
                {
                    type: "shortText",
                    label: "Naam",
                    text: info_elem?.name
                },
                {
                    type: "shortText",
                    label: "Locatie",
                    text: info_elem?.location
                },
                {
                    type: "shortText",
                    label: "Toestel",
                    text: `${info_elem?.device}`
                },
                {
                    type: "shortText",
                    label: "Opdrachtgever",
                    text: `${info_elem?.opdrachtgever}`
                }
            ]
        }, {
            headers: {
                Authorization: `Basic ${basic_auth}`
            }
        });

        // console.log(response.data);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

/**
 * Create or update contact in Aircall
 */
// TODO: consider both phone-numbers and the email_adres from the info_elem (send this too from back-end)
// TODO: test if callData.data.contact is null
async function createOrUpdateContact(info_elem, callData) {
    try {

        console.log("callData")
        console.log(callData)

        // retreive aircall contact from callData
        if (callData.data.contact == null) {

            // Create if contact does not exist
            const responseCreate = await axios.post(`https://api.aircall.io/v1/contacts`, {
                first_name: info_elem?.name,
                last_name: info_elem?.opdrachtgever,
                company_name: info_elem?.location,
                information: `Ticket ${info_elem?.id} - ${info_elem?.device}`,
                "phone_numbers": [
                    {
                        "label": "Default",
                        "value": callData.data.raw_digits
                    }
                ],
            }, {
                headers: {
                    Authorization: `Basic ${basic_auth}`
                }
            });

            console.log("Contact creation response:", responseCreate.data);
        } else {
            // Update if contact exists
            const responseUpdate = await axios.put(`https://api.aircall.io/v1/contacts/${callData.data.contact.id}`, {
                first_name: info_elem?.name,
                last_name: info_elem?.opdrachtgever,
                company_name: info_elem?.location,
                information: `Ticket ${info_elem?.id} - ${info_elem?.device}`,
                "phone_numbers": [
                    {
                        "label": "Default",
                        "value": callData.data.raw_digits
                    }
                ],
            }, {
                headers: {
                    Authorization: `Basic ${basic_auth}`
                }
            });
            console.log("Contact update response:", responseUpdate.data);

            return true;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

app.listen(PORT, () => {
    console.log(`Server running at ${PORT}`);
});

// hello world
app.get('/', (req, res) => {
    res.send("Hello World");
});