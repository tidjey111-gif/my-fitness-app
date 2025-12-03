
import { GoogleGenAI, Type } from "@google/genai";

// Helper to get the client dynamically so it picks up localStorage changes
const getAiClient = () => {
  const apiKey = localStorage.getItem('gemini_api_key') || process.env.API_KEY;
  if (!apiKey) {
    console.warn("No API Key found. AI features will not work.");
    // Return a dummy object or throw to handle gracefully in UI, 
    // but the SDK might throw if initialized with empty key.
    // We'll initialize with empty string and let calls fail if no key.
    return new GoogleGenAI({ apiKey: '' });
  }
  return new GoogleGenAI({ apiKey });
};

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
    foodName: { type: Type.STRING, description: "Name of the food in Russian language" },
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
    const ai = getAiClient();
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
            text: "Analyze this food image. Identify the main dish. Estimate the calories, protein, fat, and carbs for the portion shown. Return strictly JSON. IMPORTANT: The 'foodName' field MUST be in Russian language.",
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
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            text: `Analyze this food description: "${text}". 
            Identify the main dish. 
            Estimate the nutritional values (calories, protein, fat, carbs) for the portion described. 
            If no portion is specified, assume 100 grams.
            Return strictly JSON.
            IMPORTANT: The 'foodName' field MUST be in Russian language.`,
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

export const generateFoodThumbnail = async (foodName: string): Promise<string | null> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: {
        parts: [
          {
            text: `Create a realistic, appetizing, square food photography thumbnail of ${foodName}. 
            Professional lighting, dark background, top-down view. High quality.`,
          },
        ],
      },
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64String = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          return `data:${mimeType};base64,${base64String}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating food image:", error);
    return null;
  }
};
