import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../firebase/admin";
import { stripe } from "../../../stripe/api";
import Stripe from "stripe";


type ResponseData = {
    errorcode: number,
    message: string,
    intent?: Stripe.SetupIntent
}

/**
 * Route to finish a stripe setup and bind the containing payment method to the provided customer
 * @param req Request object
 * @param res Response object
 */
export default async function handler( req: NextApiRequest, res: NextApiResponse<ResponseData> ) {
  if( req.cookies.token ){
    const token = await auth.verifyIdToken( req.cookies.token );

    if( req.method == "POST" ){
      if( token ){
        const data = req.body;

        // Check if the customer provided a setupintent id and a customer id
        if( data.setupintent != undefined && data.customer != undefined ){
          try {
            // Call stripe and get the setupintent with the provided id
            const setupintent = await stripe.setupIntents.retrieve(data.setupintent);

            // Check if the setupintent contains a payment method
            if(setupintent.payment_method){

              // Update the customer and bind the payment method of the setupintent to the customer as default payment method
              const update = await stripe.customers.update(data.customer, {
                invoice_settings: {
                  default_payment_method: setupintent.payment_method as string
                }
              });

              // If stripe returns the customer we succeeded
              if(update.id){
                return res.status( 200 ).send( { errorcode: 0, message: "OK", intent: setupintent } );
              }else{
                return res.status( 400 ).send( { errorcode: 0, message: "Customer could not be updated" } );
              }
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
