import { firebase_app } from "../../../db";
import { getFirestore, doc, getDoc, query, where, getDocs, collection } from "firebase/firestore";

const db = getFirestore( firebase_app );


export default async function getDocument( collection, id ) {
  const docRef = doc( db, collection, id );

  let result = null;
  let error = null;

  try {
    result = await getDoc( docRef );
  } catch ( e ) {
    error = e;
  }

  return { result, error };
}


export async function getDocWhere( col, state, comperator, invariant ) {
  const docRef = collection( db, col );

  let result = null;
  let error = null;

  try {
    const rawdata = await getDocs( query( docRef, where( state, comperator, invariant ) ) );
    result = [];
    rawdata.forEach( ( doc ) => {
      const dat = doc.data();
      dat.id = doc.id;
      result.push( dat );
    } )
  } catch ( e ) {
    error = e;
  }

  return { result, error };
}


export async function getAllDocs( col ) {
  const docRef = collection( db, col );

  let result = null;
  let error = null;

  try {
    const rawdata = await getDocs( docRef );
    result = [];
    rawdata.forEach( ( doc ) => {
      const obj = doc.data();
      obj.uid = doc.id;
      result.push( obj );
    } )
  } catch ( e ) {
    error = e;
  }

  return { result, error };
}