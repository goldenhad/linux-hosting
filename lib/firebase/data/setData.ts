import { firebase_app } from "../../../db";
import { getFirestore, doc, setDoc, addDoc, collection } from "firebase/firestore";

const db = getFirestore( firebase_app )
export default async function addData( colllection, id, data ) {
  let result = null;
  let error = null;

  try {
    result = await setDoc( doc( db, colllection, id ), data );
  } catch ( e ) {
    error = e;
  }

  return { result, error };
}

export async function addDataWithoutId( col, data ) {
  let result = null;
  let error = null;

  try {
    result = await addDoc( collection( db, col ), data );
  } catch ( e ) {
    error = e;
  }

  return { result, error };
}