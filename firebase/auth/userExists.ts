import { firebase_app } from "../../db";
import { signInWithEmailAndPassword, getAuth, fetchSignInMethodsForEmail } from "firebase/auth";
import { getDocWhere } from "../data/getData";

const auth = getAuth(firebase_app);

export default async function userExists(email: String) {
    let result = null,
        error = null;
    try {
        console.log(email);
        let { result, error } = await getDocWhere("User", "email", "==", email.toLowerCase());
        console.log(result);
        return result.length > 0;
    } catch (e) {
        error = e;
        console.log(e);
    }

    return { result, error };
}