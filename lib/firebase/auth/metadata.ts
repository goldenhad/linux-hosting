import { auth } from "../admin";

export default async function getMetadata(uid: string) {
  let result = null,
    error = null;
    
  try {
    const curruser = await auth.getUser(uid);
    result = curruser.metadata;
  } catch ( e ) {
    error = e;
  }

  return { result, error };
}