import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../lib/firebase/admin"
import getDocument from "../../../lib/firebase/data/getData";
import { UserMetadata } from "@firebase/auth";

type ResponseData = {
    errorcode: number,
    message: string | UserMetadata,
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
      const { result } = await getDocument("User", token.user_id);
      const user = result.data();
      if(result && ( user.Role == "Superadmin" ||  user.Role == "Marketing") ){

        if(data.uid){
          const metadata = await auth.getUser(data.uid);
                
          if(metadata){
            return res.status( 200 ).send( { errorcode: 0, message: metadata.metadata } );
          }else{
            return res.status( 400 ).send( { errorcode: 5, message: "ERR" } );
          }
        }else{
          return res.status( 400 ).send( { errorcode: 4, message: "missing data" } );
        }


      }else{
        return res.status( 400 ).send( { errorcode: 3, message: "insufficient permissions" } );
      }

    }else{
      return res.status( 400 ).send( { errorcode: 2, message: "Authentication required!" } );
    }
  }else{
    return res.status( 400 ).send( { errorcode: 1, message: "The request method is forbidden!" } );
  }
}
