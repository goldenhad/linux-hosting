import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { auth } from "../../../../firebase/admin"
import { countFunction } from "../count";

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

      if( data.prompt){
                
        res.writeHead(200, {
          Connection: "keep-alive",
          "Content-Encoding": "none",
          "Cache-Control": "no-cache",
          "Content-Type": "text/event-stream"
        });

        try{
          const response = await openai.chat.completions.create( {
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: "Du bist ein Assistent zum Erstellen von Mails. Nutzer geben dir Informationen zu sich und ihrem Schreibstil, du erzeugst daraus eine E-Mail."+
                "Der Stil sollte sich am Nutzer orientieren. Daten, Fakten und Zahlen sollten immer unverändert wiedergegeben werden."
              },
              { 
                role: "user",
                content: data.prompt
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

          const tokenCountRequest = countFunction(data.prompt);
          const tokenCountResult = countFunction(text);
          
          return res.status(200).send(`<~${tokenCountResult + tokenCountRequest}~>`);
        }catch( E ){
          console.log(E);
          return res.status( 400 ).send( { errorcode: -2, message: "Error generating answer", tokens: -1 } );
        }
            
        

      }else{
        return res.status( 500 ).send( { errorcode: 3, message: "Missing Input!", tokens: -1 } );
      }

    }else{
      return res.status( 400 ).send( { errorcode: 2, message: "Authentication required!", tokens: -1 } );
    }
  }else{
    return res.status( 400 ).send( { errorcode: 1, message: "The request method is forbidden!", tokens: -1 } );
  }
}
