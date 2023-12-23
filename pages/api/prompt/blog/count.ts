// Import necessary modules and types
import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../../firebase/admin"
import getDocument from "../../../../firebase/data/getData";
import { parseBlogPrompt } from "../../../../helper/prompt";
import {
  encode
} from "gpt-tokenizer"

// Define the response data type
type ResponseData = {
    errorcode: number,
    message: string,
    tokens: number
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
      if( data.name != undefined &&
          data.personal != undefined &&
          data.content != undefined &&
          data.order != undefined &&
          data.style != undefined &&
          data.emotions != undefined &&
          data.length != undefined &&
          data.company != undefined
        ){

        // Retrieve the template for prompts from the database
        const templatereq = await getDocument( "Settings", "Prompts" );
        
        // Check if the template request was successful
        if( templatereq.result ){
          // Extract the template data
          const template = templatereq.result.data();

          // Generate a blog prompt using the provided data
          const prompt = parseBlogPrompt(
            template.blog,
            data.name,
            data.company,
            data.personal,
            data.content,
            data.style,
            data.order,
            data.emotions,
            data.length
          );

          // Calculate the token count for the generated prompt
          const tokenEncoded = encode(prompt).length;
          
          return res.status(200).send({ errorcode: 0, message: "OK", tokens: tokenEncoded });
                      
        } else {
          return res.status(400).send({ errorcode: -3, message: "Error generating answer", tokens: -1 });
        }
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
