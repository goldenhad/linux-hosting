import { auth } from "../admin";


export default async function verifyEmail( oobCode ) {
  let result = null;
  let error = null;

  try {
    //result = await auth.updateUser(uid, { emailVerified: true });
    //console.log("Resetting password...");
    //console.log(result);
    const decodedToken = await auth.verifyIdToken(oobCode);
    console.log("Your decoded token is ", decodedToken);
    const uid = decodedToken.uid;
    console.log("UID", uid);

    result = await auth.updateUser(uid, { emailVerified: true });
    console.log(result);

  } catch ( e ) {
    error = e;
    console.log(e);
  }

  return { result, error };
}