import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../../firebase/admin"
import { Formidable } from "formidable";
import { uploadAssistantImage, uploadProfilePicture } from "../../../../firebase/drive/upload_file";
import fs from "fs";
import * as path from "path";
import {
  ChatMessage,
  LLMStartEvent, OpenAIEmbedding,
  PDFReader,
  QdrantVectorStore, serviceContextFromDefaults,
  storageContextFromDefaults,
  VectorStoreIndex
} from "llamaindex";
import { Settings } from "llamaindex/Settings";
import { extractText } from "llamaindex/llm/utils";
import {encodingForModel} from "js-tiktoken";

type ResponseData = {
    errorcode: number,
    message: string,
}


const encoding = encodingForModel("text-embedding-ada-002");


const SITEWARE_TMP_FOLDER = process.env.SITEWARE_TMP_FOLDER;

/**
 * API route handling assistant knowledgebase input
 * @param req Request object
 * @param res Reponse object
 */
export default async function handler( req: NextApiRequest, res: NextApiResponse<ResponseData> ) {
  // Verify that the user is logged in
  const token = await auth.verifyIdToken( req.cookies.token );

  if( token ){
    // Create a new promise, that will resolve if the upload finishes
    const data: { fields; files } = await new Promise(
      ( resolve, reject ) => {
        // Create a form object which we will use to upload the image
        const form = new Formidable();

        form.parse( req, ( err, fields, files ) => {
          if ( err ) reject( { err } );
          resolve( { fields, files } );
        } );
      }
    );

    console.log(data.files);

    // Check the input to the API route
    if( data.fields.aid && data.files.file.length == 1){
      const aid = data.fields.aid;
      const uploadFile = data.files.file[0];
      const assistant = data.fields.aid[0];

      const vectorStore = new QdrantVectorStore({
        collectionName: `${aid}`,
        url: `http://${process.env.QDRANT_ADDRESS}:6333`
      });

      let reader = undefined;
      
      switch (uploadFile.mimetype){
      case "application/pdf":
        reader = new PDFReader();

        break;
      default:
        return res.status( 400 ).send( { errorcode: 97, message: "Filetype not supported!" } );
      }
      
      
      if(reader != undefined){
        console.log("Starting read process...");
        const documents = await reader.loadData(uploadFile.filepath);

        let cost = 0;
        documents.forEach((doc) => {
          cost += encoding.encode(doc.text).length;
        });

        console.log(cost, "=>", cost / 1_000_000 * 0.02);

        console.log("STARTING INDEXING PLEASE WAIT...");


        Settings.embedModel = new OpenAIEmbedding({ model: "text-embedding-3-small" });

        const index = await VectorStoreIndex.fromDocuments(documents, {
          vectorStore
        });

        console.log("INDEXING FINISHED!");
      }

      return res.status( 200 ).send( { errorcode: 0, message: "DONE" } );
    }else{
      return res.status( 400 ).send( { errorcode: 1, message: "The provided Data causend an error" } );
    }

  }else{
    return res.status( 400 ).send( { errorcode: 2, message: "Authentication required!" } );
  }
}

// VV important VV
export const config = {
  api: {
    bodyParser: false
  }
};