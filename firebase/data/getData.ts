import { firebase_app } from "../../db";
import { getFirestore, doc, getDoc, query, where, getDocs, collection } from "firebase/firestore";

const db = getFirestore(firebase_app)
export default async function getDocument(collection, id) {
    let docRef = doc(db, collection, id);

    let result = null;
    let error = null;

    try {
        result = await getDoc(docRef);
    } catch (e) {
        error = e;
    }

    return { result, error };
}


export async function getDocWhere(col, state, comperator, invariant) {
    let docRef = collection(db, col);

    let result = null;
    let error = null;

    try {
        let rawdata = await getDocs(query(docRef, where(state, comperator, invariant)));
        result = [];
        rawdata.forEach((doc) => {
            result.push(doc.data());
        })
    } catch (e) {
        error = e;
    }

    return { result, error };
}

