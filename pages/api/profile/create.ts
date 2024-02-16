import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { auth } from "../../../firebase/admin"
import { parseProfilePrompt } from "../../../helper/prompt";
import getDocument from "../../../firebase/data/getData";

const openai = new OpenAI( {
  apiKey: process.env.OPENAIAPIKEY
} );

type ResponseData = {
    errorcode: number,
    message: string,
    tokens: number
}

/**
 * Route to create a new profile
 * @param req Request object
 * @param res Response object
 */
export default async function handler( req: NextApiRequest, res: NextApiResponse<ResponseData> ) {
  const token = await auth.verifyIdToken( req.cookies.token );

  if( req.method == "POST" ){
    if( token ){

      const data = req.body;

      // Validate that the user provided all necessary data
      if( data.name != undefined &&
         data.company != undefined &&
         data.position != undefined &&
         ((data.tasks != undefined &&
         data.knowledge != undefined) || data.isSingleUser ) &&
         data.communicationstyle != undefined &&
         data.isSingleUser != undefined
      ){

        // Get the profile templates from the database
        const templatereq = await getDocument( "Settings", "Prompts" );
        // Validate that we received the templates
        if( templatereq.result ){
          const template = templatereq.result.data();
          // Evaluate the template to use
          const promptToQuery = (data.isSingleUser)? template.singleuser: template.member;

          // Fill in the profile template
          const prompt = parseProfilePrompt(
            promptToQuery,
            data.name,
            data.company,
            data.position,
            data.tasks,
            data.knowledge,
            data.communicationstyle
          )

          try{
            // Move the filled in template over to the AI model
            const { data: completions } = await openai.chat.completions.create( {
              model: "gpt-4-1106-preview",
              messages: [
                {
                  role: "system",
                  content: "Du erhälst folgende Anfrage von einem Nutzer der sich beschreibt.\
                  Schreibe den Text in eine kurze Beschreibung der Person um und verwende die erhaltenen Wörter. Schreibe in der Ich-Form"
                },
                { 
                  role: "user",
                  content: prompt
                }]
            } ).withResponse();

            // After the response has transmitted successfully we send the data to the caller
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
