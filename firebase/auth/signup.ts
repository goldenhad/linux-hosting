import { doc, getFirestore, setDoc } from "firebase/firestore";
import { firebase_app } from "../../db";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { getDocWhere } from "../data/getData";
import { addDataWithoutId } from "../data/setData";
import addData from "../data/setData";
const crypto = require("crypto");

const auth = getAuth(firebase_app);

export default async function signUp(firstname, lastname, email, username, password, name, street, city, postalcode, country, isPersonal) {
    let result = null,
        error = null;
        
        try {
            let usernameexistsquery = await getDocWhere('User', "username", "==", username);
            if(usernameexistsquery.result.length == 0){
                try {
                    result = await createUserWithEmailAndPassword(auth, email, password);
                    try{
                        let companycreationresult = await addDataWithoutId("Company", { name: name, street: street, city: city, postalcode: postalcode, country: country, settings: {background: ""}, Usage: [], tokens: 150000, unlimited: false, orders: [] });
                        try {
                            let usercreationresult = await addData("User", result.user.uid, {
                                firstname: firstname,
                                lastname: lastname,
                                email: email,
                                username: username,
                                Role: (isPersonal)? "Singleuser": "Company-Admin",
                                Company: `${companycreationresult.result.id}`,
                                profiles: [],
                                usedCredits: [],
                                lastState: {
                                    dialog: "",
                                    monolog: ""
                                },
                                salt: crypto.randomBytes(8).toString('hex'),
                                setupDone: false,
                                recommend: {
                                    timesUsed: 0
                                }
                            });
                            //console.log(usercreationresult);
                        } catch(e) {
                            //console.log(e);
                        }
                    }catch(e){
                        //console.log(e);
                    }
                } catch (e) {
                    //console.log(e);
                }
            }
        } catch (ie) {
            //console.log(ie);
        }
    

    return { result, error };
}


export async function signUpUser(firstname, lastname, email, username, password, companyid, role, invitecode) {
    let result = null,
        error = null;
        
        try {
            //console.log("Entering, User signup!");
            let usernameexistsquery = await getDocWhere('User', "username", "==", username);
            //console.log(usernameexistsquery.result.length);
            if(usernameexistsquery.result.length == 0){
                try {
                    result = await createUserWithEmailAndPassword(auth, email, password);
                    try {
                        let usercreationresult = await addData("User", result.user.uid,{
                            firstname: firstname,
                            lastname: lastname,
                            username: username,
                            Role: role,
                            Company: companyid,
                            profiles: [],
                            usedCredits: [],
                            lastState: {
                                dialog: "",
                                monolog: ""
                            },
                            salt: crypto.randomBytes(8).toString('hex'),
                            setupDone: false,
                            inviteCode: invitecode,
                            recommend: {
                                timesUsed: 0
                            }
                        });
                        //console.log(usercreationresult);
                    } catch(e) {
                        //console.log(e);
                    }
                } catch (e) {
                    //console.log(e);
                }
            }
        } catch (ie) {
            //console.log(ie);
        }
    

    return { result, error };
}