import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../firebase/admin"
import CryptoJS from "crypto-js";

type ResponseData = {
    errorcode: number,
    message: string,
}

/**
 * Route to generate an invitation link from the provided information
 * @param req Request object
 * @param res Response object
 */
export default async function handler( req: NextApiRequest, res: NextApiResponse<ResponseData> ) {
  const token = await auth.verifyIdToken( req.cookies.token );

  if( req.method == "POST" ){
    if( token ){
      const data = req.body;

      // Check that the user provided his ID
      if( data.from ){
        const recommendobj = {
          from: data.from
        };

        try {
          // Generate an invitation code using encryption, so nobody can create them without our pepper
          const json = JSON.stringify( recommendobj );
          const recommenddata =  Buffer.from( json ).toString( "base64" );
          const recommendcode = Buffer.from( CryptoJS.AES.encrypt( recommenddata, process.env.MAILENC ).toString() ).toString( "base64" );
          const baseurl = process.env.NEXT_PUBLIC_BASEURL;

          // Create the invitation link by appending it to our baseurl
          const invitelink = `${baseurl}/register?recommend=${recommendcode}`;

          // Return the invitation
          return res.status( 200 ).send( { errorcode: 0, message: invitelink } );
        }catch( e ){
          return res.status( 400 ).send( { errorcode: 1, message: "The provided Data causend an error" } );
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
