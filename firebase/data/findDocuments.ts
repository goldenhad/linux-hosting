import { firebase_app } from "../../db";
import { getFirestore, collection, where, query, getDocs } from "firebase/firestore";

const db = getFirestore(firebase_app)
export default async function findDocuments(coll, attr, comparator, value) {
    let result = null;
    let error = null;

    try {
        let docquery = query(collection(db, coll), where(attr, comparator, value));
        result = await getDocs(docquery);
    } catch (e) {
        error = e;
    }

    return { result, error };
}
