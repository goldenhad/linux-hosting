// Import necessary modules and types
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "../../../lib/firebase/admin"
import Assistant from "../../../lib/firebase/types/Assistant";
import { User } from "../../../lib/firebase/types/User";
import { Role } from "../../../lib/firebase/types/Role";

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
  if( req.method == "POST" ){

    // Check if the user is authenticated
    if( token ){

      const userReq = await firestore.doc(`/User/${token.uid}`).get();
      const user = userReq.data() as User;
      
      if(user !== undefined){
        const roleReq = await firestore.doc(`/Role/${user.Role}`).get();
        const role = roleReq.data() as Role;

        if(role !== undefined && role.canUseEditor){
          // Extract data from the request body
          const data = req.body;

          // Check if required data fields are present in the request
          if( data.aid != undefined ){

            const assistantReq = await firestore.doc(`/Assistants/${data.aid}`).get();
            const assistant: Assistant = assistantReq.data() as Assistant;

            if(assistant){
              assistant.name += " (duplicate)";

              const addNewAssReq = await firestore.collection("/Assistants").add( assistant );
              const newAssId = addNewAssReq.id;

              return res.status(200).send({ errorcode: 0, message: newAssId });
            }else{

              return res.status(400).send({ errorcode: 6, message: "Assistant undfined!" });
            }

          } else {
            return res.status(400).send({ errorcode: 5, message: "Missing Input!" });
          }
        }else{
          return res.status(403).send({ errorcode: 4, message: "Not allowed" });
        }
      }else{
        return res.status(403).send({ errorcode: 3, message: "Not allowed" });
      }
      
    } else {
      return res.status(403).send({ errorcode: 2, message: "Authentication required!" });
    }
  } else {
    return res.status(400).send({ errorcode: 1, message: "The request method is forbidden!" });
  }
}