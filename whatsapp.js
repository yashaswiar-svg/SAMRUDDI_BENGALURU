const axios = require('axios');

async function sendMessage(phone, text) {
    const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`;
    
    const data = {
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body: text }
    };

    const headers = {
        'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
    };

    try {
        const response = await axios.post(url, data, { headers });
        return response.data;
    } catch (error) {
        console.error("Error sending WhatsApp message:", error.response ? error.response.data : error.message);
        throw error;
    }
}

module.exports = { sendMessage };
