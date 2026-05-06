require('dotenv').config();
const express = require('express');
const admin = require('firebase-admin');
const { handleMessage } = require('./messageHandler');
const app = express();

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.APP_PROJECT_ID || process.env.GCLOUD_PROJECT
    });
}

app.use(express.json());

// ── Health check ──
app.get('/', (req, res) => {
    res.send('Mitra Bot is Online! 🚀 (Samruddhi Bengaluru)');
});

// ── Status endpoint — bot health, total users ──
app.get('/status', async (req, res) => {
    try {
        const db = admin.firestore();
        const usersSnap = await db.collection('users').get();
        res.json({
            status: 'online',
            version: '3.0.0',
            totalUsers: usersSnap.size,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.json({ status: 'online', error: err.message });
    }
});

// Webhook verification (Meta requires this)
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// Incoming messages
app.post('/webhook', async (req, res) => {
    try {
        const body = req.body;
        if (body.object) {
            const entry = body.entry?.[0];
            const change = entry?.changes?.[0];
            const message = change?.value?.messages?.[0];
            const contact = change?.value?.contacts?.[0];

            if (message) {
                const ts = new Date().toISOString();
                console.log(`[${ts}] Processing message from ${message.from}`);
                await handleMessage(message, contact);
            }
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    } catch (err) {
        console.error("Error in webhook processing:", err);
        res.sendStatus(500);
    }
});

// ── Firebase Cloud Function export (public, so WhatsApp can reach it) ──
const { onRequest } = require('firebase-functions/v2/https');
exports.mitraBot = onRequest({ invoker: 'public', memory: '512MiB' }, app);

// ── Import scheduled functions so Firebase deploys them ──
const scheduler = require('./scheduler');
exports.dailyPulse = scheduler.dailyPulse;
exports.weeklySummary = scheduler.weeklySummary;
exports.monthlyUnlockCheck = scheduler.monthlyUnlockCheck;

// ── Also allow local dev with `node index.js` ──
if (process.env.NODE_ENV !== 'production' && !process.env.FUNCTION_TARGET) {
    const port = process.env.APP_PORT || 3000;
    app.listen(port, () => {
        console.log(`Mitra Webhook is actively listening on port ${port}`);
    });
}