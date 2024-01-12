import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../firebase/admin";
import axios from "axios";
import { mailPriceMapping } from "../../../helper/price";

type ResponseData = {
    errorcode: number,
    message: string,
}


export default async function handler( req: NextApiRequest, res: NextApiResponse<ResponseData> ) {
  if( req.cookies.token ){
    const token = await auth.verifyIdToken( req.cookies.token );
        

    if( req.method == "POST" ){
            
      if( token ){
        const data = req.body;
                
        if( data.tokens ){

          try{
            const price = mailPriceMapping[data.tokens];

            if( price > 0 && price < Number.MAX_SAFE_INTEGER ){
              const paymentobj = {
                "intent": "CAPTURE",
                "purchase_units": [
                  {
                    "amount": {
                      "currency_code": "EUR",
                      "value": parseFloat( price.toFixed( 2 ) )
                    }
                  }
                ],
                "payment_source": {
                  "paypal": {
                    "experience_context": {
                      "payment_method_preference": "IMMEDIATE_PAYMENT_REQUIRED",
                      "brand_name": "Siteware business",
                      "locale": "de-DE",
                      "landing_page": "LOGIN",
                      "user_action": "PAY_NOW",
                      "return_url": `${process.env.BASEURL}/thankyou`,
                      "cancel_url": `${process.env.BASEURL}/upgrade`
                    }
                  }
                }
              }

              try{
                const data = await axios.post( `${process.env.PAYPALURL}/v2/checkout/orders`, paymentobj, {
                  headers: {
                    "Accept": "application/json",
                    "Accept-Language": "en_US",
                    "content-type": "application/json"
                  },
                  auth: {
                    username: process.env.PAYPALID,
                    password: process.env.PAYPALSECRET
                  }
                } );
                          
                if( data.data.links ){

                  return res.status( 200 ).send( { errorcode: 0, message: data.data } );
                }else{
                  return res.status( 200 ).send( { errorcode: 4, message: "Something went wrong" } );
                }
                          
                          
              }catch( E ){
                console.log(E);
                //console.log(E.response.data);
                return res.status( 400 ).send( { errorcode: -4, message: "Error" } );
              }
            }else{
              return res.status( 400 ).send( { errorcode: -3, message: "Error" } );
            }
          }catch( conversionerror ){
            //console.log(conversionerror.response.data);
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
