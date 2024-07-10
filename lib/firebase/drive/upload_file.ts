import { getDownloadURL, getMetadata, ref, uploadBytes } from "firebase/storage";
import { drive } from "../../../db";

export async function uploadProfilePicture(blob, id: string ) {
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

export async function uploadAssistantImage(blob, id: string ) {
  try{
    const storageRef = ref( drive, `assistant/images/${id}` );
    await uploadBytes( storageRef, blob );

    const url = await getDownloadURL( storageRef );
    return url;
  }  catch( e ) {
    console.log( e );
    return "";
  }
}

export async function getAssistantImageUrl(id: string ) {
  try{
    const storageRef = ref( drive, `assistant/images/${id}` );

    const url = await getDownloadURL( storageRef );
    return url;
  } catch( error ) {
    return undefined;
  }
}

export async function getProfilePictureUrl(id: string ) {
  try{
    const storageRef = ref( drive, `profilepictures/${id}` );

    const url = await getDownloadURL( storageRef );
    return url;
  } catch( error ) {
    return undefined;
  }
}

export async function getAssistantImage( name: string ) {
  try{
    const storageRef = ref( drive, `assistants/${name}` );

    const url = await getDownloadURL( storageRef );
    return url;
  } catch( error ) {
    return undefined;
  }
}

export async function fileExists( id: string ) {
  try{
    const storageRef = ref( drive, `${id}` );

    await getMetadata( storageRef );
    return true;
  } catch( e ) {
    console.log( e );
    return false;
  }
}