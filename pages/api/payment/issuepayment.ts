import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../firebase/admin";
import { stripe } from "../../../stripe/api";


type ResponseData = {
    errorcode: number,
    message: string,
}

/**
 * Route to issue a payment to stripe. This route can be called to charge a customers payment method with the provided amount
 * @param req Request object
 * @param res Response object
 */
export default async function handler( req: NextApiRequest, res: NextApiResponse<ResponseData> ) {
  if( req.cookies.token ){
    const token = await auth.verifyIdToken( req.cookies.token );

    if( req.method == "POST" ){
      if( token ){
        const data = req.body;

        // Check if the caller provided a price, a customer id and a payment method
        if( data.price != undefined && data.customer != undefined && data.method != undefined ){

          try{
            const price = data.price;

            // Check the validity of the provided price
            if( price > 0 && price < Number.MAX_SAFE_INTEGER ){
              try {

                // Create a payment intent at stripe with the provided data
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
                  description: "Automatische Nachbuchung Siteware Credits"
                });

                // Return the id of the created paymentintent
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
