import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../firebase/admin";
import Stripe from "stripe";
import getDocument from "../../../firebase/data/getData";

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
        

    if( req.method == "GET" ){
            
      if( token ){
        const data = req.query;
                
        if( data.orderid != undefined ){
          const userobj = await getDocument( "User", token.uid );

          if(userobj.result){
            const userdata = userobj.result.data();
            const companyobj = await getDocument( "Company", userdata.Company );

            if(companyobj.result){
              const companydata = companyobj.result.data();
              const orderobjid = companydata.orders.findIndex((elm) => {
                return elm.id == data.orderid;
              });

              if(orderobjid != -1){
                const orderobj = companydata.orders[orderobjid];
                const session = await stripe.checkout.sessions.retrieve(orderobj.id, { expand: ["invoice"] });

                try{
                  const invoice = session.invoice as Stripe.Invoice;

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
