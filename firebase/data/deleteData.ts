import { firebase_app } from "../../db";
import { getFirestore, doc, getDoc, query, where, getDocs, collection, deleteDoc } from "firebase/firestore";

const db = getFirestore(firebase_app);

export default async function deleteData(collection, id) {
    let docRef = doc(db, collection, id);

    let result = null;
    let error = null;

    try {
        result = await deleteDoc(docRef);
    } catch (e) {
        error = e;
    }

    return { result, error };
}