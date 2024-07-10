import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../../lib/firebase/admin"
import { Formidable } from "formidable";
import {
  Metadata, OpenAIEmbedding,
  PDFReader,
  QdrantVectorStore,
  VectorStoreIndex,
  Document, IngestionPipeline, SimpleNodeParser, TitleExtractor, TextFileReader, MarkdownReader
} from "llamaindex";
import getDocument from "../../../../lib/firebase/data/getData";
import { EmbeddingParameters } from "../../../../lib/firebase/types/Settings";

type ResponseData = {
    errorcode: number,
    message: string | Array<string>,
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

    // Check the input to the API route
    if( data.fields.aid && data.files.file.length == 1){
      const aid = data.fields.aid;
      const uploadFile = data.files.file[0];

      const vectorStore = new QdrantVectorStore({
        collectionName: `${aid}`,
        url: `${process.env.QDRANT_ADDRESS}:6333`
      });

      let reader = undefined;
      
      switch (uploadFile.mimetype){
      case "application/pdf":
        reader = new PDFReader();
        break;
      case "text/plain":
        reader = new TextFileReader();
        break;
      case "text/markdown":
        reader = new MarkdownReader();
        break;
      default:
        return res.status( 400 ).send( { errorcode: 97, message: "Filetype not supported!" } );
      }
      
      const docIds: Array<string> = [];
      if(reader != undefined){
        console.log("Starting read process...");
        const documents: Document<Metadata>[] = await reader.loadData(uploadFile.filepath);

        documents.forEach((doc) => {
          docIds.push(doc.id_);
        });

        const EmbeddingParameterRequest  = await getDocument("Settings", "Embedding");


        if(EmbeddingParameterRequest){
          console.log(EmbeddingParameterRequest);
          const parameters = EmbeddingParameterRequest.result.data as EmbeddingParameters;

          console.log("STARTING INDEXING PLEASE WAIT...");
          const pipeline = new IngestionPipeline({
            transformations: [
              new SimpleNodeParser({ chunkSize: parameters.chunkSize, chunkOverlap: parameters.overlap }),
              new TitleExtractor(),
              new OpenAIEmbedding({ model: "text-embedding-3-large", dimensions: 1536 })
            ],
            vectorStore
          });

          await pipeline.run({ documents: documents });


          const index = await VectorStoreIndex.fromDocuments(documents, {
            vectorStore
          });

          console.log(index.indexStruct);
          console.log("INDEXING FINISHED!");
        }else{
          return res.status( 400 ).send( { errorcode: 3, message: "Could not find Parameters" } );
        }
      }

      return res.status( 200 ).send( { errorcode: 0, message: docIds } );
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