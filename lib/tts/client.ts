/**
 * Text-to-speech generation for the daily WhatsApp voice note.
 * Primary provider: ElevenLabs. Falls back to Google Cloud TTS if
 * GOOGLE_TTS_API_KEY is set instead of ELEVENLABS_API_KEY.
 */

export async function generateSpeechMp3(text: string): Promise<Buffer> {
  if (process.env.ELEVENLABS_API_KEY) {
    return generateWithElevenLabs(text);
  }
  if (process.env.GOOGLE_TTS_API_KEY) {
    return generateWithGoogleTTS(text);
  }
  throw new Error("No TTS provider configured. Set ELEVENLABS_API_KEY or GOOGLE_TTS_API_KEY.");
}

async function generateWithElevenLabs(text: string): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY!;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // "Rachel" default voice

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true },
    }),
  });

  if (!res.ok) {
    throw new Error(`ElevenLabs TTS error (${res.status}): ${await res.text()}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

async function generateWithGoogleTTS(text: string): Promise<Buffer> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY!;

  const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: "en-IN", name: "en-IN-Neural2-A" },
      audioConfig: { audioEncoding: "MP3", speakingRate: 1.0, pitch: 0 },
    }),
  });

  if (!res.ok) {
    throw new Error(`Google TTS error (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { audioContent: string };
  return Buffer.from(data.audioContent, "base64");
}
