import { NextApiResponse, NextApiRequest } from "next";
import fs from "fs";
import path from "path";


export default function handler(
  _req: NextApiRequest,
  res: NextApiResponse<object>
) {
  const distPath = path.resolve(process.cwd(), "chatbot", "dist", "chatbot.js");
  const content = fs.readFileSync(distPath)
  res.writeHead(200, {
    "Content-Type": "text/javascript"
  });
  res.write(content);
  res.end();
}