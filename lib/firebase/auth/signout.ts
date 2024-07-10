import axios from "axios";

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