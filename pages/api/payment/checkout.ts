import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../firebase/admin";
import { stripe } from "../../../stripe/api";


type ResponseData = {
    errorcode: number,
    message: string,
}

/**
 * Route resolves credit purchases using stripes checkout API
 * @param req Request object
 * @param res Reponse object
 */
export default async function handler( req: NextApiRequest, res: NextApiResponse<ResponseData> ) {
  if( req.cookies.token ){
    const token = await auth.verifyIdToken( req.cookies.token );

    if( req.method == "POST" ){
      if( token ){
        const data = req.body;

        // Check that a price and an email was provided
        if( data.price != undefined && data.email != undefined ){

          try{
            const price = data.price;

            // Validate the price to be in range
            if( price > 0 && price < Number.MAX_SAFE_INTEGER ){
              try {
                // Define the url the user gets redirected after the purchase
                const redirectURL = `${process.env.NEXT_PUBLIC_BASEURL}/thankyou`

                // Create a stripe line item
                const transformedItem = {
                  price_data: {
                    currency: "EUR",
                    product_data: {
                      name: "Siteware business Aufladung"
                    },
                    // Unit amount has to be in cents
                    unit_amount: price * 100
                  },
                  quantity: 1,
                  // The taxrate is a account related id to we pass it with the environment variables
                  tax_rates: [process.env.TAXRATE]
                };

                // Creat a stripe payment intent session object
                const paymentIntent = await stripe.checkout.sessions.create({
                  payment_method_types: ["card", "paypal"],
                  line_items: [transformedItem],
                  mode: "payment",
                  customer_email: data.email,
                  success_url: redirectURL + "?status=success&sessionid={CHECKOUT_SESSION_ID}",
                  cancel_url: redirectURL + "?status=cancel&sessionid={CHECKOUT_SESSION_ID}",
                  invoice_creation: {
                    enabled: true
                  }
                });

                // Return the session id
                return res.status( 200 ).send( { errorcode: 0, message: paymentIntent.id } );
              } catch (error) {
                // If we encounter any error during the creation of the payment intent
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
