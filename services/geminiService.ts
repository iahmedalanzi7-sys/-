import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, Scenario, UserProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Scenario Generation ---

const scenarioSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    role: { type: Type.STRING },
    objective: { type: Type.STRING },
    counterpart: { type: Type.STRING },
    difficulty: { type: Type.STRING },
    keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["title", "description", "role", "objective", "counterpart", "keyPoints"],
};

export const generateScenario = async (profile: UserProfile): Promise<Scenario> => {
  const prompt = `
    You are an expert educational curriculum designer for university students.
    Create a realistic, professional roleplay case study (scenario) for a student.
    
    Student Major: ${profile.major}
    Target Soft Skill: ${profile.targetSkill}
    Language: Arabic (Output must be in Arabic).

    Requirements:
    1. The scenario should be specific to their field of study but focus on the soft skill.
    2. IMPORTANT: Keep the 'description' field VERY CONCISE and BRIEF (max 3-4 sentences). Get straight to the point.
    3. The content must be high quality and realistic, just written briefly.
    
    Example: Law student + Negotiation -> Settlement conference.
    Example: Engineering + Leadership -> Managing a site delay with contractors.
    
    Make it challenging but achievable.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: scenarioSchema,
        systemInstruction: "You are a professional corporate trainer. Output strictly in JSON format. Keep descriptions concise.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No text returned");
    return JSON.parse(text) as Scenario;
  } catch (error) {
    console.error("Scenario Generation Error:", error);
    throw error;
  }
};

// --- Performance Analysis ---

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.INTEGER },
    summary: { type: Type.STRING },
    toneAnalysis: {
      type: Type.OBJECT,
      properties: {
        label: { type: Type.STRING },
        description: { type: Type.STRING }
      }
    },
    bodyLanguageAnalysis: {
      type: Type.OBJECT,
      properties: {
        eyeContact: { type: Type.STRING },
        posture: { type: Type.STRING },
        gestures: { type: Type.STRING }
      }
    },
    skillScores: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          skill: { type: Type.STRING },
          score: { type: Type.INTEGER },
          feedback: { type: Type.STRING }
        }
      }
    },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
    nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["overallScore", "summary", "toneAnalysis", "bodyLanguageAnalysis", "skillScores", "strengths", "weaknesses", "nextSteps"]
};

export const analyzePerformance = async (
  profile: UserProfile,
  scenario: Scenario,
  audioBase64: string,
  imageFrames: string[] // Array of base64 images
): Promise<AnalysisResult> => {
  
  const prompt = `
    Act as a world-class communication coach and behavioral psychologist.
    Analyze this recorded session of a university student practicing a soft skill scenario.
    
    Student Context:
    - Major: ${profile.major}
    - Skill: ${profile.targetSkill}
    - Scenario: ${scenario.title} (${scenario.description})
    - Objective: ${scenario.objective}

    Inputs provided:
    1. Audio recording of their speech.
    2. Video frames (screenshots) from their camera to analyze body language.

    Task:
    Evaluate their performance based on:
    1. Voice: Tone, confidence, pacing, clarity.
    2. Body Language: Eye contact, posture, professional demeanor.
    3. Content: Logic, persuasion, relevance to the scenario (Did they solve the problem?).
    
    Provide output in Arabic.
    Be constructive, encouraging, but honest.
  `;

  const parts: any[] = [{ text: prompt }];

  // Add Audio
  parts.push({
    inlineData: {
      mimeType: "audio/wav", 
      data: audioBase64
    }
  });

  // Add Video Frames (Limit to max 5 to save context/bandwidth if necessary, but 2.5 Flash handles many)
  // We will take up to 10 frames evenly distributed
  const framesToUse = imageFrames.length > 10 
    ? imageFrames.filter((_, i) => i % Math.ceil(imageFrames.length / 10) === 0) 
    : imageFrames;

  framesToUse.forEach(frame => {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: frame
      }
    });
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: analysisSchema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No analysis returned");
    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};