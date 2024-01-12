import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../firebase/admin";
import Stripe from "stripe";

type ResponseData = {
    errorcode: number,
    message: string,
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
                
        if( data.price != undefined && data.customer != undefined && data.method != undefined ){

          try{
            const price = data.price;

            console.log(data);
            if( price > 0 && price < Number.MAX_SAFE_INTEGER ){
              try {

                const paymentIntent = await stripe.paymentIntents.create({
                  amount: price * 100,
                  confirm: true,
                  customer: data.customer,
                  currency: "eur",
                  automatic_payment_methods: {
                    enabled: true
                  },
                  payment_method: data.method,
                  off_session: true,
                  description: "Automatische Nachbuchung Siteware business Credits"
                });
                
                return res.status( 200 ).send( { errorcode: 0, message: paymentIntent.id } );
              } catch (error) {
                console.log(error);
                return res.status( 400 ).send( { errorcode: 4, message: "Something went wrong" } );
              }
                          
            }else{
              return res.status( 400 ).send( { errorcode: -3, message: "Error" } );
            }
          }catch( conversionerror ){
            console.log(conversionerror.response);
            return res.status( 400 ).send( { errorcode: -2, message: "Error" } );
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
