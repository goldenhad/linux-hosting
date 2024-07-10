import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../lib/firebase/admin";
import { stripe } from "../../../lib/stripe/api";


type ResponseData = {
    errorcode: number,
    message: string,
}


/**
 * Route to detach an automatic payment method from a customer at stripe
 * @param req Request object
 * @param res Reponse obbject
 */
export default async function handler( req: NextApiRequest, res: NextApiResponse<ResponseData> ) {
  if( req.cookies.token ){
    const token = await auth.verifyIdToken( req.cookies.token );

    if( req.method == "POST" ){
      if( token ){
        const data = req.body;

        // Check if the caller provided the id of a stripe payment method
        if( data.method != undefined ){
          try {

            // Call stripe and detach the payment method
            const detachedMethod = await stripe.paymentMethods.detach(data.method)

            // If stripe returns a method id the detaching worked correctly
            if(detachedMethod.id){
              return res.status( 200 ).send( { errorcode: 0, message: "OK" } );
            }else{
              return res.status( 400 ).send( { errorcode: 0, message: "Payment Method not found!" } );
            }
          } catch (error) {
            console.log(error);
            return res.status( 400 ).send( { errorcode: 4, message: "Something went wrong" } );
          }
        }else{
          return res.status( 400 ).send( { errorcode: 3, message: "Data required!" } );
        }

      }else{
        return res.status( 400 ).send( { errorcode: 2, message: "Authentication required!" } );
      }
    }else{
      return res.status( 400 ).send( { errorcode: 1, message: "The request method is forbidden!" } );
    }
  }
}
