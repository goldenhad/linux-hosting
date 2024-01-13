import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../firebase/admin";
import Stripe from "stripe";

type ResponseData = {
    errorcode: number,
    list: Array<Stripe.SetupIntent>,
}

const stripe = new Stripe(process.env.STRIPEPRIV, {
  typescript: true,
  apiVersion: "2023-10-16"
});


export default async function handler( req: NextApiRequest, res: NextApiResponse<ResponseData> ) {
  if( req.cookies.token ){
    const token = await auth.verifyIdToken( req.cookies.token );
        

    if( req.method == "POST" ){
            
      if( token ){
        const data = req.body;
                
        if( data.customer != undefined ){

          try {

            const setupintents = await stripe.setupIntents.list({
              customer: data.customer
            });
                
            return res.status( 200 ).send( { errorcode: 0, list: setupintents.data } );
          } catch (error) {
            console.log(error);
            return res.status( 400 ).send( { errorcode: 4, list: [] } );
          }
        }else{
          return res.status( 400 ).send( { errorcode: 3, list: [] } );
        }

      }else{
        return res.status( 400 ).send( { errorcode: 2, list: [] } );
      }
    }else{
      return res.status( 400 ).send( { errorcode: 1, list: [] } );
    }
  }
}
