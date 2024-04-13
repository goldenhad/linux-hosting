import { firebase_app } from "../../db";
import { getAuth, confirmPasswordReset } from "firebase/auth";
import { auth } from "../admin";


export default async function verifyEmail( uid ) {
  let result = null,
    error = null;
  try {
    result = await auth.updateUser(uid, { emailVerified: true });
    //console.log("Resetting password...");
    //console.log(result);
  } catch ( e ) {
    error = e;
  }

  return { result, error };
}