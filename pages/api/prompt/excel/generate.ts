import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../../firebase/admin"
import { AIMessage, AssistantResponse, generateAIResponse, Model } from "../../../../helper/prompt/generation";

/**
 * Route for generating responses to microsoft excel related questions
 * @param req Request object
 * @param res Response object
 */
export default async function handler( req: NextApiRequest, res: NextApiResponse<AssistantResponse | string> ) {
  const token = await auth.verifyIdToken( req.cookies.token );

  if( req.method == "POST" ){
    if( token ){
      const data = req.body;

      // Validate that the user provided a prompt
      if( data.prompt != undefined ){
        try{
          // Create the messages to send to the AI model
          const messages: Array<AIMessage>  = [
            {
              role: "system",
              content: "Du bist ein Agent und Beantwortest Fragen rund um das Thema Microsoft Excel."+
                      "Nutzer geben dir Informationen zu sich und eine Frage, du beantwortest diese Frage."+
                      "Die Antwort sollte auf den Nutzer zugeschnitten sein. Daten, Fakten und Zahlen sollten immer unverändert wiedergegeben werden."+
                      "Adressiere den Nutzer nicht direkt mit seinem Namen. Schreibe in der DU-Form"
            },
            {
              role: "user",
              content: data.prompt
            }
          ];

          // Call the model and get the used tokens back.
          const { count } = await generateAIResponse(Model.GPT4, messages, res, data )

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
