import { firebase_app } from "../../db";
import { getFirestore, doc, setDoc, addDoc, collection, updateDoc } from "firebase/firestore";

const db = getFirestore(firebase_app)
export default async function updateData(colllection, id, data) {
    let result = null;
    let error = null;

    try {
        result = await updateDoc(doc(db, colllection, id), data);
    } catch (e) {
        error = e;
        console.log(e);
    }

    return { result, error };
}