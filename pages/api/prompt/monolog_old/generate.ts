import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../../firebase/admin"
import { AIMessage, AssistantResponse, generateAIResponse, Model } from "../../../../helper/prompt/generation";


/**
 * Route for generating single email response to user input. USES GPT 3.5
 * @param req Request object
 * @param res Response object
 */
export default async function handler( req: NextApiRequest, res: NextApiResponse<AssistantResponse | string> ) {
  const token = await auth.verifyIdToken( req.cookies.token );

  if( req.method == "POST" ){
    if( token ){
      const data = req.body;

      // Validate that a prompt was provided
      if( data.prompt != undefined ){

        // Create the messages to send to the AI
        try{
          const messages: Array<AIMessage>  = [
            {
              role: "system",
              content: "Du bist ein Assistent zum Erstellen von Mails. Nutzer geben dir Informationen zu sich und ihrem Schreibstil, du erzeugst daraus eine E-Mail."+
                  "Der Stil sollte sich am Nutzer orientieren. Daten, Fakten und Zahlen sollten immer unverändert wiedergegeben werden."
            },
            {
              role: "user",
              content: data.prompt
            }
          ];

          // Generate an answer using the AI and get the used tokens
          const { count } = await generateAIResponse(Model.GPT3, messages, res, data )

          // Send a response with token counts
          return res.status(200).send(`<~${count.response + count.request}~>`);
        }catch( E ){
          console.log(E);
          return res.status( 400 ).send( { errorcode: -2, message: "Error generating answer", tokens: -1 } );
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
