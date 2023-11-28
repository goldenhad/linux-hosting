import { firebase_app } from "../../db";
import { signInWithEmailAndPassword, getAuth, sendPasswordResetEmail, confirmPasswordReset, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";

const auth = getAuth(firebase_app);

export default async function reauthUser(email, password) {
    let result = null,
        error = null;
    try {
        let curruser = auth.currentUser;
        let creds = EmailAuthProvider.credential(email, password)
        result = await reauthenticateWithCredential(curruser, creds);
    } catch (e) {
        error = e;
    }

    return { result, error };
}