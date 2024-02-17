// Import necessary modules and types
import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../../firebase/admin";
import { AIMessage, AssistantResponse, generateAIResponse, Model } from "../../../../helper/prompt/generation";



/**
 * Route for creating content for the blog assistant
 * @param req request Object
 * @param res reponse Object
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse<AssistantResponse | string>) {
  // Verify the user's authentication token
  const token = await auth.verifyIdToken(req.cookies.token);

  // Check if the request method is POST
  if (req.method == "POST") {
    // Check if the user is authenticated
    if (token) {
      // Extract data from the request body
      const data = req.body;

      // Check if required data fields are present in the request
      if (data.prompt) {
        try{
          const messages: Array<AIMessage>  = [
            {
              role: "system",
              content: "Du bist ein Assistent zum Erstellen von Blog Beiträgen. Nutzer geben dir Informationen zu sich und ihrem Schreibstil,"+
                  "du erzeugst daraus einen Blockbeitrag."
            },
            {
              role: "user",
              content: data.prompt as string
            }
          ]

          const { count } = await generateAIResponse(Model.GPT4, messages, res, data )

          // Send a response with token counts
          return res.status(200).send(`<~${count.response + count.request}~>`);
        } catch (E) {
          // Handle errors during the OpenAI request
          console.log(E);
          return res.status(400).send({ errorcode: -2, message: "Error generating answer", tokens: -1 });
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