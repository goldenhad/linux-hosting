import { firebase_app } from "../../../db";
import { getAuth, confirmPasswordReset } from "firebase/auth";

const auth = getAuth( firebase_app );

export default async function resetpassword( code, newpassword ) {
  let result = null,
    error = null;
  try {
    result = await confirmPasswordReset( auth, code, newpassword );
    //console.log("Resetting password...");
    //console.log(result);
  } catch ( e ) {
    error = e;
  }

  return { result, error };
}