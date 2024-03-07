// Import necessary modules and types
import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../firebase/admin"
import {
  encode
} from "gpt-tokenizer"


// Define the response data type
type ResponseData = {
    errorcode: number,
    message: string,
    tokens: number
}

export function countFunction(input: string){
  const tokenEncoded = encode(input).length;
  return tokenEncoded;
}

// Define the request handler function
export default async function handler( req: NextApiRequest, res: NextApiResponse<ResponseData | string> ) {
  // Verify the user's authentication token
  const token = await auth.verifyIdToken( req.cookies.token );
  
  // Check if the request method is POST
  if( req.method == "POST" ){
        
    // Check if the user is authenticated
    if( token ){

      // Extract data from the request body
      const data = req.body;

      // Check if required data fields are present in the request
      if( data.prompt != undefined ){

        // Calculate the token count for the generated prompt
        const tokenEncoded = countFunction(data.prompt);
          
        return res.status(200).send({ errorcode: 0, message: "OK", tokens: tokenEncoded });
      } else {
        return res.status(400).send({ errorcode: 3, message: "Missing Input!", tokens: -1 });
      }

    } else {
      return res.status(400).send({ errorcode: 2, message: "Authentication required!", tokens: -1 });
    }
  } else {
    return res.status(400).send({ errorcode: 1, message: "The request method is forbidden!", tokens: -1 });
  }
}