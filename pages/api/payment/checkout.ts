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
                
        if( data.price != undefined && data.email != undefined ){

          try{
            const price = data.price;

            if( price > 0 && price < Number.MAX_SAFE_INTEGER ){
              try {

                const redirectURL = `${process.env.BASEURL}/thankyou`
                const transformedItem = {
                  price_data: {
                    currency: "EUR",
                    product_data: {
                      name: "Siteware business Credits"
                    },
                    // Unit amount has to be in cents
                    unit_amount: price * 100
                  },
                  quantity: 1,
                  tax_rates: [process.env.TAXRATE]
                };

                const paymentIntent = await stripe.checkout.sessions.create({
                  payment_method_types: ["card"],
                  line_items: [transformedItem],
                  mode: "payment",
                  customer_email: data.email,
                  success_url: redirectURL + "?status=success&sessionid={CHECKOUT_SESSION_ID}",
                  cancel_url: redirectURL + "?status=cancel&sessionid={CHECKOUT_SESSION_ID}",
                  invoice_creation: {
                    enabled: true
                  }
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
