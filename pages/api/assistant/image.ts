// Import necessary modules and types
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "../../../firebase/admin"
import {
  encode
} from "gpt-tokenizer"
import Assistant from "../../../firebase/types/Assistant";
import { User } from "../../../firebase/types/User";
import { Role } from "../../../firebase/types/Role";
import axios from "axios";
import { getDownloadURL, ref } from "firebase/storage";
import { drive } from "../../../db";


// Define the response data type
type ResponseData = {
    errorcode: number,
    message: string
}

// Define the request handler function
export default async function handler( req: NextApiRequest, res: NextApiResponse<ResponseData | string> ) {
  // Verify the user's authentication token
  const token = await auth.verifyIdToken( req.cookies.token );

  // Check if the request method is POST
  if( req.method == "GET" ){

    // Check if the user is authenticated
    if( token ){
      const imageId = req.query.aid;

      if(imageId){
        const storageRef = ref( drive, `assistant/images/${imageId}` );
        const url = await getDownloadURL( storageRef );

        if(url){
          axios.get(url).then((resp) => {
            console.log(resp.data);
            return res.send(resp.data)
          })
        }
      }else{
        return res.status(400).send({ errorcode: 3, message: "Data missing" });
      }

    } else {
      return res.status(403).send({ errorcode: 2, message: "Authentication required!" });
    }
  } else {
    return res.status(400).send({ errorcode: 1, message: "The request method is forbidden!" });
  }
}