import OpenAI from "openai";
import type { NextApiResponse } from "next";
import { encode } from "gpt-tokenizer";

export type AssistantResponse = {
    errorcode: number,
    message: string,
    tokens: number
}

type InputData = {
    prompt: string,
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export enum Model {
    GPT4 = "gpt-4-1106-preview",
    GPT3 = "gpt-3.5-turbo"
}

export type AIMessage = {
    role: "function" | "system" | "user" | "assistant",
    content: string
}

export async function generateAIResponse(
  model: Model,
  messages: AIMessage[],
  apiResponse: NextApiResponse<AssistantResponse | string>,
  data: InputData
){

  apiResponse.writeHead(200, {
    Connection: "keep-alive",
    "Content-Encoding": "none",
    "Cache-Control": "no-cache",
    "Content-Type": "text/event-stream"
  }); 
    
  const response = await openai.chat.completions.create({
    model: model,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    messages: messages,
    stream: true
  });  
    
  // Process and send chunks of response
  let text = "";
  for await (const chunk of response) {
    const singletoken = chunk.choices[0].delta.content || "";
    apiResponse.write(singletoken);
    apiResponse.flushHeaders();
    if (chunk.choices[0].finish_reason === "stop") {
      console.log("stop!!");
    }
    text += singletoken;
  }

  const tokenCountRequest = countFunction(data.prompt);
  const tokenCountResult = countFunction(text);

  return { count: { request: tokenCountRequest, response: tokenCountResult } }
}

export async function generateChatResponse(
  model: Model,
  messages: Array<AIMessage>,
  apiResponse: NextApiResponse<AssistantResponse | string>
){

  apiResponse.writeHead(200, {
    Connection: "keep-alive",
    "Content-Encoding": "none",
    "Cache-Control": "no-cache",
    "Content-Type": "text/event-stream"
  });


  const response = await openai.chat.completions.create({
    model: model,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    messages: messages,
    stream: true
  });

  // Process and send chunks of response
  let text = "";
  for await (const chunk of response) {
    const singletoken = chunk.choices[0].delta.content || "";
    apiResponse.write(singletoken);
    apiResponse.flushHeaders();
    if (chunk.choices[0].finish_reason === "stop") {
      console.log("stop!!");
    }
    text += singletoken;
  }

  const tokenCountRequest = countFunction(messages[messages.length-1].content);
  const tokenCountResult = countFunction(text);

  return { count: { request: tokenCountRequest, response: tokenCountResult } }
}

export function countFunction(input: string){
  return encode(input).length;
}