import { getDownloadURL, getMetadata, ref, uploadBytes } from "firebase/storage";
import { drive } from "../../db";

export async function uploadFile( blob: any, id: string ) {
  try{
    const storageRef = ref( drive, `profilepictures/${id}` );
    await uploadBytes( storageRef, blob );
    
    const url = await getDownloadURL( storageRef );
    return url;
  }  catch( e ) {
    console.log( e );
    return "";
  }
}

export async function getImageUrl( id: string ) {
  try{
    const storageRef = ref( drive, `profilepictures/${id}` );

    const url = await getDownloadURL( storageRef );
    return url;
  } catch( error ) {
    return undefined;
  }
}

export async function fileExists( id: string ) {
  try{
    const storageRef = ref( drive, `profilepictures/${id}` );

    await getMetadata( storageRef );
    return true;
  } catch( e ) {
    console.log( e );
    return false;
  }
}