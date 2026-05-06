// Mitra Multi-Language Support
// Supported: Kannada (kn), Hindi (hi), Tamil (ta), Telugu (te), English (en)

const STRINGS = {
  'kn': {
    code: 'kn',
    name: 'ಕನ್ನಡ',
    speechCode: 'kn-IN',
    greeting: 'ನಮಸ್ಕಾರ! ನಾನು ಮಿತ್ರ. ನಿಮ್ಮ ಉಚಿತ ಆರ್ಥಿಕ ಸ್ನೇಹಿತ. ನೀವು ಏನು ಮಾರ್ತೀರಾ?',
    askIncome: 'ಚೆನ್ನಾಗಿದೆ! ದಿನಕ್ಕೆ ಎಷ್ಟು ಸಂಪಾದಿಸ್ತೀರಾ ಸರಿ ಸುಮಾರು?',
    onboardingDone: (name) => `ತುಂಬಾ ಒಳ್ಳೆಯದು ${name || ''}! ಪ್ರತಿ ದಿನ ನೀವು ಮೆಸೇಜ್ ಮಾಡಿದ್ರೆ ನಾನು ನಿಮ್ಮ profit ಟ್ರ್ಯಾಕ್ ಮಾಡ್ತೀನಿ, savings help ಮಾಡ್ತೀನಿ, loan ready ಮಾಡ್ತೀನಿ. ಶುರು ಮಾಡೋಣ? 😊`,
    voiceReceived: '⏳ ನಿಮ್ಮ ಧ್ವನಿ ಕೇಳುತ್ತಿದ್ದೇನೆ...',
    voiceError: 'ಕ್ಷಮಿಸಿ, ನನಗೆ ಅರ್ಥವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಕಳಿಸಿ 🙏',
    error: 'ಕ್ಷಮಿಸಿ, ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.',
    rainMessage: '🌧️ ಮಳೆ ಬಂದಿದೆ — ರೆಸ್ಟ್ ತಗೋ. ನಾಳೆ ಒಳ್ಳೆಯದಾಗುತ್ತೆ 🙏',
    crisisMessage: '😢 ತೊಂದರೆ ಆಗಿದ್ದಕ್ಕೆ ಬೇಜಾರಾಯ್ತು. ನಾನು help ಮಾಡ್ತೀನಿ. ಮೊದಲು ಈ schemes ನೋಡಿ:',
    dailyPulse: (name) => `${name}, ಇವತ್ತು ಹೇಗಿತ್ತು? ಏನು ಮಾಡ್ದ್ರಿ? 😊`,
    streakWarning: (name, days) => `${name}, ${days} ದಿನ ಆಯ್ತು — ನಾಳೆ ಒಂದು note ಮಾಡಿ 🙏`,
    creditReady: '🎉 ಅಭಿನಂದನೆ! ನೀವು ಲೋನ್ ಗೆ ready ಆಗಿದ್ದೀರಾ!',
    creditProgress: (days, remaining) => `${days} ದಿನ track ಮಾಡಿದ್ದೀರಾ. ${remaining} ದಿನ ಇನ್ನೂ ಬೇಕು.`,
    schoolFeeGoal: (fees, weekly) => `📚 June 1 ಶಾಲೆ fees ಬರುತ್ತೆ. ₹${fees} ಬೇಕು. ಈ 12 ವಾರ ₹${weekly} ಉಳಿಸಿದ್ರೆ ready ಆಗುತ್ತೆ. ನಾನು track ಮಾಡಲಾ?`,
    festivalAlert: (festival) => `🎉 ${festival} ಬರ್ತಿದೆ — stock ಜಾಸ್ತಿ ಮಾಡ್ಕೋ, ಬೆಲೆ ಜಾಸ್ತಿ ಸಿಗುತ್ತೆ!`,
    languageSet: 'ಕನ್ನಡ set ಆಯ್ತು! ಇನ್ನು ನಾನು ಕನ್ನಡದಲ್ಲಿ ಮಾತಾಡ್ತೀನಿ. 😊',
    askLanguage: 'ನಿಮ್ಮ ಭಾಷೆ ಆರಿಸಿ:\n1️⃣ ಕನ್ನಡ\n2️⃣ हिंदी\n3️⃣ தமிழ்\n4️⃣ తెలుగు\n5️⃣ English',
  },
  'hi': {
    code: 'hi',
    name: 'हिंदी',
    speechCode: 'hi-IN',
    greeting: 'नमस्ते! मैं मित्र हूँ। आपका मुफ्त आर्थिक दोस्त। आप क्या बेचते हैं?',
    askIncome: 'बहुत अच्छा! रोज़ लगभग कितना कमाते हैं?',
    onboardingDone: (name) => `बढ़िया ${name || ''}! हर दिन message करें, मैं आपका profit track करूँगा, savings में help करूँगा, loan ready करूँगा। शुरू करें? 😊`,
    voiceReceived: '⏳ आपकी आवाज़ सुन रहा हूँ...',
    voiceError: 'माफ़ कीजिए, समझ नहीं आया। कृपया फिर से भेजें 🙏',
    error: 'माफ़ कीजिए, कृपया फिर से कोशिश करें।',
    rainMessage: '🌧️ बारिश आ गई — आज आराम करें। कल बेहतर होगा 🙏',
    crisisMessage: '😢 परेशानी सुनकर दुख हुआ। मैं help करूँगा। पहले ये schemes देखें:',
    dailyPulse: (name) => `${name}, आज कैसा रहा? क्या किया? 😊`,
    streakWarning: (name, days) => `${name}, ${days} दिन हो गए — कल एक note करें 🙏`,
    creditReady: '🎉 बधाई! आप loan के लिए ready हैं!',
    creditProgress: (days, remaining) => `${days} दिन track किए। ${remaining} दिन और बाकी हैं।`,
    schoolFeeGoal: (fees, weekly) => `📚 June 1 को school fees आएगी। ₹${fees} चाहिए। 12 हफ्ते ₹${weekly} बचाएं तो ready हो जाएंगे। Track करूँ?`,
    festivalAlert: (festival) => `🎉 ${festival} आ रहा है — ज़्यादा stock करें, ज़्यादा कमाई होगी!`,
    languageSet: 'हिंदी set हो गया! अब मैं हिंदी में बात करूँगा। 😊',
    askLanguage: 'अपनी भाषा चुनें:\n1️⃣ ಕನ್ನಡ\n2️⃣ हिंदी\n3️⃣ தமிழ்\n4️⃣ తెలుగు\n5️⃣ English',
  },
  'ta': {
    code: 'ta',
    name: 'தமிழ்',
    speechCode: 'ta-IN',
    greeting: 'வணக்கம்! நான் மித்ரா. உங்கள் இலவச நிதி நண்பர். நீங்கள் என்ன விற்கிறீர்கள்?',
    askIncome: 'நல்லது! தினமும் தோராயமாக எவ்வளவு சம்பாதிக்கிறீர்கள்?',
    onboardingDone: (name) => `மிகவும் நல்லது ${name || ''}! தினமும் message செய்தால் profit track செய்வேன், savings help செய்வேன், loan தயார் செய்வேன். தொடங்கலாமா? 😊`,
    voiceReceived: '⏳ உங்கள் குரல் கேட்கிறேன்...',
    voiceError: 'மன்னிக்கவும், புரியவில்லை. மீண்டும் அனுப்பவும் 🙏',
    error: 'மன்னிக்கவும், மீண்டும் முயற்சிக்கவும்.',
    rainMessage: '🌧️ மழை வந்தது — ஓய்வு எடுங்கள். நாளை சிறப்பாக இருக்கும் 🙏',
    crisisMessage: '😢 கஷ்டம் கேட்டு வருத்தமாக இருக்கிறது. நான் உதவுவேன். முதலில் இந்த திட்டங்களைப் பாருங்கள்:',
    dailyPulse: (name) => `${name}, இன்று எப்படி இருந்தது? என்ன செய்தீர்கள்? 😊`,
    streakWarning: (name, days) => `${name}, ${days} நாட்கள் ஆனது — நாளை ஒரு குறிப்பு செய்யுங்கள் 🙏`,
    creditReady: '🎉 வாழ்த்துகள்! நீங்கள் கடனுக்கு தயாராக உள்ளீர்கள்!',
    creditProgress: (days, remaining) => `${days} நாட்கள் track செய்தீர்கள். ${remaining} நாட்கள் இன்னும் தேவை.`,
    schoolFeeGoal: (fees, weekly) => `📚 June 1 பள்ளி கட்டணம் வருகிறது. ₹${fees} தேவை. 12 வாரம் ₹${weekly} சேமித்தால் தயார். Track செய்யட்டுமா?`,
    festivalAlert: (festival) => `🎉 ${festival} வருகிறது — அதிக stock வாங்கி வையுங்கள், அதிக சம்பாதிப்பீர்கள்!`,
    languageSet: 'தமிழ் set ஆனது! இனி தமிழில் பேசுவேன். 😊',
    askLanguage: 'உங்கள் மொழியை தேர்ந்தெடுங்கள்:\n1️⃣ ಕನ್ನಡ\n2️⃣ हिंदी\n3️⃣ தமிழ்\n4️⃣ తెలుగు\n5️⃣ English',
  },
  'te': {
    code: 'te',
    name: 'తెలుగు',
    speechCode: 'te-IN',
    greeting: 'నమస్కారం! నేను మిత్ర. మీ ఉచిత ఆర్థిక స్నేహితుడు. మీరు ఏమి అమ్ముతారు?',
    askIncome: 'చాలా బాగుంది! రోజూ దాదాపు ఎంత సంపాదిస్తారు?',
    onboardingDone: (name) => `చాలా అద్భుతం ${name || ''}! రోజూ message చేస్తే profit track చేస్తాను, savings help చేస్తాను, loan ready చేస్తాను. మొదలు పెట్టాలా? 😊`,
    voiceReceived: '⏳ మీ గొంతు వింటున్నాను...',
    voiceError: 'క్షమించండి, అర్థం కాలేదు. దయచేసి మళ్ళీ పంపండి 🙏',
    error: 'క్షమించండి, దయచేసి మళ్ళీ ప్రయత్నించండి.',
    rainMessage: '🌧️ వర్షం వచ్చింది — విశ్రాంతి తీసుకోండి. రేపు బాగుంటుంది 🙏',
    crisisMessage: '😢 కష్టం విని బాధగా ఉంది. నేను help చేస్తాను. ముందు ఈ schemes చూడండి:',
    dailyPulse: (name) => `${name}, ఈరోజు ఎలా ఉంది? ఏం చేసారు? 😊`,
    streakWarning: (name, days) => `${name}, ${days} రోజులు అయ్యాయి — రేపు ఒక note చేయండి 🙏`,
    creditReady: '🎉 అభినందనలు! మీరు loan కు ready అయ్యారు!',
    creditProgress: (days, remaining) => `${days} రోజులు track చేసారు. ${remaining} రోజులు ఇంకా కావాలి.`,
    schoolFeeGoal: (fees, weekly) => `📚 June 1 school fees వస్తుంది. ₹${fees} కావాలి. 12 వారాలు ₹${weekly} ఆదా చేస్తే ready అవుతుంది. Track చేయమా?`,
    festivalAlert: (festival) => `🎉 ${festival} వస్తుంది — ఎక్కువ stock చేసుకోండి, ఎక్కువ సంపాదిస్తారు!`,
    languageSet: 'తెలుగు set అయింది! ఇకపై తెలుగులో మాట్లాడతాను. 😊',
    askLanguage: 'మీ భాష ఎంచుకోండి:\n1️⃣ ಕನ್ನಡ\n2️⃣ हिंदी\n3️⃣ தமிழ்\n4️⃣ తెలుగు\n5️⃣ English',
  },
  'en': {
    code: 'en',
    name: 'English',
    speechCode: 'en-IN',
    greeting: 'Hello! I am Mitra. Your free financial friend. What do you sell?',
    askIncome: 'Great! Roughly how much do you earn per day?',
    onboardingDone: (name) => `Wonderful ${name || ''}! Message me every day and I will track your profit, help with savings, and get you loan-ready. Shall we start? 😊`,
    voiceReceived: '⏳ Listening to your voice note...',
    voiceError: 'Sorry, I could not understand. Please send again 🙏',
    error: 'Sorry, please try again.',
    rainMessage: '🌧️ Heavy rain today — take rest. Tomorrow will be better 🙏',
    crisisMessage: '😢 Sorry to hear you are having a hard time. I will help. First check these schemes:',
    dailyPulse: (name) => `${name}, how did today go? What did you sell? 😊`,
    streakWarning: (name, days) => `${name}, ${days} days since your last update — please send a note tomorrow 🙏`,
    creditReady: '🎉 Congratulations! You are loan-ready!',
    creditProgress: (days, remaining) => `${days} days tracked. ${remaining} more days to loan eligibility.`,
    schoolFeeGoal: (fees, weekly) => `📚 School fees due June 1. Need ₹${fees}. Save ₹${weekly}/week for 12 weeks and you will be ready. Should I track this?`,
    festivalAlert: (festival) => `🎉 ${festival} is coming — stock up more, you will earn more!`,
    languageSet: 'English is set! I will chat with you in English now. 😊',
    askLanguage: 'Choose your language:\n1️⃣ ಕನ್ನಡ\n2️⃣ हिंदी\n3️⃣ தமிழ்\n4️⃣ తెలుగు\n5️⃣ English',
  }
};

// Language detection from user message
function detectLanguage(text) {
  if (!text) return null;
  // Telugu unicode range — check BEFORE Kannada (ranges are adjacent)
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te';
  // Kannada unicode range
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn';
  // Hindi/Devanagari
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  // Tamil
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
  return null;
}

// Parse language selection from numbered reply
function parseLanguageChoice(text) {
  const t = text.trim();
  if (t === '1' || /kannada/i.test(t) || /ಕನ್ನಡ/.test(t)) return 'kn';
  if (t === '2' || /hindi/i.test(t) || /हिंदी/.test(t)) return 'hi';
  if (t === '3' || /tamil/i.test(t) || /தமிழ்/.test(t)) return 'ta';
  if (t === '4' || /telugu/i.test(t) || /తెలుగు/.test(t)) return 'te';
  if (t === '5' || /english/i.test(t)) return 'en';
  return null;
}

function getLang(code) {
  return STRINGS[code] || STRINGS['kn'];
}

module.exports = { STRINGS, getLang, detectLanguage, parseLanguageChoice };
