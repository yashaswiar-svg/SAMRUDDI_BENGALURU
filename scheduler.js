// scheduler.js — Firebase Scheduled Cloud Functions (v2)
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');
const { sendMessage } = require('./whatsapp');
const { getLang } = require('./languages');

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// ─── 8PM Daily Pulse ─────────────────────────────────────────────────────────
exports.dailyPulse = onSchedule({
  schedule: '0 20 * * *',
  timeZone: 'Asia/Kolkata',
  memory: '256MiB'
}, async (event) => {
  const users = await db.collection('users')
    .where('onboardingComplete', '==', true)
    .get();

  const promises = users.docs.map(async (userDoc) => {
    const data = userDoc.data();
    const lang = data.preferredLanguage || 'kn';
    const L = getLang(lang);
    const phone = data.phone;

    if (!phone || data.inCrisis) return;

    const lastActive = data.lastActiveDate?.toDate?.() || new Date(0);
    const daysSince = Math.floor((new Date() - lastActive) / 86400000);

    if (daysSince >= 3) {
      await sendMessage(phone, L.streakWarning(data.name, daysSince));
      return;
    }

    await sendMessage(phone, L.dailyPulse(data.name || ''));
  });

  await Promise.allSettled(promises);
  console.log(`Daily pulse sent to ${users.size} users`);
});

// ─── Sunday Weekly Summary ────────────────────────────────────────────────────
exports.weeklySummary = onSchedule({
  schedule: '0 19 * * 0',
  timeZone: 'Asia/Kolkata',
  memory: '256MiB'
}, async (event) => {
  const users = await db.collection('users')
    .where('onboardingComplete', '==', true)
    .get();

  const promises = users.docs.map(async (userDoc) => {
    const data = userDoc.data();
    const lang = data.preferredLanguage || 'kn';
    const L = getLang(lang);
    const phone = data.phone;

    if (!phone || data.inCrisis) return;

    const weekNum = getWeekNumber();
    const txSnap = await db.collection('users').doc(userDoc.id)
      .collection('transactions')
      .where('week', '==', weekNum)
      .get();

    let income = 0, expense = 0;
    txSnap.forEach(doc => {
      income += doc.data().income;
      expense += doc.data().expense;
    });
    const profit = income - expense;

    const days = data.totalDaysTracked || 0;
    const creditScore = Math.min(300 + days * 20, 900);

    const summaryMsg = {
      kn: `📊 ಈ ವಾರ:\n💰 Income: ₹${income}\n💸 Expense: ₹${expense}\n✅ Profit: ₹${profit}\n⭐ Credit Score: ${creditScore}/900\n\nStreak: ${data.streakCount || 0} ದಿನ! 🔥`,
      hi: `📊 इस हफ्ते:\n💰 आमदनी: ₹${income}\n💸 खर्च: ₹${expense}\n✅ मुनाफा: ₹${profit}\n⭐ Credit Score: ${creditScore}/900\n\nStreak: ${data.streakCount || 0} दिन! 🔥`,
      ta: `📊 இந்த வாரம்:\n💰 வருமானம்: ₹${income}\n💸 செலவு: ₹${expense}\n✅ லாபம்: ₹${profit}\n⭐ Credit Score: ${creditScore}/900\n\nStreak: ${data.streakCount || 0} நாட்கள்! 🔥`,
      te: `📊 ఈ వారం:\n💰 ఆదాయం: ₹${income}\n💸 ఖర్చు: ₹${expense}\n✅ లాభం: ₹${profit}\n⭐ Credit Score: ${creditScore}/900\n\nStreak: ${data.streakCount || 0} రోజులు! 🔥`,
      en: `📊 This Week:\n💰 Income: ₹${income}\n💸 Expense: ₹${expense}\n✅ Profit: ₹${profit}\n⭐ Credit Score: ${creditScore}/900\n\nStreak: ${data.streakCount || 0} days! 🔥`
    };

    await sendMessage(phone, summaryMsg[lang] || summaryMsg.kn);

    if (data.schoolFeeTracking && data.schoolFeeWeeklySaving > 0) {
      const reminderMsg = {
        kn: `📚 School fees reminder: ಈ ವಾರ ₹${data.schoolFeeWeeklySaving} ಉಳಿಸಿದ್ರಾ?`,
        hi: `📚 School fees reminder: इस हफ्ते ₹${data.schoolFeeWeeklySaving} बचाए?`,
        ta: `📚 School fees reminder: இந்த வாரம் ₹${data.schoolFeeWeeklySaving} ಸೇಮಿತ್ತೀರ್ಗಳಾ?`,
        te: `📚 School fees reminder: ఈ వారం ₹${data.schoolFeeWeeklySaving} ఆదా చేసారా?`,
        en: `📚 School fees reminder: Did you save ₹${data.schoolFeeWeeklySaving} this week?`
      };
      await sendMessage(phone, reminderMsg[lang] || reminderMsg.en);
    }
  });

  await Promise.allSettled(promises);
  console.log('Weekly summaries sent');
});

