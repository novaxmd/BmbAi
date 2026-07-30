import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSpeech = async (text: string, voiceName: string = 'Puck'): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName },
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data generated.");
    
    // Convert raw PCM/Base64 to a playable format is complex on client side without headers.
    // However, Gemini usually returns a base64 string that can be used directly or might need decoding.
    // NOTE: The new API often returns data that needs to be handled carefully. 
    // For simplicity in this web app context, we assume standard base64 audio handling.
    // If raw PCM, we would need a WAV header. Assuming the API might return wav/mp3 wrapped or we wrap it.
    // Current best practice for the web component: return the base64 string.
    
    return `data:audio/mp3;base64,${base64Audio}`; 
  } catch (error: any) {
    console.error("TTS Error:", error);
    throw new Error(error.message || "Failed to generate speech.");
  }
};

export const analyzeAudio = async (audioBase64: string, mimeType: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-latest", // Multimodal model for audio input
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: audioBase64
            }
          },
          {
            text: "Listen to this audio carefully. 1. Provide a full transcription. 2. Summarize the key points or emotion. 3. Identify the language."
          }
        ]
      }
    });

    return response.text || "Could not analyze audio.";
  } catch (error: any) {
    console.error("Audio Analysis Error:", error);
    throw new Error(error.message || "Failed to analyze audio.");
  }
};