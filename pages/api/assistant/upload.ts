import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../firebase/admin"
import { Formidable } from "formidable";
import { uploadAssistantImage } from "../../../firebase/drive/upload_file";
import fs from "fs";

type ResponseData = {
    errorcode: number,
    message: string,
}

/**
 * API route handling profile image uploads
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
    if( data.fields.aid && data.fields.aid.length == 1 && data.files.image && data.files.image.length == 1 ){
      const uploadedImage = data.files.image[0];
      const assistant = data.fields.aid[0];

      // Read the temporary uploaded file
      const imageData = fs.readFileSync( uploadedImage.filepath );
      // Convert it to binary
      const imageBytes = new Uint8Array( imageData );

      try {
        // Upload the image to firebase
        const imageurl = await uploadAssistantImage( imageBytes, assistant );

        return res.status( 200 ).send( { errorcode: 0, message: imageurl } );

      }catch( e ){
        return res.status( 400 ).send( { errorcode: 1, message: "The provided Data causend an error" } );
      }
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