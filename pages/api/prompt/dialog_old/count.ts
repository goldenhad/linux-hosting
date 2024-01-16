import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../../firebase/admin"
import getDocument from "../../../../firebase/data/getData";
import { parseDialogPrompt } from "../../../../helper/prompt";
import {
  encode
} from "gpt-tokenizer"


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
        data.dialog != undefined &&
        data.continue != undefined &&
        data.address != undefined &&
        data.style != undefined &&
        data.order != undefined &&
        data.emotions != undefined &&
        data.length != undefined &&
        data.company != undefined
      ){

        const templatereq = await getDocument( "Settings", "Prompts" );
        
        if( templatereq.result ){
          const template = templatereq.result.data();

          const prompt = parseDialogPrompt(
            template.dialog,
            data.name,
            data.company,
            data.personal,
            data.dialog,
            data.continue,
            data.address,
            data.style,
            data.order,
            data.emotions,
            data.length
          )


          const tokenEncoded = encode(prompt).length;
          
            
          return res.status(200).send({ errorcode: 0, message: "OK", tokens: tokenEncoded });
                      
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
