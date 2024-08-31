import { NextApiResponse, NextApiRequest } from "next";
import fs from "fs";
import path from "path";
import cors from "cors";
import { getAssistants } from "../assistant/getAll";
import { validateApiKey } from "../../../lib/helper/api/apiKey";

export const corsMiddleware = <T = any>(
  req: NextApiRequest,
  res: NextApiResponse<T>,
  options : typeof cors
) => {

  return new Promise((resolve, reject)=>{
    cors(options)(req, res, (result: Error)=>{
      if(result instanceof Error){
        return reject(result);
      }

      return resolve(result);
    })
  })
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<object>
) {
  const searchParams = req.query;
  const agentid = searchParams["agentid"] as string;
  const apiKey = searchParams["apiKey"] as string;
  const options: Partial< typeof cors>  = {
    origin: req.headers["origin"]
  };
  await corsMiddleware(req, res, options);
  await validateApiKey(apiKey);
  
  const assistant =  await getAssistants(agentid);

  if(!assistant){
    res.writeHead(400, {
      "Content-Type": "text/html"
    });
    res.write("Invalid Agent Id");
    return res.end(); 
  }
  const distPath = path.resolve(process.cwd(), "chatbot", "dist", "chatbot.js");
  const content = fs.readFileSync(distPath);
  const configContents = `window.SITEWARE_CONFIG = ${JSON.stringify({
    AGENTID: agentid,
    APIKEY: apiKey
  })};`;
  const contentWithConfig = [configContents, content].join("");
  res.writeHead(200, {
    "Content-Type": "text/javascript"
  });
  res.write(contentWithConfig);
  res.end();
}