import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeObfuscatedCode = async (code: string): Promise<AnalysisResult> => {
  if (!code || code.trim().length === 0) {
    throw new Error("Code snippet is empty.");
  }

  const prompt = `
    You are a world-class security researcher and reverse engineer. 
    Analyze the following obfuscated JavaScript code. 
    This analysis is for educational and security research purposes only.
    
    1. Identify the likely purpose of the code (e.g., WhatsApp bot, malware, analytics, utility).
    2. Identify any specific libraries mentioned (e.g., @whiskeysockets/baileys).
    3. Assess the risk level based on what the code tries to do (e.g., accessing session IDs, downloading external files).
    4. Provide a simplified, readable explanation of what the code does.
    5. Attempt to provide a small de-obfuscated snippet of the critical logic if possible (e.g., the config loading part).

    Code snippet:
    ${code.substring(0, 30000)} // Truncate to avoid token limits if extremely huge
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "A concise summary of what the code does." },
            language: { type: Type.STRING, description: "The programming language detected." },
            riskLevel: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
            libraries: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of detected libraries or modules."
            },
            purpose: { type: Type.STRING, description: "The high-level goal of the script." },
            deobfuscatedSnippet: { type: Type.STRING, description: "A clean version of the key logic." }
          },
          required: ["summary", "language", "riskLevel", "libraries", "purpose"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from AI");
    
    return JSON.parse(resultText) as AnalysisResult;
  } catch (error: any) {
    console.error("Gemini Analysis Failed:", error);
    
    let errorMessage = "An error occurred during analysis.";
    
    if (error.toString().includes('403') || error.toString().includes('API_KEY_INVALID')) {
      errorMessage = "Invalid API Key. Please check your configuration.";
    } else if (error.toString().includes('429')) {
      errorMessage = "Rate limit exceeded (Quota full). Please try again later.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

export const generateWebsite = async (prompt: string): Promise<string> => {
  if (!prompt || prompt.trim().length === 0) {
    throw new Error("Prompt is empty.");
  }

  const systemInstruction = `
    You are an expert full-stack web developer and UI/UX designer.
    Your task is to generate a COMPLETE, SINGLE-FILE HTML solution (containing internal CSS and JS) based on the user's request.
    
    Rules:
    1. The code must be a valid HTML5 document.
    2. Include modern, beautiful CSS (use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>).
    3. Include interactive JavaScript if the prompt implies functionality.
    4. DO NOT return markdown formatting (no \`\`\`html or \`\`\`). 
    5. Return ONLY the raw code.
    6. Make it look professional, like a real deployed website.
    7. Ensure the design is responsive and modern.
    
    User Request: "${prompt}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    let code = response.text;
    if (!code) throw new Error("AI could not generate code.");

    // Improved cleanup: remove markdown code blocks if present
    code = code.replace(/```html/g, '').replace(/```/g, '').trim();
    
    return code;
  } catch (error: any) {
    console.error("Gemini Generation Failed:", error);
    throw new Error(error.message || "Failed to generate website. Please try again.");
  }
};

export const generateWebsiteFromImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
  if (!imageBase64) throw new Error("Image data is missing.");

  const systemInstruction = `
    You are an expert frontend engineer specializing in converting designs (images/screenshots) into clean, functional code.
    Your task is to recreate the website shown in the image as closely as possible in a SINGLE HTML file.
    
    Rules:
    1. Use Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>) for styling.
    2. Match the layout, colors, typography, and spacing from the image.
    3. Make it fully responsive.
    4. If the user provided additional instructions in the prompt, incorporate them.
    5. Return ONLY the raw HTML code. No markdown fences.
  `;

  try {
    // Using gemini-2.5-flash-latest for robust multimodal capabilities
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-latest",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: imageBase64
            }
          },
          {
            text: `Recreate this interface. ${prompt}`
          }
        ]
      },
      config: {
        systemInstruction: systemInstruction,
      }
    });

    let code = response.text;
    if (!code) throw new Error("AI could not generate code from image.");

    code = code.replace(/```html/g, '').replace(/```/g, '').trim();
    return code;
  } catch (error: any) {
    console.error("Gemini Image-to-Code Failed:", error);
    throw new Error(error.message || "Failed to generate website from image.");
  }
};