import { doc, getFirestore, setDoc } from "firebase/firestore";
import { firebase_app } from "../../db";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import getDocument from "../data/getData";
import findDocuments from "../data/findDocuments";
import setData, { addDataWithoutId } from "../data/setData";
import addData from "../data/setData";

const auth = getAuth(firebase_app);
const db = getFirestore(firebase_app);

export default async function signUp(email, username, password, name, street, city, postalcode, country) {
    let result = null,
        error = null;
        
        try {
            let usernameexistsquery = await findDocuments('User', "username", "==", username);
            console.log(usernameexistsquery);
            if(usernameexistsquery.result.size == 0){
                try {
                    result = await createUserWithEmailAndPassword(auth, email, password);
                    try{
                        let companycreationresult = await addDataWithoutId("Company", { name: name, street: street, city: city, postalcode: postalcode, country: country, settings: {background: ""} });
                        console.log(companycreationresult);
                        try {
                            let usercreationresult = await addData("User", result.user.uid, { username: username, Role: "Role/Company", company: `Company/${companycreationresult.result.id}` });
                            console.log(usercreationresult);
                        } catch(e) {
                            console.log(e);
                        }
                    }catch(e){
                        console.log(e);
                    }
                } catch (e) {
                    console.log(e);
                }
            }
        } catch (ie) {
            console.log(ie);
        }
    

    return { result, error };
}