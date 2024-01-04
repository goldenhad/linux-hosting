import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { auth } from "../../../../firebase/admin"
import getDocument from "../../../../firebase/data/getData";
import {
  encode
} from "gpt-tokenizer"
import { parseExcelPrompt } from "../../../../helper/prompt";

const openai = new OpenAI( {
  apiKey: process.env.OPENAIAPIKEY
} );

type ResponseData = {
    errorcode: number,
    message: string,
    tokens: number
}


export default async function handler( req: NextApiRequest, res: NextApiResponse<ResponseData | string> ) {
  const token = await auth.verifyIdToken( req.cookies.token );

  if( req.method == "POST" ){
        
    if( token ){

      const data = req.body;

      if( data.name != undefined &&
        data.personal != undefined &&
        data.question != undefined &&
        data.company != undefined
      ){

        const templatereq = await getDocument( "Settings", "Prompts" );
        
        if( templatereq.result ){
          const template = templatereq.result.data();

          const prompt = parseExcelPrompt(
            template.excel,
            data.name,
            data.company,
            data.personal,
            data.question
          )

          console.log(data.personal);

          res.writeHead(200, {
            Connection: "keep-alive",
            "Content-Encoding": "none",
            "Cache-Control": "no-cache",
            "Content-Type": "text/event-stream"
          });

          try{
            
            const response = await openai.chat.completions.create( {
              model: "gpt-4-1106-preview",
              messages: [
                {
                  role: "system",
                  content: "Du bist ein Assistent und Beantwortest Fragen rund um das Thema Microsoft Excel."+
                  "Nutzer geben dir Informationen zu sich und eine Frage, du beantwortest diese Frage."+
                  "Die Antwort sollte auf den Nutzer zugeschnitten sein. Daten, Fakten und Zahlen sollten immer unverändert wiedergegeben werden."+
                  "Adressiere den Nutzer nicht direkt mit seinem Namen. Schreibe in der DU-Form"
                },
                { 
                  role: "user",
                  content: prompt
                }],
              stream: true
            } );
            
            let text = "";
            for await (const chunk of response) {
              //console.log(chunk.choices[0].delta.content || "");
              const singletoken = chunk.choices[0].delta.content || "";
              res.write(singletoken);
              res.flushHeaders();
              if (chunk.choices[0].finish_reason === "stop") {
                console.log("stop!!")
              }
              text += singletoken;
            }
  
            const tokenCountRequest = encode(prompt).length;
            const tokenCountResult = encode(text).length;
            
            return res.status(200).send(`<~${tokenCountResult + tokenCountRequest}~>`);
                      
          }catch( E ){
            console.log(E);
            return res.status( 400 ).send( { errorcode: -2, message: "Error generating answer", tokens: -1 } );
          }
        }else{
          return res.status( 400 ).send( { errorcode: -3, message: "Error generating answer", tokens: -1 } );
        }
      }else{
        return res.status( 400 ).send( { errorcode: 3, message: "Missing Input!", tokens: -1 } );
      }

    }else{
      return res.status( 400 ).send( { errorcode: 2, message: "Authentication required!", tokens: -1 } );
    }
  }else{
    return res.status( 400 ).send( { errorcode: 1, message: "The request method is forbidden!", tokens: -1 } );
  }
}
