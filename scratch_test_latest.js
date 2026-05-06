require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiLatest() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Using gemini-flash-latest which is in the list
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const result = await model.generateContent("Hello!");
        const response = await result.response;
        console.log("Gemini Latest Response:", response.text());
    } catch (error) {
        console.error("Gemini Latest Error:", error.message);
    }
}

testGeminiLatest();
