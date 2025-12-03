import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface AnalyzedFood {
  foodName: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  estimatedWeightGrams: number;
}

const foodAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    foodName: { type: Type.STRING },
    calories: { type: Type.NUMBER },
    protein: { type: Type.NUMBER, description: "in grams" },
    fat: { type: Type.NUMBER, description: "in grams" },
    carbs: { type: Type.NUMBER, description: "in grams" },
    estimatedWeightGrams: { type: Type.NUMBER },
  },
  required: ["foodName", "calories", "protein", "fat", "carbs", "estimatedWeightGrams"],
};

export const analyzeFoodImage = async (base64Image: string): Promise<AnalyzedFood | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: "Analyze this food image. Identify the main dish. Estimate the calories, protein, fat, and carbs for the portion shown. Return strictly JSON.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: foodAnalysisSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as AnalyzedFood;
    }
    return null;
  } catch (error) {
    console.error("Error analyzing food:", error);
    return null;
  }
};

export const analyzeFoodText = async (text: string): Promise<AnalyzedFood | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            text: `Analyze this food description: "${text}". Identify the main dish. Estimate the calories, protein, fat, and carbs for the portion described or implied. Return strictly JSON.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: foodAnalysisSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as AnalyzedFood;
    }
    return null;
  } catch (error) {
    console.error("Error analyzing food text:", error);
    return null;
  }
};
