import { GoogleGenAI, Type } from "@google/genai";
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: "Crie uma tarefa no kanban para comprar café",
    config: {
      tools: [{
        functionDeclarations: [
          {
            name: 'createKanbanTask',
            description: 'Cria uma tarefa (Card) no Kanban.',
            parameters: {
              type: Type.OBJECT,
              properties: { title: { type: Type.STRING } },
              required: ['title'],
            },
          }
        ]
      }]
    }
  });
  console.log(JSON.stringify(response.functionCalls, null, 2));
}
main();
