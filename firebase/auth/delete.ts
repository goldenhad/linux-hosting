import { firebase_app } from "../../db";
import { signInWithEmailAndPassword, getAuth, sendPasswordResetEmail, confirmPasswordReset, deleteUser } from "firebase/auth";

const auth = getAuth(firebase_app);

export default async function deleteSitewareUser() {
    let result = null,
        error = null;
    try {
        let curruser = auth.currentUser;
        result = await deleteUser(curruser);
    } catch (e) {
        error = e;
    }

    return { result, error };
}