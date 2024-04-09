import verifyEmail from "../../../firebase/auth/verify";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../firebase/admin"
import CryptoJS from "crypto-js";
import { getDoc } from "firebase/firestore";
import getDocument from "../../../firebase/data/getData";
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
      if(data.uid){
        try{
          await verifyEmail(data.uid);
          return res.status( 200 ).send( { errorcode: 0, message: "OK" } );
        }catch (e){
          return res.status( 400 ).send( { errorcode: 4, message: "Verification failed" } );
        }
      }else{
        return res.status( 400 ).send( { errorcode: 3, message: "Missing data" } );
      }


    }else{
      return res.status( 400 ).send( { errorcode: 2, message: "Authentication required!" } );
    }
  }else{
    return res.status( 400 ).send( { errorcode: 1, message: "The request method is forbidden!" } );
  }
}
