// gemini.js — Mitra NammaEco AI module (updated with real Google Maps integration)
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getSupplierSavingsAnalysis } = require('./maps'); // ← real Maps module

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Step 1: Extract income/expense as structured JSON — no regex guessing
async function extractTransactionData(userText) {
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
  const prompt = `
Extract income and expense rupee amounts from this message.
Return ONLY valid JSON like: {"income": 800, "expense": 280}
If no amount found return: {"income": 0, "expense": 0}
Rules:
- Words like "earned", "sold", "aythu", "sampledincome", "sales" → income
- Words like "spent", "bought", "expense", "kharchu", "cost" → expense
- If only one number and no expense context → income
Message: "${userText}"
`;
  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch {
    return { income: 0, expense: 0 };
  }
}

// Step 2: Generate conversational reply in the worker's language
async function parseFinanceAndReply(userMessage, weeklyData, langCode = 'kn') {
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

  const langInstructions = {
    kn: 'Reply in simple spoken Kannada (not formal). Use everyday words.',
    hi: 'Reply in simple spoken Hindi. Use everyday Hindustani words.',
    ta: 'Reply in simple spoken Tamil. Use everyday colloquial words.',
    te: 'Reply in simple spoken Telugu. Use everyday words.',
    en: 'Reply in simple clear English.'
  };

  const langInstruction = langInstructions[langCode] || langInstructions.kn;

  const prompt = `
You are Mitra, a warm and trusted financial friend for informal workers in Bengaluru.
${langInstruction}
Keep replies short — max 4 lines. Use emojis sparingly.

The worker sent: "${userMessage}"

Their data this week:
- Total income: ₹${weeklyData.income}
- Total expenses: ₹${weeklyData.expense}  
- Current profit: ₹${weeklyData.profit}

Instructions:
1. If they shared earning/expense info, acknowledge it warmly.
2. Show their updated weekly total.
3. Give ONE encouraging message.
4. Give ONE practical money tip relevant to their work.

If they ask a general question, answer helpfully.
If they send a greeting, greet back warmly and ask how their day went.
`;

  const maxRetries = 2;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error(`Error in parseFinanceAndReply (attempt ${attempt + 1}):`, error);
      if (error.status === 429 && attempt < maxRetries) {
        const waitTime = (attempt + 1) * 5000; // 5s, 10s
        console.log(`Rate limited, retrying in ${waitTime / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      const errors = {
        kn: '🙏 ಕ್ಷಮಿಸಿ Mitra busy ಆಗಿದೆ. 1 ನಿಮಿಷ ಬಿಟ್ಟು ಮತ್ತೆ message ಮಾಡಿ.',
        hi: '🙏 माफ़ करें, Mitra busy है। 1 मिनट बाद फिर से message करें।',
        ta: '🙏 மன்னிக்கவும், Mitra busy. 1 நிமிடம் கழித்து message செய்யுங்கள்.',
        te: '🙏 క్షమించండి, Mitra busy. 1 నిమిషం తర్వాత message చేయండి.',
        en: '🙏 Sorry, Mitra is busy right now. Please try again in 1 minute.'
      };
      return errors[langCode] || errors.en;
    }
  }
}

async function matchGovernmentSchemes(workerProfile, langCode = 'kn') {
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
  const schemes = require('./schemes.json');

  const langInstructions = {
    kn: 'Write how_to_apply steps in simple Kannada.',
    hi: 'Write how_to_apply steps in simple Hindi.',
    ta: 'Write how_to_apply steps in simple Tamil.',
    te: 'Write how_to_apply steps in simple Telugu.',
    en: 'Write how_to_apply steps in simple English.'
  };

  const prompt = `
Worker profile: ${JSON.stringify(workerProfile)}
Available government schemes: ${JSON.stringify(schemes)}

Match this worker to the top 3 schemes they qualify for.
${langInstructions[langCode] || langInstructions.kn}
Return ONLY valid JSON:
{
  "schemes": [
    {
      "name": "scheme name",
      "benefit": "what they get",
      "how_to_apply": "simple steps"
    }
  ]
}
Return ONLY valid JSON, no other text.
`;
  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/```json/g, '').replace(/```/g, '');
    return JSON.parse(text);
  } catch (error) {
    console.error('Error matching schemes:', error);
    return { schemes: [] };
  }
}

// Crisis-aware empathetic response
async function generateCrisisResponse(userMessage, langCode = 'kn') {
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

  const langInstructions = {
    kn: 'Reply in simple spoken Kannada. Be very warm and empathetic.',
    hi: 'Reply in simple Hindi. Be very warm and empathetic.',
    ta: 'Reply in simple Tamil. Be very warm and empathetic.',
    te: 'Reply in simple Telugu. Be very warm and empathetic.',
    en: 'Reply in simple English. Be very warm and empathetic.'
  };

  const prompt = `
You are Mitra. The worker is going through a crisis (illness, flood, accident, financial emergency).
${langInstructions[langCode] || langInstructions.kn}
Their message: "${userMessage}"

Write a short 2-line empathetic response. Do NOT give financial advice yet.
Just show you care and say you will help.
`;
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch {
    return '😢 ತೊಂದರೆ ಆಗಿದ್ದಕ್ಕೆ ಬೇಜಾರಾಯ್ತು. ನಾನು help ಮಾಡ್ತೀನಿ 🙏';
  }
}

// ─── UPDATED: Supplier savings with real Google Maps data ────────────────────
async function calculateSupplierSavings(userLocation, item, currentPrice, langCode = 'kn') {
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

  const langInstructions = {
    kn: 'Explain in simple Kannada',
    hi: 'Explain in simple Hindi',
    ta: 'Explain in simple Tamil',
    te: 'Explain in simple Telugu',
    en: 'Explain in simple English'
  };

  // Get real market data from Google Maps
  const analysis = await getSupplierSavingsAnalysis({
    lat: userLocation?.lat,
    lng: userLocation?.lng,
    item,
    currentPricePerKg: currentPrice
  });

  const { market, economics, wholesalePrice, savingPerKg, discountRate } = analysis;

  const prompt = `
${langInstructions[langCode] || langInstructions.kn}.
Give a short 4-line supplier savings tip with the math clearly shown:

Item: ${item}
Your current supplier price: ₹${currentPrice}/kg
Nearest wholesale market: ${market.name} (${market.distanceKm}km away${market.durationMin ? `, ~${market.durationMin} min by auto` : ''})
Market wholesale price: ₹${wholesalePrice}/kg (${discountRate}% cheaper)
Saving per kg: ₹${savingPerKg}
Auto fare both ways: ₹${economics.autoFareBothWays}
Break-even quantity: ${economics.breakEvenKg}kg

Show the math simply. End with: worth going only if buying ${economics.breakEvenKg}kg or more in one trip.
Also include the Google Maps directions link: ${market.mapsUrl}
`;

  try {
    const result = await model.generateContent(prompt);
    return {
      text: result.response.text(),
      analysis // pass full analysis back so WhatsApp can send structured info
    };
  } catch {
    return {
      text: `📍 ${market.name} (${market.distanceKm}km): ₹${wholesalePrice}/kg. Auto ₹${economics.autoFareBothWays}. Worth it if buying ${economics.breakEvenKg}kg+.\n🗺️ ${market.mapsUrl}`,
      analysis
    };
  }
}

module.exports = {
  extractTransactionData,
  parseFinanceAndReply,
  matchGovernmentSchemes,
  generateCrisisResponse,
  calculateSupplierSavings
};
