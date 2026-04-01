import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateResearchResponse(prompt: string, history: any[] = []) {
  const model = "gemini-3.1-pro-preview";
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        ...history,
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are a world-class research assistant. Provide deep, synthesized insights with clear source citations. Focus on accuracy and depth.",
      },
    });

    return {
      text: response.text || "No response generated.",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        id: Math.random().toString(36).substring(7),
        title: chunk.web?.title || 'Source',
        url: chunk.web?.uri || '',
      })) || []
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
