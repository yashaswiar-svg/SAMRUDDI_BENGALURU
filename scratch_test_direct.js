require('dotenv').config();
const axios = require('axios');

async function testDirect() {
    const key = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    
    const data = {
        contents: [{ parts: [{ text: "Hello" }] }]
    };

    try {
        const response = await axios.post(url, data);
        console.log("Direct Response:", response.data.candidates[0].content.parts[0].text);
    } catch (error) {
        console.error("Direct Error Status:", error.response?.status);
        console.error("Direct Error Body:", JSON.stringify(error.response?.data, null, 2));
    }
}

testDirect();
