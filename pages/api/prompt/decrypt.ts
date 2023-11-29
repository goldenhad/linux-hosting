import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../firebase/admin"
import CryptoJS from "crypto-js";


type ResponseData = {
    errorcode: number,
    message: string,
}


export default async function handler( req: NextApiRequest, res: NextApiResponse<ResponseData> ) {
  const token = await auth.verifyIdToken( req.cookies.token );

  if( req.method == "POST" ){
        
    if( token ){

      const data = req.body;

      if( data.ciphertext && data.salt ){
        try{
          const decrypted_data = CryptoJS.AES.decrypt( data.ciphertext, data.salt + process.env.MAILENC );

          return res.status( 200 ).send( { errorcode: 0, message: decrypted_data.toString( CryptoJS.enc.Utf8 ) } );
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
