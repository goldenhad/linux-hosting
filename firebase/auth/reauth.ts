import { firebase_app } from "../../db";
import { getAuth, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";

const auth = getAuth( firebase_app );

export default async function reauthUser( email, password ) {
  let result = null,
    error = null;
  try {
    const curruser = auth.currentUser;
    const creds = EmailAuthProvider.credential( email, password )
    result = await reauthenticateWithCredential( curruser, creds );
  } catch ( e ) {
    error = e;
  }

  return { result, error };
}