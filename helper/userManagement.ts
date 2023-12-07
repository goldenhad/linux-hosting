import { deleteUser, getAuth } from "firebase/auth";
import { firebase_app } from "../db";
import { deleteProfilePicture } from "../firebase/drive/delete";
import deleteData from "../firebase/data/deleteData";
import { auth } from "../firebase/admin";

async function deleteUserFromAuth( id: string ) {
  let result = null,
    error = null;
    
  try {
    result = await auth.deleteUser( id );
  } catch ( e ) {
    error = e;
  }

  return { result, error };
}

export async function deleteAllUserData( id: string ) {
  await deleteProfilePicture( id );
  await deleteData( "User", id );
  await deleteUserFromAuth( id );

}