import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../firebase/admin"
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

      if( data.from ){
                
        const recommendobj = {
          from: data.from
        };

        try {
          const json = JSON.stringify( recommendobj );
          const recommenddata =  Buffer.from( json ).toString( "base64" );
          const recommendcode = Buffer.from( CryptoJS.AES.encrypt( recommenddata, process.env.MAILENC ).toString() ).toString( "base64" );

          const baseurl = process.env.BASEURL;

          const invitelink = `${baseurl}/register?recommend=${recommendcode}`;

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