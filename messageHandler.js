const { parseFinanceAndReply, extractTransactionData, matchGovernmentSchemes, generateCrisisResponse, calculateSupplierSavings } = require('./gemini');
const { transcribeWhatsAppVoiceNote, textToVoiceReply, sendVoiceReplyOnWhatsApp } = require('./voice');
const { getOrCreateUser, updateUser, saveTransaction, getWeeklySummary, getCreditReadiness, saveSchemeApplication } = require('./database');
const { sendMessage } = require('./whatsapp');
const { getLang, detectLanguage, parseLanguageChoice } = require('./languages');
const { getSupplierSavingsAnalysis } = require('./maps');

// ─── Crisis keyword detection ───────────────────────────────────────────────
const CRISIS_WORDS = [
  // English
  'sick', 'unwell', 'hospital', 'flood', 'fire', 'accident', 'help', 'emergency',
  'doctor', 'fever', 'injury', 'injured', 'hurt',
  // Kannada
  'ಅನಾರೋಗ್ಯ', 'ಪ್ರವಾಹ', 'ಬೆಂಕಿ', 'ಆಸ್ಪತ್ರೆ', 'ವೈದ್ಯ', 'ಜ್ವರ',
  // Hindi
  'बीमार', 'अस्पताल', 'बाढ़', 'आग', 'दुर्घटना', 'मदद', 'डॉक्टर', 'बुखार',
  // Tamil
  'நோய்', 'மருத்துவமனை', 'வெள்ளம்', 'தீ', 'விபத்து', 'உதவி', 'மருத்துவர்',
  // Telugu
  'అనారోగ్యం', 'ఆసుపత్రి', 'వరదలు', 'అగ్ని', 'ప్రమాదం', 'సహాయం', 'వైద్యుడు'
];

function isCrisisMessage(text) {
  const lower = text.toLowerCase();
  return CRISIS_WORDS.some(word => lower.includes(word.toLowerCase()));
}

// ─── Festival calendar ───────────────────────────────────────────────────────
const FESTIVALS = [
  { name: 'Dasara', month: 9, day: 1 },    // Oct
  { name: 'Diwali', month: 10, day: 1 },   // Nov
  { name: 'Ugadi', month: 2, day: 25 },    // Late Mar
  { name: 'Sankranti', month: 0, day: 10 }, // Jan
  { name: 'Eid', month: 2, day: 30 },      // Approx
  { name: 'Christmas', month: 11, day: 20 }
];

function getUpcomingFestival() {
  const now = new Date();
  for (const f of FESTIVALS) {
    const festDate = new Date(now.getFullYear(), f.month, f.day);
    const daysUntil = Math.floor((festDate - now) / 86400000);
    if (daysUntil > 0 && daysUntil <= 7) return f.name;
  }
  return null;
}

