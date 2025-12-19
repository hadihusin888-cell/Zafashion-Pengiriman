
import { GoogleGenAI, Type } from "@google/generative-ai";

export const parseAddressWithAI = async (rawText: string): Promise<any> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extract shipping details from the text. 
      If the text contains "Dari:" or "Pengirim:", extract that as sender info. 
      Otherwise, assume the main info is the Recipient.
      Extract items if listed (name, qty).
      
      Raw Text: "${rawText}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            // Sender
            senderName: { type: Type.STRING },
            senderPhone: { type: Type.STRING },
            // Recipient
            recipientName: { type: Type.STRING },
            phoneNumber: { type: Type.STRING, description: "Recipient phone number" },
            address: { type: Type.STRING, description: "Street, House No, RT/RW" },
            district: { type: Type.STRING, description: "Kecamatan" },
            city: { type: Type.STRING, description: "Kabupaten/Kota" },
            province: { type: Type.STRING },
            zipCode: { type: Type.STRING },
            // Details
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
            },
            note: { type: Type.STRING },
            courier: { type: Type.STRING },
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    console.error("Gemini AI Parsing Error:", error);
    throw error;
  }
};
