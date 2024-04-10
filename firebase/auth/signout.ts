import { firebase_app } from "../../db";
import { getAuth, signOut } from "firebase/auth";
import axios from "axios";

const auth = getAuth( firebase_app );

export default async function signUserOut() {
  let result = null,
    error = null;
  try {
    result = await axios.get("/api/logout");
    //console.log("Logged out...");
    //console.log(result);
  } catch ( e ) {
    error = e;
  }

  return { result, error };
}