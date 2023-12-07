import { deleteObject, ref } from "firebase/storage";
import { fileExists } from "./upload_file";
import { drive } from "../../db";

export async function deleteProfilePicture( id: string ){
  if( id != "" ){
    if( fileExists( `profilepictures/${id}` ) ){
      const storageRef = ref( drive, `profilepictures/${id}` );

      try{
        await deleteObject( storageRef );
        return true;
      }catch{
        console.log( "error deleting profilepicture" );
        return false;
      }

    }else{
      return false;
    }
  }else{
    return false;
  }
}