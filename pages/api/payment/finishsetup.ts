import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../firebase/admin";
import Stripe from "stripe";

type ResponseData = {
    errorcode: number,
    message: string,
    intent?: Stripe.SetupIntent
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
                
        if( data.setupintent != undefined && data.customer != undefined ){

          try {

            const setupintent = await stripe.setupIntents.retrieve(data.setupintent);
                
            if(setupintent.payment_method){
                
              const update = await stripe.customers.update(data.customer, {
                invoice_settings: {
                  default_payment_method: setupintent.payment_method as string
                }
              });

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
