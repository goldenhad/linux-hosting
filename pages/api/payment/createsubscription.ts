import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../firebase/admin";
import axios from "axios";
import { mailPriceMapping } from "../../../helper/price";
import moment from "moment";

type ResponseData = {
    errorcode: number,
    message: string,
}

const planMapping = {
  0: process.env.PLAN0,
  1: process.env.PLAN1,
  2: process.env.PLAN2,
  3: process.env.PLAN3,
  4: process.env.PLAN4,
  5: process.env.PLAN5,
  6: process.env.PLAN6
}

export default async function handler( req: NextApiRequest, res: NextApiResponse<ResponseData> ) {
  if( req.cookies.token ){
    const token = await auth.verifyIdToken( req.cookies.token );
        

    if( req.method == "POST" ){
            
      if( token ){
        const data = req.body;
        

        if( data.planId >= 0 ){
              
          console.log(planMapping[data.planId]);

          const subscriptionobj = {
            "plan_id": planMapping[data.planId],
            "quantity": data.tokens
          }

          try{
            const data = await axios.post( `${process.env.PAYPALURL}/v1/billing/subscriptions`, subscriptionobj, {
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
            console.log(E.response.data);
            //console.log(E.response.data);
            return res.status( 400 ).send( { errorcode: -4, message: "Error" } );
          }
        }else{
          return res.status( 400 ).send( { errorcode: -3, message: "Error" } );
        }

      }else{
        return res.status( 400 ).send( { errorcode: 2, message: "Authentication required!" } );
      }
    }else{
      return res.status( 400 ).send( { errorcode: 1, message: "The request method is forbidden!" } );
    }
  }
}
