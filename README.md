# 🦾 Mitra-NammaEco — AI Financial Mitra

**Mitra-NammaEco** is a multi-language AI financial assistant designed to empower informal workers in Bengaluru. It provides a simple, voice-first WhatsApp interface for tracking finances, discovering government schemes, and making smarter business decisions.

---

## 🌟 Key Features

### 1. Natural Language Financial Tracking
*   **Voice-First:** Workers can simply send a voice note in their native language.
*   **Smart Extraction:** Gemini AI identifies income and expense amounts from natural speech (e.g., *"Today I earned 800 from sales and spent 200 on petrol"*).
*   **Structured Data:** Automatically converts conversational text into a financial database (Firestore).

### 2. Multi-Language Persona ("Mitra")
*   **Colloquial Support:** Understands and speaks in simple, spoken versions of **Kannada, Hindi, Tamil, Telugu, Marathi, Malayalam, and English**.
*   **Warm Relationship:** Acts as a "Mitra" (Friend), not a robotic bank app.

### 3. Smart Government Scheme Matching
*   **Profile-Based:** Matches the worker’s occupation, age, and gender against a database of schemes like *Ayushman Bharat* or *PM-SVANidhi*.
*   **Actionable Advice:** Provides clear, 1-2-3 steps on how to apply.

### 4. Crisis-Aware Empathy
*   **Emotional Intelligence:** Recognizes mentions of illness, accidents, or emergencies.
*   **Support First:** Switches to a supportive "Empathy Mode" to offer comfort before returning to financial management.

### 5. Practical "Market Math" (Supplier Savings)
*   **Real-World Logic:** Helps workers decide if a trip to a wholesale market (like KR Market) is worth the auto fare and time.
*   **Break-Even Analysis:** *"It’s only worth going to the mandi if you buy more than 5kg of stock."*

---

## 🛠️ Tech Stack
*   **Backend:** Node.js, Express.js
*   **Cloud Hosting:** Firebase Cloud Functions (Gen 2)
*   **Database:** Firebase Firestore
*   **AI (Core):** Google Gemini Pro (via `@google/generative-ai`)
*   **Voice (STT/TTS):** Google Cloud Speech-to-Text & Text-to-Speech
*   **Messaging:** WhatsApp Business Cloud API

---

## 📈 Social Impact
By removing the barriers of literacy and complex apps, **Mitra-NammaEco** brings high-end financial planning to the hands of street vendors, auto drivers, and domestic workers, helping them build a "Credit Score" through consistent tracking.
