require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Explicitly use v1 instead of v1beta
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: 'v1' });
        const result = await model.generateContent("Hello!");
        const response = await result.response;
        console.log("Gemini Response:", response.text());
    } catch (error) {
        console.error("Gemini Error:", error.message);
    }
}

testGemini();
