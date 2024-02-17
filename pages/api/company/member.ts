import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../firebase/admin"
import getDocument from "../../../firebase/data/getData";
import { deleteAllUserData } from "../../../helper/userManagement";

type ResponseData = {
    errorcode: number,
    message: string,
}

/**
 * Route to handle user accounts assigned to companies => members
 * @param req Request object
 * @param res Reponse object
 */
export default async function handler( req: NextApiRequest, res: NextApiResponse<ResponseData> ) {
  const token = await auth.verifyIdToken( req.cookies.token );

  // Check that the request used the DELETE method
  if( req.method == "POST" ){
    if( token ){
      // Get the user calling this route
      const userobj = await getDocument( "User", token.uid );
      if( userobj ){
        const userrepresentation = userobj.result.data();

        // Check the role of the calling user
        // We need to ensure that only admins and managers can remove members from the company
        if( userrepresentation.Role == "Company-Admin" || userrepresentation.Role == "Company-Manager" ){
          const data = req.body;

          // Check that the route was called with an id
          if( data && data.id ){
            // Get the user that should be deleted from the database
            const userToDeleteObj = await getDocument( "User", data.id );

            // Validate that the given id results in a valid user
            if( userToDeleteObj ){
              const deleterepresentation = userToDeleteObj.result.data();

              if( deleterepresentation ){
                // Check that the user thath should be deleted is not an admin and that they belong to the company of the calling user
                if( deleterepresentation.Role != "Company-Admin" && deleterepresentation.Company == userrepresentation.Company ){

                  // Delete the user
                  await deleteAllUserData(data.id);

                  return res.status( 200 ).send( { errorcode: -1, message: "OK" } );
                }else{
                  return res.status( 403 ).send( { errorcode: 8, message: "Forbidden" } );
                }
              }else{
                return res.status( 403 ).send( { errorcode: 7, message: "Forbidden" } );
              }
            }else{
              return res.status( 404 ).send( { errorcode: 6, message: "User missing" } );
            }
          }else{
            return res.status( 403 ).send( { errorcode: 5, message: "Data missing" } );
          }
        }else{
          return res.status( 403 ).send( { errorcode: 4, message: "Forbidden" } );
        }
      }else{
        return res.status( 403 ).send( { errorcode: 3, message: "Forbidden" } );
      }
    }else{
      return res.status( 400 ).send( { errorcode: 2, message: "Authentication required!" } );
    }
  }else{
    return res.status( 400 ).send( { errorcode: 1, message: "The request method is forbidden!" } );
  }
}
