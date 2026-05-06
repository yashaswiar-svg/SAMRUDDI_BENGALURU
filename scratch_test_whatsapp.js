require('dotenv').config();
const { sendMessage } = require('./whatsapp');

async function testWhatsApp() {
    try {
        // Use a test phone number or the user's phone number if known
        // But I don't know the user's phone number.
        // I'll just check if the function doesn't throw a "Phone ID not found" or "Invalid Token" error immediately.
        const result = await sendMessage('1234567890', 'Test message from Mitra');
        console.log("WhatsApp Result:", result);
    } catch (error) {
        console.error("WhatsApp Error:", error.message);
    }
}

testWhatsApp();
