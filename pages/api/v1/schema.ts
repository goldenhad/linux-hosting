import type { NextApiRequest, NextApiResponse } from "next";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import ResponseData = Dispatcher.ResponseData;
import { validateApiKey } from "../../../helper/api/apiKey";
import { firestore } from "../../../firebase/admin";
import Assistant, { AssistantType, InputBlock } from "../../../firebase/types/Assistant";



export default async function handler( req: NextApiRequest, res: NextApiResponse<ResponseData> ) {
  if(req.method == "GET"){

    // Get the expected headers from the request
    const apikey = req.headers["x-api-key"] as string;
    // Get the expected params from the request body
    const aid = req.query.aid;

    // Check if all expected parameters are present
    if(aid){

      // validate the api key
      validateApiKey(apikey).then(async () => {

        const assistantDoc = await firestore.doc(`/Assistants/${aid}`).get();
        const assistantData = assistantDoc.data() as Assistant;

        if(assistantData){
          if(assistantData.blocks.length > 0){
            const type = (assistantData.blocks[0] as InputBlock).type;

            const returnObj = {
              type: AssistantType[type],
              name: assistantData.name,
              description: assistantData.description,
              category: assistantData.category,
              blocks: assistantData.blocks
            }

            return res.status( 200 ).send( returnObj );
          }else{
            return res.status( 400 ).send( { errorcode: 4, message: "Assistant not properly defined!" } );
          }
        }else{
          return res.status( 400 ).send( { errorcode: 3, message: "Assistant does not exist!" } );
        }



      }).catch((reason) => {
        console.log(reason);
        return res.status( 400 ).send( reason );
      })
    }else{
      return res.status( 400 ).send( { errorcode: 2, message: "Missing data!" } );
    }
  }else{
    return res.status( 400 ).send( { errorcode: 1, message: "The request method is forbidden!" } );
  }

}