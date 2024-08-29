import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../../lib/firebase/admin"
import { QdrantClient } from "@qdrant/js-client-rest";

type ResponseData = {
    errorcode: number,
    message: string | boolean,
}


/**
 * API route handling assistant knowledgebase input
 * @param req Request object
 * @param res Reponse object
 */
export default async function handler( req: NextApiRequest, res: NextApiResponse<ResponseData> ) {
  // Verify that the user is logged in
  const token = await auth.verifyIdToken( req.cookies.token );

  if( token ){

    if (req.method == "GET"){
      const data = req.query;

      if( data.aid ){
        const aid = data.aid as string;
                
        try{
          const qdrantClient = new QdrantClient({
            url: `${process.env.QDRANT_ADDRESS}:6333`
          });

          const existsReq = await qdrantClient.collectionExists(aid);
          const exists = existsReq.exists;

          return res.status( 200 ).send( { errorcode: 0, message: exists } );
        }catch (e){
          console.log(e);
          return res.status( 400 ).send( { errorcode: 5, message: "Error deleting collection!" } );
        }
      }else {
        return res.status( 400 ).send( { errorcode: 4, message: "Data missing" } );
      }
    }else{
      return res.status( 403 ).send( { errorcode: 3, message: "Request method forbidden" } );
    }

  }else{
    return res.status( 400 ).send( { errorcode: 2, message: "Authentication required!" } );
  }
}