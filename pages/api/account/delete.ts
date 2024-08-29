import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../lib/firebase/admin"
import { getDocWhere } from "../../../lib/firebase/data/getData";
import { UserMetadata } from "@firebase/auth";
import deleteData from "../../../lib/firebase/data/deleteData";
import { deleteProfilePicture } from "../../../lib/firebase/drive/delete";
import deleteSitewareUser from "../../../lib/firebase/auth/delete";
import { User } from "../../../lib/firebase/types/User";
import { deleteAllUserData } from "../../../lib/helper/userManagement";

type ResponseData = {
    errorcode: number,
    message: string | UserMetadata,
}

/**
 * Route to delete a given user
 * @param req Request object
 * @param res Response object
 */
export default async function handler( req: NextApiRequest, res: NextApiResponse<ResponseData> ) {
  const token = await auth.verifyIdToken( req.cookies.token );

  if( req.method == "POST" ){
    if( token ){
      const data = req.body;
      if(data.role !== undefined && data.companyId !== undefined && data.userId !== undefined){
        switch (data.role){
        case "Company-Admin":
          const { result } = await getDocWhere( "User", "Company", "==", data.companyId );
          if( result ){
            // Test if there are any other users of the company
            if( result.length > 1 ){
              // If we are no the last person in the company, query the remaining users
              const userOfCompany: Array<User & { id: string }> = result;

              for( let i=0; i < userOfCompany.length; i++ ){
                const userobj = userOfCompany[i];
                if( userobj.id != data.userId ){
                  if( userobj.Role != "Company-Admin" && userobj.Company == data.companyId ) {
                    await deleteAllUserData(userobj.id);
                  }
                }
              }
            }
          }
          break;
        case "Company-Manager":
          const cpmngrDeleteData = await deleteData( "User", data.userId );
          if( !cpmngrDeleteData.error ){
            await deleteProfilePicture( data.userId );
            await deleteSitewareUser()
          }
          break;
        case "Mailagent":
          const mlgntDeleteData = await deleteData( "User", data.userId );
          if( !mlgntDeleteData.error ){
            await deleteProfilePicture( data.userId );
            await deleteSitewareUser()
          }
          break;
        case "Singleuser":
          try{
            const cmpnysnglSerDeleteData = await deleteData( "Company", data.companyId );
            if( !cmpnysnglSerDeleteData.error ){
              const snglSerDeleteData = await deleteData( "User", data.userId );
              if( !snglSerDeleteData.error ){
                await deleteProfilePicture( data.userId );
                const deleteUserCall = await deleteSitewareUser();
              }
            }
          }catch (e){
            console.error(e);
            return res.status( 400 ).send( { errorcode: 4, message: "Error while deleting the user" } );
          }
          break;
        default:
          return res.status( 400 ).send( { errorcode: 3, message: "Undefined behaviour" } );
        }
      }
    }else{
      return res.status( 400 ).send( { errorcode: 2, message: "Missing data" } );
    }


  }else{
    return res.status( 400 ).send( { errorcode: 1, message: "The request method is forbidden!" } );
  }
}
