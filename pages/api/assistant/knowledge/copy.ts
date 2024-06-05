import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../../firebase/admin"
import {
  QdrantVectorStore,
  VectorStoreIndex
} from "llamaindex";
import { QdrantClient } from "@qdrant/js-client-rest";

type ResponseData = {
    errorcode: number,
    message: string,
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

    if (req.method == "POST"){
      const data = req.body;
      console.log("params: ", req.body);

      if(data.newAid && data.oldAid){
        const oldAid = data.oldAid;
        const newAid = data.newAid;

        try{
          const qdrantClient = new QdrantClient({
            url: `${process.env.QDRANT_ADDRESS}:6333`
          });

          const existsReq = await qdrantClient.collectionExists(oldAid);

          if(existsReq.exists){
            const oldCollection = await qdrantClient.getCollection(oldAid);
            const newCollection = await qdrantClient.createCollection(newAid, {
              vectors: oldCollection.config.params.vectors,
              init_from: { collection: oldAid }
            });
            
            if(newCollection){
              return res.status( 200 ).send( { errorcode: 0, message: "OK" } );
            }else{
              return res.status( 500 ).send( { errorcode: 7, message: "Copying of collection failed!" } );
            }
          }else{
            return res.status( 400 ).send( { errorcode: 6, message: "Assistant has no knowledge base!" } );
          }
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