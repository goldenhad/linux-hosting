import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../firebase/admin";
import { stripe } from "../../../stripe/api";


type ResponseData = {
    errorcode: number,
    message: string,
}


/**
 * Route to be called to create a new stripe customer
 * @param req Request object
 * @param res Response object
 */
export default async function handler( req: NextApiRequest, res: NextApiResponse<ResponseData> ) {
  if( req.cookies.token ){
    const token = await auth.verifyIdToken( req.cookies.token );
        
    if( req.method == "POST" ){
      if( token ){
        const data = req.body;

        // Validate that all needed data was provided
        if( data.name != undefined && data.email != undefined ){

          try {
            // Create a new stripe customer object with the provided data
            const customer = await stripe.customers.create({
              name: data.name,
              email: data.email,
              address: {
                city: data.address.city,
                country: "de",
                line1: data.address.street,
                postal_code: data.address.postalcode
              }
            })

            // Return the id of the created customer
            return res.status( 200 ).send( { errorcode: 0, message: customer.id } );
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
  }else{
    return res.status( 400 ).send( { errorcode: 2, message: "Authentication required!" } );
  }
}