// ─── Main message handler ────────────────────────────────────────────────────
async function handleMessage(message, contact) {
  const phone = message.from;
  const name = contact?.profile?.name;

  let user = await getOrCreateUser(phone, name);
  const lang = user.preferredLanguage || 'kn';
  const L = getLang(lang);

  let userText = '';

  // ── Handle voice note ──
  if (message.type === 'audio') {
    await sendMessage(phone, L.voiceReceived);
    userText = await transcribeWhatsAppVoiceNote(message.audio.id, lang);
    if (!userText) {
      await sendMessage(phone, L.voiceError);
      return;
    }
  }

  // ── Handle text ──
  if (message.type === 'text') {
    userText = message.text.body;
  }

  if (!userText) return;

  // ── Auto-detect language from script if not set ──
  const detectedLang = detectLanguage(userText);
  if (detectedLang && detectedLang !== lang) {
    await updateUser(phone, { preferredLanguage: detectedLang });
    user = { ...user, preferredLanguage: detectedLang };
  }
  const activeLang = user.preferredLanguage || lang;
  const AL = getLang(activeLang);

  // ── Language selection command ──
  if (/^(language|bhasha|ಭಾಷೆ|भाषा|மொழி|భాష)/i.test(userText)) {
    await sendMessage(phone, AL.askLanguage);
    await updateUser(phone, { awaitingLanguageChoice: true });
    return;
  }

  // ── Handle language choice if awaiting ──
  if (user.awaitingLanguageChoice) {
    const chosen = parseLanguageChoice(userText);
    if (chosen) {
      await updateUser(phone, { preferredLanguage: chosen, awaitingLanguageChoice: false });
      await sendMessage(phone, getLang(chosen).languageSet);
      return;
    }
  }

  // ═══════════════════════════════════════════════════════
  // ONBOARDING FLOW (3 steps before tracking begins)
  // ═══════════════════════════════════════════════════════
  if (!user.onboardingComplete) {
    await handleOnboarding(phone, user, userText, activeLang, AL);
    return;
  }

  // ═══════════════════════════════════════════════════════
  // CRISIS DETECTION
  // ═══════════════════════════════════════════════════════
  if (isCrisisMessage(userText)) {
    const empathy = await generateCrisisResponse(userText, activeLang);
    await sendMessage(phone, empathy);

    // Check Ayushman Bharat enrollment
    const schemes = await matchGovernmentSchemes({
      occupation: user.occupation,
      hasHealthInsurance: user.hasHealthInsurance || false,
      location: 'Bengaluru'
    }, activeLang);

    if (schemes.schemes.length > 0) {
      await sendMessage(phone, AL.crisisMessage);
      const schemeList = schemes.schemes.map((s, i) =>
        `${i + 1}. *${s.name}*\n${s.benefit}\n📋 ${s.how_to_apply}`
      ).join('\n\n');
      await sendMessage(phone, schemeList);

      // Track scheme application state
      for (const s of schemes.schemes) {
        await saveSchemeApplication(phone, s.name, 'interested');
      }
    }

    // Pause streak — not penalizing for crisis days
    await updateUser(phone, { inCrisis: true, crisisStartDate: new Date() });
    return;
  }

  // Reset crisis flag if user messages normally after crisis
  if (user.inCrisis) {
    await updateUser(phone, { inCrisis: false });
  }

  // ═══════════════════════════════════════════════════════
  // NORMAL FINANCIAL TRACKING
  // ═══════════════════════════════════════════════════════
  const weeklyData = await getWeeklySummary(phone);

  // Use Gemini structured extraction instead of regex
  const extracted = await extractTransactionData(userText);
  if (extracted.income > 0 || extracted.expense > 0) {
    await saveTransaction(phone, extracted.income, extracted.expense);
  }

  const reply = await parseFinanceAndReply(userText, weeklyData, activeLang);

  // ── Credit readiness check (add to reply once a week) ──
  const credit = await getCreditReadiness(phone);
  let finalReply = reply;

  const today = new Date();
  if (today.getDay() === 0) { // Sunday weekly credit update
    const creditMsg = credit.isReady
      ? `\n\n${AL.creditReady}`
      : `\n\n📈 ${AL.creditProgress(credit.daysTracked, credit.daysRemaining)}`;
    finalReply += creditMsg;
  }

  // ── Festival tip if upcoming ──
  const upcomingFestival = getUpcomingFestival();
  if (upcomingFestival) {
    finalReply += `\n\n${AL.festivalAlert(upcomingFestival)}`;
  }

  await sendMessage(phone, finalReply);

  // ── Market sourcing tip: detect price/supplier questions ──
  const isSourceQuery = /market|mandi|supplier|price|where.*buy|khareed|where.*get|KR market|APMC|sabji|ಎಲ್ಲಿ.*ತೆಗೆ|ಮಾರ್ಕೆಟ್|मंडी|सब्ज़ी|சந்தை|மார்கெட்|మార్కెట్/i.test(userText);
  const itemMatch = userText.match(/(?:buy|selling|stock|price|rate|cost|for)\s+([a-zA-Z\u0C00-\u0CFF\u0900-\u097F\u0B80-\u0BFF]+)/i);
  if (isSourceQuery && user.lat && user.lng) {
    try {
      const item = itemMatch?.[1] || user.occupation || 'vegetables';
      const priceMatch = userText.match(/(\d+)\s*(?:rs|rupee|₹|per kg)?/i);
      const currentPrice = priceMatch ? parseInt(priceMatch[1]) : 30;
      const { text: marketMsg } = await calculateSupplierSavings(
        { lat: user.lat, lng: user.lng },
        item,
        currentPrice,
        activeLang
      );
      await sendMessage(phone, marketMsg);
    } catch (mapErr) {
      console.error('Market analysis error:', mapErr.message);
    }
  }

  // ── Send voice reply for low-literacy users ──
  if (user.preferVoiceReply) {
    const audioBuffer = await textToVoiceReply(reply, activeLang);
    if (audioBuffer) {
      await sendVoiceReplyOnWhatsApp(phone, audioBuffer);
    }
  }
}

