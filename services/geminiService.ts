import { GoogleGenAI } from "@google/genai";
import { RocketConfig, SimulationState } from '../types';

const ai = new GoogleGenAI({ apiKey: "AIzaSyDkd_4zo4rCa0g_wBuwh9bO7MTm9GK7dlU" });

export const analyzeMission = async (
  config: RocketConfig,
  finalState: SimulationState,
  history: Partial<SimulationState>[]
): Promise<string> => {
  try {
    const prompt = `
      Act as a senior aerospace engineer. Analyze the following 2-stage rocket launch simulation.
      
      Stage 1 (Booster):
      - Thrust: ${config.stage1.thrust} N
      - Fuel: ${config.stage1.fuelMass} kg

      Stage 2 (Upper):
      - Thrust: ${config.stage2.thrust} N
      - Fuel: ${config.stage2.fuelMass} kg

      Outcomes:
      - Max Alt: ${finalState.maxAltitude.toFixed(0)} m
      - Max Vel: ${finalState.maxVelocity.toFixed(0)} m/s
      - Final Status: ${finalState.phase}

      Provide:
      1. Flight Summary.
      2. Stage separation efficiency comment.
      3. Tips to reach higher orbit.
      
      Keep it under 150 words.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Analysis unavailable.";
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return "Mission Control AI offline.";
  }
};

export const getDesignAdvice = async (currentConfig: RocketConfig, userQuery: string): Promise<string> => {
   try {
    const prompt = `
      User Query: "${userQuery}"

      Rocket Specs:
      - S1 Thrust: ${currentConfig.stage1.thrust} N
      - S2 Thrust: ${currentConfig.stage2.thrust} N
      
      Provide a short physics tip (max 2 sentences).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "No advice available.";
   } catch (error) {
     return "Advice module offline.";
   }
}