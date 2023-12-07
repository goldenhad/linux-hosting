import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../firebase/admin"
import getDocument from "../../../firebase/data/getData";
import deleteData from "../../../firebase/data/deleteData";
import { deleteAllUserData } from "../../../helper/userManagement";

type ResponseData = {
    errorcode: number,
    message: string,
}


export default async function handler( req: NextApiRequest, res: NextApiResponse<ResponseData> ) {
  const token = await auth.verifyIdToken( req.cookies.token );

  if( req.method == "POST" ){
    if( token ){
      const userobj = await getDocument( "User", token.uid );
      if( userobj ){
        const userrepresentation = userobj.result.data();
        if( userrepresentation.Role == "Company-Admin" || userrepresentation.Role == "Company-Manager" ){

          const data = req.body;

          if( data && data.id ){
            const userToDeleteObj = await getDocument( "User", data.id );
            if( userToDeleteObj ){
              const deleterepresentation = userToDeleteObj.result.data();

              if( deleterepresentation ){
                if( deleterepresentation.Role != "Company-Admin" && deleterepresentation.Company == userrepresentation.Company ){
                  
                  //await auth.deleteUser( data.id );
                  //await deleteData( "User", data.id );
                  deleteAllUserData( data.id );

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
