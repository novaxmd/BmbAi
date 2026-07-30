import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// ImageKit Credentials (Note: In production, keep private keys on backend)
const IK_PUBLIC_KEY = "public_W8pXprjPHYrYwlWMf811dtUm2Og=";
const IK_PRIVATE_KEY = "private_Wu/w/ZEmydjv/FbRgVKOffRxtNY=";
const IK_ENDPOINT = "https://ik.imagekit.io/19imy4f1u";

export const uploadToImageKit = async (file: Blob): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', `compressed_${Date.now()}.jpg`);
  formData.append('publicKey', IK_PUBLIC_KEY);

  try {
    const res = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: { 'Authorization': 'Basic ' + btoa(IK_PRIVATE_KEY + ':') },
      body: formData
    });

    const data = await res.json();
    if (!data.url) throw new Error("Upload Failed: " + (data.message || "Unknown error"));
    return data.url;
  } catch (error: any) {
    throw new Error(error.message || "Image upload failed");
  }
};

export const generateAIImage = async (prompt: string): Promise<string> => {
  try {
    // Using gemini-2.5-flash-image (Nano Banana) for generation
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: prompt }
        ],
      },
      config: {
        // No responseMimeType for image generation models
      },
    });

    // Iterate to find the image part
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
           return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image data received from AI.");
  } catch (error: any) {
    console.error("Image Gen Error:", error);
    throw new Error(error.message || "Failed to generate image.");
  }
};

export const extractPromptFromImage = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Multimodal capable
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType
            }
          },
          {
            text: `
              Analyze this image in extreme detail as if you are a professional photographer and prompt engineer. 
              Provide a comprehensive text-to-image prompt that includes:
              1. The main subject and action (detailed description).
              2. The artistic style (e.g., Cyberpunk, Oil Painting, 3D Render, Photorealistic).
              3. Lighting conditions (e.g., volumetric lighting, golden hour, neon lights).
              4. Camera settings (e.g., 85mm lens, f/1.8, 4k, bokeh).
              5. Color palette and mood.
              
              Output ONLY the prompt text, no intro/outro. Make it ready to copy-paste into an AI generator.
            `
          }
        ]
      }
    });

    return response.text || "Could not analyze image.";
  } catch (error: any) {
    console.error("Prompt Extract Error:", error);
    throw new Error(error.message || "Failed to extract prompt.");
  }
};