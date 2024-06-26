import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../firebase/admin"
import CryptoJS from "crypto-js";


type ResponseData = {
    errorcode: number,
    message: string,
}

export function decryptProfile(ciphertext: string, salt: string ){
  const dec = CryptoJS.AES.decrypt( ciphertext, salt + process.env.MAILENC );
  return dec.toString( CryptoJS.enc.Utf8 )
}

/**
 * Route for decrypting text using AES
 * @param req Request object
 * @param res Response object
 */
export default async function handler( req: NextApiRequest, res: NextApiResponse<ResponseData> ) {
  const token = await auth.verifyIdToken( req.cookies.token );

  if( req.method == "POST" ){
    if( token ){
      const data = req.body;

      // Validate that the user provided a ciphertext and a salt, which we will use to encode the ciphertext.
      if( data.ciphertext && data.salt ){
        try{
          // decrypt the ciphertext by using the salt and the pepper
          const decrypted_data = decryptProfile(data.ciphertext, data.salt);

          // Return the decrypted string
          return res.status( 200 ).send( { errorcode: 0, message: decrypted_data } );
        }catch( e ){
          //console.log(e);
          return res.status( 400 ).send( { errorcode: 4, message: "Error while decrypting" } );
        }
      }else{
        return res.status( 400 ).send( { errorcode: 3, message: "Missing Input!" } );
      }

    }else{
      return res.status( 400 ).send( { errorcode: 2, message: "Authentication required!" } );
    }
  }else{
    return res.status( 400 ).send( { errorcode: 1, message: "The request method is forbidden!" } );
  }
}
