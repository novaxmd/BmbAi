import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export const sendChatMessage = async (history: ChatMessage[], newMessage: string): Promise<string> => {
  try {
    // Create a chat session with the full history context
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: "You are Bmb Ai, a highly advanced, intelligent, and helpful AI assistant created by Bmb Tech. You are witty, professional, and knowledgeable about coding, technology, and creativity. Always answer as 'Bmb Ai'.",
      },
      history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }))
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "No response received.";
  } catch (error: any) {
    console.error("Chat Error:", error);
    throw new Error(error.message || "Failed to send message.");
  }
};