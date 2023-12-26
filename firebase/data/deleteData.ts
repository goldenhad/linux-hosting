import { firebase_app } from "../../db";
import { getFirestore, doc, deleteDoc } from "firebase/firestore";

const db = getFirestore( firebase_app );

export default async function deleteData( collection, id ) {
  const docRef = doc( db, collection, id );

  let result = null;
  let error = null;

  try {
    result = await deleteDoc( docRef );
  } catch ( e ) {
    error = e;
  }

  return { result, error };
}