import { firebase_app } from "../../db";
import { getFirestore, doc, getDoc, query, where, getDocs, collection, DocumentData, CollectionReference } from "firebase/firestore";
import Assistant from "../types/Assistant";
import { Service } from "../types/Service";
import { Company } from "../types/Company";

const db = getFirestore( firebase_app );

type DocReturn<T> = {
  result: T[], 
  error: string | null | object
}

type Collections = {
  Assistants: Assistant,
  Services: Service,
  Company: Company,
}

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


export async function getAllDocs<T extends  Collections[C] & { uid: string }, C extends keyof Collections>( col: C ): Promise<DocReturn<T>>{
  const docRef = collection( db, col ) as CollectionReference<T>

  let result: Array<T> | null = null;
  let error = null;

  try {
    const rawdata = await getDocs( docRef );
    result = [];
    rawdata.forEach( ( doc ) => {
      const obj: T = doc.data();
      obj.uid = doc.id;
      result.push( obj );
    } )
  } catch ( e ) {
    error = e;
  }

  return { result, error };
}