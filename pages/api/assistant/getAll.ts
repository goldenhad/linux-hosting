// Import necessary modules and types
import type { NextApiRequest, NextApiResponse } from "next";
import Assistant, { Visibility } from "../../../firebase/types/Assistant";
import { getAllDocs } from "../../../firebase/data/getData";


// Define the response data type
type ResponseData = {
  errorcode: number,
  message: Assistant[] | string
}

export const getAssistants = async (assistantId?: string): Promise<Assistant[] | Assistant | undefined> => {
  const assistantReq = await getAllDocs("Assistants");
  if(assistantId){
    return assistantReq.result.find((assistant) => assistant.visibility === Visibility.ALL && assistant.uid === assistantId);
  }else if (assistantReq.result) {
    return assistantReq.result.filter((assistant) => assistant.visibility === Visibility.ALL);
  }
} 
// Define the request handler function
export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData | string>) {

  // Check if the request method is GET
  if (req.method == "GET") {

    const assistants = await getAssistants() as Assistant[];

    return res.status(200).json({ errorcode: null, message: assistants });
  } else {
    return res.status(400).send({ errorcode: 1, message: "The request method is forbidden!" });
  }
}