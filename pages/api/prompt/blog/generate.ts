// Import necessary modules and types
import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { auth } from "../../../../firebase/admin";
import getDocument from "../../../../firebase/data/getData";
import { parseBlogPrompt } from "../../../../helper/prompt";
import { encode } from "gpt-tokenizer";

// Create an instance of the OpenAI class with the API key
const openai = new OpenAI({
  apiKey: process.env.OPENAIAPIKEY
});

// Define the response data type
type ResponseData = {
  errorcode: number,
  message: string,
  tokens: number
}

// Define the request handler function
export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData | string>) {
  // Verify the user's authentication token
  const token = await auth.verifyIdToken(req.cookies.token);

  // Check if the request method is POST
  if (req.method == "POST") {
    // Check if the user is authenticated
    if (token) {
      // Extract data from the request body
      const data = req.body;

      // Check if required data fields are present in the request
      if (
        data.content != undefined &&
        data.order != undefined &&
        data.style != undefined &&
        data.length != undefined &&
        data.company != undefined
      ) {
        // Retrieve the template for prompts from the database
        const templatereq = await getDocument("Settings", "Prompts");

        // Check if the template request was successful
        if (templatereq.result) {
          // Extract the template data
          const template = templatereq.result.data();

          // Generate a blog prompt using the provided data
          const prompt = parseBlogPrompt(
            template.blog,
            data.company,
            data.content,
            data.style,
            data.order,
            data.length
          )

          // Set response headers for Server-Sent Events
          res.writeHead(200, {
            Connection: "keep-alive",
            "Content-Encoding": "none",
            "Cache-Control": "no-cache",
            "Content-Type": "text/event-stream"
          });

          try {
            // Request completion from OpenAI GPT-4 model
            const response = await openai.chat.completions.create({
              model: "gpt-4-1106-preview",
              messages: [
                {
                  role: "system",
                  content: "Du bist ein Assistent zum Erstellen von Blog Beiträgen. Nutzer geben dir Informationen zu sich und ihrem Schreibstil, du erzeugst daraus einen Blockbeitrag."
                },
                {
                  role: "user",
                  content: prompt
                }
              ],
              stream: true
            });

            // Process and send chunks of response
            let text = "";
            for await (const chunk of response) {
              const singletoken = chunk.choices[0].delta.content || "";
              res.write(singletoken);
              res.flushHeaders();
              if (chunk.choices[0].finish_reason === "stop") {
                console.log("stop!!");
              }
              text += singletoken;
            }

            // Calculate token counts for prompt and response
            const tokenCountRequest = encode(prompt).length;
            const tokenCountResult = encode(text).length;

            // Send a response with token counts
            return res.status(200).send(`<~${tokenCountResult + tokenCountRequest}~>`);
          } catch (E) {
            // Handle errors during the OpenAI request
            console.log(E);
            return res.status(400).send({ errorcode: -2, message: "Error generating answer", tokens: -1 });
          }
        } else {
          return res.status(400).send({ errorcode: -3, message: "Error generating answer", tokens: -1 });
        }
      } else {
        return res.status(400).send({ errorcode: 3, message: "Missing Input!", tokens: -1 });
      }
    } else {
      return res.status(400).send({ errorcode: 2, message: "Authentication required!", tokens: -1 });
    }
  } else {
    return res.status(400).send({ errorcode: 1, message: "The request method is forbidden!", tokens: -1 });
  }
}