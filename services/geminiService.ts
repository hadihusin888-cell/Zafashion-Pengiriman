
import { GoogleGenerativeAI } from "@google/generative-ai";

export const parseAddressWithAI = async (rawText: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Parse the following Indonesian shipping address text into a structured JSON. 
    Text: "${rawText}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recipientName: { type: Type.STRING },
          phoneNumber: { type: Type.STRING },
          address: { type: Type.STRING },
          district: { type: Type.STRING },
          city: { type: Type.STRING },
          province: { type: Type.STRING },
          zipCode: { type: Type.STRING },
          itemName: { type: Type.STRING },
          itemQty: { type: Type.STRING },
          senderName: { type: Type.STRING },
          senderPhone: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                qty: { type: Type.STRING },
                value: { type: Type.NUMBER }
              }
            }
          }
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse AI response", e);
    throw new Error("Gagal mengolah teks. Coba format yang lebih jelas.");
  }
};
