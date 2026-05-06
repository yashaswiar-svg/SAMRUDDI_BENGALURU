require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Say 'Gemini is working!' if you can hear me.");
        const response = await result.response;
        console.log("Gemini Response:", response.text());
    } catch (error) {
        console.error("Gemini Error:", error.message);
    }
}

testGemini();
