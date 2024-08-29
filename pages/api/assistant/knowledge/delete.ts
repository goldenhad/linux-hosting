import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../../lib/firebase/admin"
import {
  QdrantVectorStore,
  VectorStoreIndex
} from "llamaindex";

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

      if(data.aid && data.nodes && data.nodes.length > 0){
        const aid = data.aid;
        const nodes: Array<string> = data.nodes;

        try{
          const vectorStore = new QdrantVectorStore({
            collectionName: `${aid}`,
            url: `${process.env.QDRANT_ADDRESS}:6333`
          });

          if(await vectorStore.collectionExists(aid)){
            //await vectorStore.client().deleteCollection(aid);
            const index = await VectorStoreIndex.fromVectorStore(vectorStore);
            const dict = index.indexStruct;
            console.log(dict.indexId);

            for (const nodeId of nodes) {
              await vectorStore.delete(nodeId);
            }

            return res.status( 200 ).send( { errorcode: 0, message: "OK" } );
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