// ─── Monthly NammaEco Unlock Check ───────────────────────────────────────────
exports.monthlyUnlockCheck = onSchedule({
  schedule: '0 10 1 * *',
  timeZone: 'Asia/Kolkata',
  memory: '256MiB'
}, async (event) => {
  const users = await db.collection('users')
    .where('onboardingComplete', '==', true)
    .get();

  const promises = users.docs.map(async (userDoc) => {
    const data = userDoc.data();
    const lang = data.preferredLanguage || 'kn';
    const phone = data.phone;
    const days = data.totalDaysTracked || 0;
    const prevLevel = data.unlockLevel || 0;

    if (!phone) return;

    let newLevel = prevLevel;
    let unlockMsg = null;

    if (days >= 90 && prevLevel < 90) {
      newLevel = 90;
      unlockMsg = {
        kn: '🎉 90 ದಿನ ಆಯ್ತು! NammaEco ಮಾರ್ಕೆಟ್ ಸಂಪೂರ್ಣ unlock ಆಯ್ತು + Credit Report ready!',
        hi: '🎉 90 दिन हो गए! NammaEco Market पूरी तरह unlock हुई + Credit Report तैयार!',
        ta: '🎉 90 நாட்கள் ஆனது! NammaEco Market முழுவதும் unlock ஆனது + Credit Report தயார்!',
        te: '🎉 90 రోజులు అయ్యాయి! NammaEco Market పూర్తిగా unlock అయింది + Credit Report తయారు!',
        en: '🎉 90 days done! NammaEco Marketplace fully unlocked + Credit Report ready!'
      };
    } else if (days >= 60 && prevLevel < 60) {
      newLevel = 60;
      unlockMsg = {
        kn: '✅ 60 ದಿನ ಆಯ್ತು! Bulk supplier access unlock ಆಯ್ತು!',
        hi: '✅ 60 दिन हो गए! Bulk supplier access unlock हुई!',
        ta: '✅ 60 நாட்கள் ஆனது! Bulk supplier access unlock ஆனது!',
        te: '✅ 60 రోజులు అయ్యాయి! Bulk supplier access unlock అయింది!',
        en: '✅ 60 days done! Bulk supplier access unlocked!'
      };
    } else if (days >= 30 && prevLevel < 30) {
      newLevel = 30;
      unlockMsg = {
        kn: '🌟 30 ದಿನ ಆಯ್ತು! NammaEco ಶುರು ಆಯ್ತು — scheme matches ready!',
        hi: '🌟 30 दिन हो गए! NammaEco शुरू हुई — scheme matches तैयार!',
        ta: '🌟 30 நாட்கள் ஆனது! NammaEco தொடங்கியது — scheme matches தயார்!',
        te: '🌟 30 రోజులు అయ్యాయి! NammaEco మొదలైంది — scheme matches తయారు!',
        en: '🌟 30 days done! NammaEco started — scheme matches ready!'
      };
    }

    if (unlockMsg) {
      await db.collection('users').doc(userDoc.id).update({ unlockLevel: newLevel });
      await sendMessage(phone, unlockMsg[lang] || unlockMsg.en);
    }
  });

  await Promise.allSettled(promises);
  console.log('Monthly unlock check done');
});

function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
}

module.exports = { dailyPulse: exports.dailyPulse, weeklySummary: exports.weeklySummary, monthlyUnlockCheck: exports.monthlyUnlockCheck };