// ─── Onboarding state machine ────────────────────────────────────────────────
async function handleOnboarding(phone, user, userText, lang, L) {
  const step = user.onboardingStep || 0;

  if (step === 0) {
    // Step 0: Ask language preference first
    await sendMessage(phone, L.askLanguage);
    // Check if they replied with a number choice
    const chosen = parseLanguageChoice(userText);
    if (chosen) {
      const newL = getLang(chosen);
      await updateUser(phone, {
        preferredLanguage: chosen,
        onboardingStep: 1
      });
      await sendMessage(phone, newL.greeting);
    } else {
      await updateUser(phone, { onboardingStep: 1 });
      await sendMessage(phone, L.greeting);
    }
    return;
  }

  if (step === 1) {
    // Step 1: They told us their occupation
    const occupation = userText.trim();
    await updateUser(phone, {
      occupation,
      onboardingStep: 2
    });
    await sendMessage(phone, L.askIncome);
    return;
  }

  if (step === 2) {
    // Step 2: They told us their daily income estimate
    const incomeMatch = userText.match(/(\d+)/);
    const estimatedIncome = incomeMatch ? parseInt(incomeMatch[1]) : 500;
    const userName = user.name || '';
    await updateUser(phone, {
      estimatedDailyIncome: estimatedIncome,
      onboardingStep: 3,
      onboardingComplete: true
    });
    await sendMessage(phone, L.onboardingDone(userName));

    // Ask about school-going children
    const schoolMsg = {
      kn: 'ನಿಮ್ಮ ಮಕ್ಕಳು school ಗೆ ಹೋಗ್ತಾರಾ? (ಹೌದು/ಇಲ್ಲ)',
      hi: 'क्या आपके बच्चे school जाते हैं? (हाँ/नहीं)',
      ta: 'உங்கள் குழந்தைகள் school போகிறார்களா? (ஆம்/இல்லை)',
      te: 'మీ పిల్లలు school కి వెళ్తారా? (అవును/కాదు)',
      en: 'Do your children go to school? (yes/no)'
    };
    await sendMessage(phone, schoolMsg[lang] || schoolMsg.kn);
    await updateUser(phone, { awaitingSchoolAnswer: true });
    return;
  }

  // Handle school children answer
  if (user.awaitingSchoolAnswer) {
    const hasKids = /yes|haan|ಹೌದು|ஆம்|అవును|ha/i.test(userText);
    if (hasKids) {
      // Set up school fee goal for June (₹3200 typical)
      const schoolFee = 3200;
      const weeksUntilJune = 12;
      const weeklyAmount = Math.ceil(schoolFee / weeksUntilJune);
      await updateUser(phone, {
        kidsInSchool: 1,
        schoolFeeGoal: schoolFee,
        schoolFeeWeeklySaving: weeklyAmount,
        schoolFeeTracking: true,
        awaitingSchoolAnswer: false
      });
      await sendMessage(phone, L.schoolFeeGoal(schoolFee, weeklyAmount));
    } else {
      await updateUser(phone, { awaitingSchoolAnswer: false });
    }
  }
}

module.exports = { handleMessage };
