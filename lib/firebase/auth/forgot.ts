import { firebase_app } from "../../../db";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

const auth = getAuth( firebase_app );

export default async function forgotpassword( email ) {
  let result = null,
    error = null;
  try {
    result = await sendPasswordResetEmail( auth, email );
    //console.log("Sending forgot mail...");
    //console.log(result);
  } catch ( e ) {
    error = e;
  }

  return { result, error };
}