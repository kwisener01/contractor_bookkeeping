
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedReceiptData, ExpenseCategory, Job } from "../types";

export const processReceipt = async (base64Image: string, existingJobs: Job[]): Promise<ExtractedReceiptData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Create a context string of existing projects for the AI to map against
  const projectContext = existingJobs.map(j => 
    `ID: ${j.id}, Name: ${j.name}, Address: ${j.address}, Client: ${j.client}`
  ).join('\n');

  const prompt = `Analyze this receipt image for bookkeeping. Extract the merchant name, date, total amount, tax, and a list of items. 
  Determine the most appropriate category from: ${Object.values(ExpenseCategory).join(', ')}.
  
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
          suggestedJobId: { type: Type.STRING, description: "The ID of the project this receipt likely belongs to" },
          notes: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                jobId: { type: Type.STRING, description: "Suggested project ID for this specific item if it differs from the main receipt" }
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
  
  if (!Object.values(ExpenseCategory).includes(result.category as ExpenseCategory)) {
    result.category = ExpenseCategory.OTHER;
  }

  return result as ExtractedReceiptData;
};
