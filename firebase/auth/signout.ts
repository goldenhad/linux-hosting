import { firebase_app } from "../../db";
import { getAuth, signOut } from "firebase/auth";

const auth = getAuth(firebase_app);

export default async function signUserOut() {
    let result = null,
        error = null;
    try {
        result = await signOut(auth);
        //console.log("Logged out...");
        //console.log(result);
    } catch (e) {
        error = e;
    }

    return { result, error };
}