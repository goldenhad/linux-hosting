import { firebase_app } from "../../db";
import { signInWithEmailAndPassword, getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import addData, { addDataWithoutId } from "../data/setData";
import { sendEmailVerification } from "@firebase/auth";

const auth = getAuth( firebase_app );

export default async function signIn( email, password ) {
  let result = null,
    error = null;
  try {
    result = await signInWithEmailAndPassword( auth, email, password );
    //console.log("Logged in...");
    //console.log(result);

    const idToken = await result.user.getIdToken();

    // Sets authenticated browser cookies
    await fetch("/api/login", {
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    });

    if(!result.user.email_verified){
      await sendEmailVerification(result.user);
      console.log("EMAIL VERSENDET");
    }
    
  } catch ( e ) {
    error = e;
  }

  return { result, error };
}


export async function signInWithGoogle() {
  let result = null,
    error = null;
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters( { prompt: "select_account" } );

    result = await signInWithPopup( auth, provider );

    if( result ){
      if( result._tokenResponse.isNewUser ){
        try{
          const companycreationresult = await addDataWithoutId( "Company", {
            name: result._tokenResponse.displayName + " Firma",
            street: "",
            city: "",
            postalcode: "",
            country: "",
            settings: { background: "" },
            Usage: [],
            Quota: "Free"
          }
          );
          //console.log(companycreationresult);
          try {
            await addData( "User", result.user.uid, {
              firstname: result._tokenResponse.firstName,
              lastname: result._tokenResponse.lastName,
              email: result._tokenResponse.email,
              username: result._tokenResponse.firstname + result._tokenResponse.lastname,
              Role: "Company",
              Company: `${companycreationresult.result.id}`,
              profiles: [],
              usedCredits: [],
              lastState: {
                dialog: {
                  profile: "",
                  dialog: "",
                  continue: "",
                  address: "",
                  order: "",
                  length: ""
                },
                monolog: {
                  profile: "",
                  content: "",
                  address: "",
                  order: "",
                  length: ""
                },
                blog: {
                  profile: "",
                  content: "",
                  order: "",
                  length: ""
                }
              }
            } );
            //console.log(usercreationresult);
          } catch( e ) {
            //console.log(e);
          }
        }catch( e ){
          //console.log(e);
        }
      }
    }

    //console.log("Logged in...");
    //console.log(result);
  } catch ( e ) {
    error = e;
  }

  return { result, error };
}