import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { auth } from "../../../../firebase/admin"
import getDocument from "../../../../firebase/data/getData";
import { parseMonologPrompt } from "../../../../helper/prompt";

const openai = new OpenAI( {
  apiKey: process.env.OPENAIAPIKEY
} );

type ResponseData = {
    errorcode: number,
    message: string,
    tokens: number
}


export default async function handler( req: NextApiRequest, res: NextApiResponse<ResponseData> ) {
  const token = await auth.verifyIdToken( req.cookies.token );

  if( req.method == "POST" ){
        
    if( token ){

      const data = req.body;

      if( data.name && data.personal && data.content && data.address && data.order && data.style && data.emotions && data.length && data.company ){

        const templatereq = await getDocument( "Settings", "Prompts" );
        
        if( templatereq.result ){
          const template = templatereq.result.data();

          const prompt = parseMonologPrompt(
            template.monolog,
            data.name,
            data.company,
            data.personal,
            data.content,
            data.address,
            data.style,
            data.order,
            data.emotions,
            data.length
          )

          try{
            const { data: completions } = await openai.chat.completions.create( {
              model: "gpt-4-1106-preview",
              messages: [
                { 
                  role: "user",
                  content: prompt
                }]
            } ).withResponse();
      
            if( completions ){
              if( completions.choices.length >= 1 ){
                if( completions.choices[0].message ){
                  if( completions.choices[0].message.content ){
              
                    return res.status( 200 ).send( {
                      errorcode: 0,
                      message: completions.choices[0].message.content,
                      tokens: ( completions.usage?.total_tokens )? completions.usage?.total_tokens: -1
                    } );
                  }
                }
              }
            }
                      
            return res.status( 400 ).send( { errorcode: -1, message: "Error generating answer", tokens: -1 } );
          }catch( E ){
            //console.log(E);
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
