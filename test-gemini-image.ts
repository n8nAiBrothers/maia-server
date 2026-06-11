import { GoogleGenAI } from "@google/genai";
import fs from "fs";
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
async function main() {
  try {
    const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { text: "What is this image?" },
        { inlineData: { mimeType: "image/png", data: base64Data } }
      ]
    });
    console.log("Image response:", response.text);
  } catch (e) {
    console.error("Image error:", e);
  }
}
main();
