require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini2() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Using Gemini 2.0 Flash as seen in the list
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Hello! Are you working?");
        const response = await result.response;
        console.log("Gemini 2.0 Response:", response.text());
    } catch (error) {
        console.error("Gemini 2.0 Error:", error.message);
    }
}

testGemini2();
