import { firebase_app } from "../../../db";
import { getFirestore, doc, updateDoc } from "firebase/firestore";

const db = getFirestore( firebase_app )
export default async function updateData( colllection, id, data ) {
  let result = null;
  let error = null;
  //console.log(data);

  try {
    result = await updateDoc( doc( db, colllection, id ), data );
  } catch ( e ) {
    error = e;
    //console.log(e);
  }

  return { result, error };
}