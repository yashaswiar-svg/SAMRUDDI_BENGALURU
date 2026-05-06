const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.APP_PROJECT_ID || process.env.GCLOUD_PROJECT
  });
}

const db = admin.firestore();

async function getOrCreateUser(phone, name) {
  const userRef = db.collection('users').doc(phone);
  const user = await userRef.get();

  if (!user.exists) {
    await userRef.set({
      phone,
      name: name || 'Worker',
      joinedAt: new Date(),
      totalDaysTracked: 0,
      creditScore: 0,
      // Onboarding
      onboardingStep: 0,        // 0=lang, 1=occupation, 2=income, 3=done
      onboardingComplete: false,
      preferredLanguage: 'kn',  // default Kannada
      occupation: '',
      estimatedDailyIncome: 0,
      // Family context
      familySize: 0,
      kidsInSchool: 0,
      spouseWorking: false,
      // Goals
      schoolFeeGoal: 0,
      schoolFeeWeeklySaving: 0,
      schoolFeeTracking: false,
      healthEmergencyFund: 0,
      // Streak
      streakCount: 0,
      lastActiveDate: new Date(),
      // Credit unlock
      nammaEcoUnlocked: false,
      unlockLevel: 0,           // 0=none, 30=basic, 60=mid, 90=full
    });
  }
  return (await userRef.get()).data();
}

async function updateUser(phone, fields) {
  await db.collection('users').doc(phone).update(fields);
}

async function saveTransaction(phone, income, expense) {
  await db.collection('users').doc(phone)
    .collection('transactions').add({
      income: income || 0,
      expense: expense || 0,
      profit: (income || 0) - (expense || 0),
      date: new Date(),
      week: getWeekNumber()
    });

  const userRef = db.collection('users').doc(phone);
  const user = await userRef.get();
  const data = user.data();

  // Update streak
  const lastActive = data.lastActiveDate?.toDate?.() || new Date(0);
  const daysSince = Math.floor((new Date() - lastActive) / 86400000);
  const newStreak = daysSince <= 1 ? (data.streakCount || 0) + 1 : 1;

  // Check NammaEco unlock level
  const days = (data.totalDaysTracked || 0) + 1;
  let unlockLevel = data.unlockLevel || 0;
  if (days >= 90 && unlockLevel < 90) unlockLevel = 90;
  else if (days >= 60 && unlockLevel < 60) unlockLevel = 60;
  else if (days >= 30 && unlockLevel < 30) unlockLevel = 30;

  await userRef.update({
    totalDaysTracked: admin.firestore.FieldValue.increment(1),
    lastActiveDate: new Date(),
    streakCount: newStreak,
    unlockLevel,
    nammaEcoUnlocked: days >= 30
  });
}

async function getWeeklySummary(phone) {
  const weekNum = getWeekNumber();
  const snapshot = await db.collection('users').doc(phone)
    .collection('transactions')
    .where('week', '==', weekNum)
    .get();

  let income = 0, expense = 0;
  snapshot.forEach(doc => {
    income += doc.data().income;
    expense += doc.data().expense;
  });

  return { income, expense, profit: income - expense };
}

async function getMonthlySummary(phone) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const snapshot = await db.collection('users').doc(phone)
    .collection('transactions')
    .where('date', '>=', startOfMonth)
    .get();

  let income = 0, expense = 0, days = 0;
  snapshot.forEach(doc => {
    income += doc.data().income;
    expense += doc.data().expense;
    days++;
  });

  return { income, expense, profit: income - expense, activeDays: days };
}

async function getCreditReadiness(phone) {
  const user = await db.collection('users').doc(phone).get();
  const d = user.data() || {};
  const days = d.totalDaysTracked || 0;
  const streak = d.streakCount || 0;
  const unlockLevel = d.unlockLevel || 0;

  return {
    daysTracked: days,
    isReady: days >= 90,
    daysRemaining: Math.max(0, 90 - days),
    streakCount: streak,
    unlockLevel,
    creditScore: Math.min(300 + days * 20, 900)
  };
}

// Save scheme application state
async function saveSchemeApplication(phone, schemeName, step, data = {}) {
  await db.collection('users').doc(phone)
    .collection('schemeApplications')
    .doc(schemeName.replace(/\s+/g, '_'))
    .set({
      schemeName,
      step,         // 'interested' | 'docs_needed' | 'submitted' | 'approved'
      updatedAt: new Date(),
      ...data
    }, { merge: true });
}

// Aggregate peer benchmarking (anonymous)
async function getPeerBenchmark(occupation) {
  try {
    const snapshot = await db.collection('users')
      .where('occupation', '==', occupation)
      .where('totalDaysTracked', '>=', 7)
      .get();

    if (snapshot.size < 3) return null; // Need at least 3 peers for anonymity

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    let totalProfit = 0, count = 0;

    for (const userDoc of snapshot.docs) {
      const txSnapshot = await db.collection('users')
        .doc(userDoc.id)
        .collection('transactions')
        .where('date', '>=', startOfMonth)
        .get();

      let profit = 0;
      txSnapshot.forEach(doc => { profit += doc.data().profit; });
      totalProfit += profit;
      count++;
    }

    return {
      peerCount: count,
      avgMonthlyProfit: Math.round(totalProfit / count),
      occupation
    };
  } catch (err) {
    console.error('Peer benchmark error:', err);
    return null;
  }
}

function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
}

module.exports = {
  getOrCreateUser,
  updateUser,
  saveTransaction,
  getWeeklySummary,
  getMonthlySummary,
  getCreditReadiness,
  saveSchemeApplication,
  getPeerBenchmark
};
