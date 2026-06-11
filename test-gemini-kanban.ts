import { GoogleGenAI, Type } from "@google/genai";
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
async function main() {
  const chat = ai.chats.create({
    model: "gemini-1.5-flash",
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
  const result = await chat.sendMessage("Crie uma tarefa no kanban para comprar café");
  console.log(JSON.stringify(result.functionCalls, null, 2));
}
main();
