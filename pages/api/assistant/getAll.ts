// Import necessary modules and types
import type { NextApiRequest, NextApiResponse } from "next";
import cors from "cors";
import Assistant, { Visibility } from "../../../lib/firebase/types/Assistant";
import { getAllDocs } from "../../../lib/firebase/data/getData";
import { corsMiddleware } from "../chatbot";
import { validateApiKey } from "../../../lib/helper/api/apiKey";


// Define the response data type
type ResponseData = {
  errorcode: number,
  message: Assistant[] | string
}

export const getAssistants = async (assistantId?: string): Promise<Assistant[] | Assistant | undefined> => {
  const assistantReq = await getAllDocs("Assistants");
  if (assistantId) {
    return assistantReq.result.find((assistant) => assistant.visibility === Visibility.ALL && assistant.uid === assistantId);
  } else if (assistantReq.result) {
    return assistantReq.result.filter((assistant) => assistant.visibility === Visibility.ALL);
  }
}
// Define the request handler function
export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData | string>) {

  const options: Partial<typeof cors> = {
    origin: req.headers["origin"]
  };
  const apiKey = req.headers["x-api-key"] as string;
  const assistantId = req.headers["x-assistant-id"] as string;

  await corsMiddleware(req, res, options)
  await validateApiKey(apiKey);
  // Check if the request method is GET
  if (req.method == "GET") {

    let assistants = await getAssistants(assistantId);

    if (assistants && !Array.isArray(assistants)) {
      assistants = [assistants];
    } else {
      assistants = []
    }
    return res.status(200).json({ errorcode: null, message: assistants });
  } else {
    return res.status(400).send({ errorcode: 1, message: "The request method is forbidden!" });
  }
}