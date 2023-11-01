import { firebase_app } from "../../db";
import { signInWithEmailAndPassword, getAuth } from "firebase/auth";

const auth = getAuth(firebase_app);

export default async function signIn(email, password) {
    let result = null,
        error = null;
    try {
        result = await signInWithEmailAndPassword(auth, email, password);
        console.log("Logged in...");
        console.log(result);
    } catch (e) {
        error = e;
    }

    return { result, error };
}