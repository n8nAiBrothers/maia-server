import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
async function main() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "hello world"
    });
    console.log("generateContent success:", response.text);
  } catch(e) {
    console.error("generateContent error:", e);
  }
}
main();
