require('dotenv').config();
const axios = require('axios');

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    
    try {
        const response = await axios.get(url);
        console.log("Available Models:", response.data.models.map(m => m.name));
    } catch (error) {
        console.error("List Error:", error.response?.data || error.message);
    }
}

listModels();
