import { firebase_app } from "../../db";
import { signInWithEmailAndPassword, getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import addData, { addDataWithoutId } from "../data/setData";

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


export async function signInWithGoogle() {
    let result = null,
        error = null;
    try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });

        result = await signInWithPopup(auth, provider);

        if(result){
            if(result._tokenResponse.isNewUser){
                try{
                    let companycreationresult = await addDataWithoutId("Company", { name: result._tokenResponse.displayName + " Firma", street: "", city: "", postalcode: "", country: "", settings: {background: ""}, Usage: [], Quota: "Free" });
                    console.log(companycreationresult);
                    try {
                        let usercreationresult = await addData("User", result.user.uid, { firstname: result._tokenResponse.firstName, lastname: result._tokenResponse.lastName, email: result._tokenResponse.email, username: result._tokenResponse.firstname + result._tokenResponse.lastname, Role: "Company", Company: `${companycreationresult.result.id}`, profiles: [], usedCredits: [] });
                        console.log(usercreationresult);
                    } catch(e) {
                        console.log(e);
                    }
                }catch(e){
                    console.log(e);
                }
            }
        }

        console.log("Logged in...");
        console.log(result);
    } catch (e) {
        error = e;
    }

    return { result, error };
}