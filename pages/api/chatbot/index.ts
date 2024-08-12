import { NextApiResponse, NextApiRequest } from "next";
import fs from "fs";
import path from "path";
import { getAssistants } from "../assistant/getAll";


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<object>
) {
  const searchParams = req.query;
  const agentid = searchParams["agentid"] as string;
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
    AGENTID: agentid
  })};`;
  const contentWithConfig = [configContents, content].join("");
  res.writeHead(200, {
    "Content-Type": "text/javascript"
  });
  res.write(contentWithConfig);
  res.end();
}