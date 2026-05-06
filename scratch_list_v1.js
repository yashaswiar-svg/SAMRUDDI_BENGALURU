require('dotenv').config();
const axios = require('axios');

async function listModelsV1() {
    const key = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${key}`;
    
    try {
        const response = await axios.get(url);
        console.log("Available Models (v1):", response.data.models.map(m => m.name));
    } catch (error) {
        console.error("List Error (v1):", error.response?.data || error.message);
    }
}

listModelsV1();
