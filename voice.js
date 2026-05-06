const speech = require('@google-cloud/speech');
const textToSpeech = require('@google-cloud/text-to-speech');
const axios = require('axios');

const sttClient = new speech.SpeechClient();
const ttsClient = new textToSpeech.TextToSpeechClient();

// Speech-to-Text: transcribe WhatsApp voice note
// Supports Kannada, Hindi, Tamil, Telugu, English
async function transcribeWhatsAppVoiceNote(mediaId, preferredLang = 'kn') {
  const langMap = {
    kn: 'kn-IN',
    hi: 'hi-IN',
    ta: 'ta-IN',
    te: 'te-IN',
    mr: 'mr-IN',
    ml: 'ml-IN',
    en: 'en-IN'
  };

  // Primary language + all others as fallback
  const primaryCode = langMap[preferredLang] || 'kn-IN';
  const alternativeCodes = Object.values(langMap).filter(c => c !== primaryCode);

  try {
    // Step 1: Get the media URL from WhatsApp
    const mediaResponse = await axios.get(
      `https://graph.facebook.com/v20.0/${mediaId}`,
      { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } }
    );

    // Step 2: Download the audio file
    const audioResponse = await axios.get(mediaResponse.data.url, {
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
      responseType: 'arraybuffer'
    });

    // Step 3: Convert to base64
    const audioBytes = Buffer.from(audioResponse.data).toString('base64');

    // Step 4: Send to Google Speech-to-Text with multi-language support
    console.log(`Transcribing audio with primary language: ${primaryCode}`);
    const request = {
      audio: { content: audioBytes },
      config: {
        encoding: 'OGG_OPUS',
        sampleRateHertz: 16000,
        languageCode: primaryCode,
        alternativeLanguageCodes: alternativeCodes,
        model: 'latest_long',
        enableAutomaticPunctuation: true
      },
    };

    const [response] = await sttClient.recognize(request);
    console.log('STT Response received');

    if (response.results && response.results.length > 0) {
      const transcript = response.results[0].alternatives[0].transcript;
      console.log('Transcript:', transcript);
      return transcript;
    }
    console.warn('No transcription results found.');
    return null;
  } catch (error) {
    console.error('Error transcribing voice note:', error.message);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', JSON.stringify(error.response.data));
    }
    return null;
  }
}

// Text-to-Speech: convert Mitra's reply to audio in worker's language
// Returns Buffer of MP3 audio
async function textToVoiceReply(text, langCode = 'kn') {
  const voiceMap = {
    kn: { languageCode: 'kn-IN', name: 'kn-IN-Standard-A', ssmlGender: 'FEMALE' },
    hi: { languageCode: 'hi-IN', name: 'hi-IN-Standard-A', ssmlGender: 'FEMALE' },
    ta: { languageCode: 'ta-IN', name: 'ta-IN-Standard-A', ssmlGender: 'FEMALE' },
    te: { languageCode: 'te-IN', name: 'te-IN-Standard-A', ssmlGender: 'FEMALE' },
    en: { languageCode: 'en-IN', name: 'en-IN-Standard-A', ssmlGender: 'FEMALE' }
  };

  const voice = voiceMap[langCode] || voiceMap.kn;

  // Strip emojis for cleaner TTS
  const cleanText = text.replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .trim();

  try {
    const request = {
      input: { text: cleanText },
      voice,
      audioConfig: { audioEncoding: 'MP3', speakingRate: 0.9 } // Slightly slower for clarity
    };

    const [response] = await ttsClient.synthesizeSpeech(request);
    return response.audioContent; // Buffer
  } catch (error) {
    console.error('Error creating voice reply:', error.message);
    return null;
  }
}

// Send voice reply on WhatsApp (requires uploading audio first)
async function sendVoiceReplyOnWhatsApp(phone, audioBuffer) {
  if (!audioBuffer) return false;
  try {
    // Upload audio to WhatsApp Media API
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', audioBuffer, {
      filename: 'mitra-reply.mp3',
      contentType: 'audio/mpeg'
    });
    form.append('type', 'audio/mpeg');
    form.append('messaging_product', 'whatsapp');

    const uploadUrl = `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_ID}/media`;
    const uploadResponse = await axios.post(uploadUrl, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`
      }
    });

    const mediaId = uploadResponse.data.id;

    // Send as audio message
    const msgUrl = `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_ID}/messages`;
    await axios.post(msgUrl, {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'audio',
      audio: { id: mediaId }
    }, {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    return true;
  } catch (error) {
    console.error('Error sending voice reply:', error.response?.data || error.message);
    return false;
  }
}

module.exports = { transcribeWhatsAppVoiceNote, textToVoiceReply, sendVoiceReplyOnWhatsApp };
