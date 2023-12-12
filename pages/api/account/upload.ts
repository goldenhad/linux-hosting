import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../firebase/admin"
import { Formidable } from "formidable";
import { uploadFile } from "../../../firebase/drive/upload_file";
import fs from "fs";

type ResponseData = {
    errorcode: number,
    message: string,
}


export default async function handler( req: NextApiRequest, res: NextApiResponse<ResponseData> ) {
  const token = await auth.verifyIdToken( req.cookies.token );

  if( token ){
    const data: { fields; files } = await new Promise(
      ( resolve, reject ) => {
        const form = new Formidable();

        form.parse( req, ( err, fields, files ) => {
          if ( err ) reject( { err } );
          resolve( { fields, files } );
        } );
      }
    );

    if( data.fields.user && data.fields.user.length == 1 && data.files.image && data.files.image.length == 1 ){
      const uploadedImage = data.files.image[0];
      const uploadingUser = data.fields.user[0];

      const imageData = fs.readFileSync( uploadedImage.filepath );
      const imageBytes = new Uint8Array( imageData );

      try {
        const imageurl = await uploadFile( imageBytes, uploadingUser );

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

export const config = {
  api: {
    bodyParser: false
  }
};