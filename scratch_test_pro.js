require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiPro() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Try gemini-1.0-pro
        const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
        const result = await model.generateContent("Hello!");
        const response = await result.response;
        console.log("Gemini Pro Response:", response.text());
    } catch (error) {
        console.error("Gemini Pro Error:", error.message);
    }
}

testGeminiPro();
