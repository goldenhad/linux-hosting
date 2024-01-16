import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../firebase/admin"
import fs from "fs";

type ResponseData = {
    errorcode: number,
    message: string,
}


export default async function handler( req: NextApiRequest, res: NextApiResponse<ResponseData> ) {
  const token = await auth.verifyIdToken( req.cookies.token );

  if( req.method == "POST" ){
        
    if( token ){

      const data = req.body;

      if( data.tokens && data.time && data.type ){
        const timestamp = Math.floor( Date.now() / 1000 );

        const logobj = {
          timestamp: timestamp,
          tokens: data.tokens,
          time: data.time,
          type: data.type
        }

        fs.appendFileSync( "prompt_stats.log", JSON.stringify( logobj ) + "\n" );

        return res.status( 200 ).send( { errorcode: 0, message: "OK" } );

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
