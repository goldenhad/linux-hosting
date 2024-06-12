import verifyEmail from "../../../firebase/auth/verify";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../firebase/admin"

type ResponseData = {
    errorcode: number,
    message: string | boolean,
}

/**
 * Route to generate an invitation link from the provided information
 * @param req Request object
 * @param res Response object
 */
export default async function handler( req: NextApiRequest, res: NextApiResponse<ResponseData> ) {
  if( req.method == "POST" ) {
    const data = req.body;

    if (data.oobCode) {
      try {
        console.log("CODE", data.oobCode);
        await verifyEmail(data.oobCode);
        return res.status(200).send({ errorcode: 0, message: "OK" });
      } catch (e) {
        return res.status(400).send({ errorcode: 4, message: "Verification failed" });
      }
    } else {
      return res.status(400).send({ errorcode: 3, message: "Missing data" });
    }
  }else if(req.method == "GET"){
    const token = await auth.verifyIdToken( req.cookies.token );
    const uid = req.query.uid as string;

    if(token){
      if(uid){
        try{
          const firebaseUser = await auth.getUser(uid);

          return res.status(200).send({ errorcode: 0, message: firebaseUser.emailVerified });
        }catch (e){
          return res.status(400).send({ errorcode: 3, message: "NOT DEFINED" });
        }
      }else{
        return res.status(400).send({ errorcode: 2, message: "Data missing" });
      }
    }else {
      return res.status(400).send({ errorcode: 1, message: "Not allowed" });
    }

  }else{
    return res.status( 400 ).send( { errorcode: 1, message: "The request method is forbidden!" } );
  }
}
