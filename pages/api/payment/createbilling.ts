import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../firebase/admin";
import axios from "axios";
import { mailPriceMapping } from "../../../helper/price";
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
                
        if( data.amount != undefined && data.customer != undefined ){

          try {

            // Create an Invoice
            const invoice = await stripe.invoices.create({
              customer: data.customer
            });

            // Create an Invoice Item with the Price, and Customer you want to charge
            const invoiceItem = await stripe.invoiceItems.create({ 
              customer: data.customer,
              price: data.amount,
              invoice: invoice.id
            });

            // Send the Invoice
            await stripe.invoices.sendInvoice(invoice.id);

                
            return res.status( 200 ).send( { errorcode: 0, message: "OK" } );
          } catch (error: any) {
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
