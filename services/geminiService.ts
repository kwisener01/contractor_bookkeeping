
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedReceiptData, Job } from "../types";

export const processReceipt = async (base64Image: string, existingJobs: Job[], availableCategories: string[]): Promise<ExtractedReceiptData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const projectContext = existingJobs.map(j => 
    `ID: ${j.id}, Name: ${j.name}, Address: ${j.address}, Client: ${j.client}`
  ).join('\n');

  const prompt = `Analyze this receipt image for bookkeeping. Extract the merchant name, date, total amount (GROSS), tax amount, and a list of items. 
  Determine the most appropriate category from this specific list provided by the contractor: ${availableCategories.join(', ')}.
  
  SMART MAPPING:
  Look for references to project names, client names, or addresses. 
  Compare any found details to this list of existing projects:
  ${projectContext}
  
  If you find a strong match for the whole receipt or specific items, provide the corresponding "suggestedJobId" from the list above.
  If specific items seem to belong to DIFFERENT projects based on descriptions, assign the jobId at the item level.
  
  Return the data in clean JSON format.`;

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
          suggestedJobId: { type: Type.STRING },
          notes: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                jobId: { type: Type.STRING }
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
  
  // Ensure the AI picked a category from the allowed list
  if (!availableCategories.includes(result.category)) {
    result.category = availableCategories[0] || 'Other';
  }

  return result as ExtractedReceiptData;
};
