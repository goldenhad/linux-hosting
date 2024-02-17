import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../firebase/admin";
import { stripe } from "../../../stripe/api";
import getDocument from "../../../firebase/data/getData";
import Stripe from "stripe";

type ResponseData = {
    errorcode: number,
    message: string,
    intent?: Stripe.SetupIntent
}


/**
 * Route resolving around stripe invoicing
 * @param req Request object
 * @param res Response object
 */
export default async function handler( req: NextApiRequest, res: NextApiResponse<ResponseData> ) {
  if( req.cookies.token ){
    const token = await auth.verifyIdToken( req.cookies.token );

    if( req.method == "GET" ){
      if( token ){
        // Get the data of the GET request
        const data = req.query;

        // Check if the caller proivded an orderid
        if( data.orderid != undefined ){
          // Get the user calling this api route
          const userobj = await getDocument( "User", token.uid );

          // Check the validity of the calling user
          if(userobj.result){
            const userdata = userobj.result.data();
            // Get the company of the calling user
            const companyobj = await getDocument( "Company", userdata.Company );

            // Check the validity of the company
            if(companyobj.result){
              const companydata = companyobj.result.data();

              // Serach the provided order id in the orders of the company
              const orderobjid = companydata.orders.findIndex((elm) => {
                return elm.id == data.orderid;
              });

              // If the order was found in the company orders
              if(orderobjid != -1){
                // Get the order object
                const orderobj = companydata.orders[orderobjid];

                // Call stripe and get the session with the id of the order object. Especially query stripe for a invoice
                const session = await stripe.checkout.sessions.retrieve(orderobj.id, { expand: ["invoice"] });

                try{
                  // Cast the session returned by stripe as stripe invoice object
                  const invoice = session.invoice as Stripe.Invoice;

                  // Return the invoice url hosted at stripe
                  return res.status( 200 ).send( { errorcode: 0, message: invoice.hosted_invoice_url } );
                }catch(e){
                  return res.status( 400 ).send( { errorcode: 7, message: "ERROR retrieving Order" } );
                }
              }else{
                return res.status( 400 ).send( { errorcode: 6, message: "Order not found" } );
              }
            }else{
              return res.status( 400 ).send( { errorcode: 5, message: "Data required!" } );
            }
          }else{
            return res.status( 400 ).send( { errorcode: 4, message: "Data required!" } );
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
