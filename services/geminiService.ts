
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedReceiptData, ExpenseCategory } from "../types";

export const processReceipt = async (base64Image: string): Promise<ExtractedReceiptData> => {
  // Use process.env.API_KEY directly as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Analyze this receipt image for bookkeeping. Extract the merchant name, date, total amount, tax, and a list of items. 
  Determine the most appropriate category from: ${Object.values(ExpenseCategory).join(', ')}.
  If there are any interesting details, handwritten notes, or specific project references on the receipt, include them in a "notes" field.
  Return the data in a clean JSON format.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(',')[1] || base64Image
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          merchantName: { type: Type.STRING },
          date: { type: Type.STRING },
          totalAmount: { type: Type.NUMBER },
          taxAmount: { type: Type.NUMBER },
          currency: { type: Type.STRING },
          category: { type: Type.STRING },
          notes: { type: Type.STRING, description: "Additional context or details from the receipt" },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                amount: { type: Type.NUMBER }
              },
              required: ["description", "amount"]
            }
          }
        },
        required: ["merchantName", "totalAmount", "category"]
      }
    }
  });

  const result = JSON.parse(response.text || "{}");
  
  // Clean up and validate category
  if (!Object.values(ExpenseCategory).includes(result.category as ExpenseCategory)) {
    result.category = ExpenseCategory.OTHER;
  }

  return result as ExtractedReceiptData;
};
