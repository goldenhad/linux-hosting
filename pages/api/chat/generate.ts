import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../lib/firebase/admin"
import {
  AIMessage,
  AssistantResponse,
  generateChatResponse,
  Model
} from "../../../lib/helper/prompt/generation";


/**
 * Translator assistant route.
 * @param req Request object
 * @param res Response object
 */
export default async function handler( req: NextApiRequest, res: NextApiResponse<AssistantResponse | string> ) {
  const token = await auth.verifyIdToken( req.cookies.token );

  if( req.method == "POST" ){
    if( token ){
      const data = req.body;

      // Validate that the user provided a prompt
      if( data.msgContext != undefined ){
        try{
          // Create the messages to send to the AI model
          const messages: Array<AIMessage> = data.msgContext;

          // Convert the messages to system messages so the ai only answers the last question
          messages.forEach((msg: AIMessage, idx: number) => {
            if(idx < messages.length - 1 && msg.role == "user"){
              msg.role = "system";
            }
          });

          // Call the model and get the used tokens back.
          const { count } = await generateChatResponse(Model.GPT4, messages, res )

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
