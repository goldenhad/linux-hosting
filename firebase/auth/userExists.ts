import { getDocWhere } from "../data/getData";

export default async function userExists( email: string ) {
  const result = null;
  let error = null;

  try {
    //console.log(email);
    const { result } = await getDocWhere( "User", "email", "==", email.toLowerCase() );
    //console.log(result);
    return result.length > 0;
  } catch ( e ) {
    error = e;
    //console.log(e);
  }

  return { result, error };
}

export async function usernameExists( username: string ) {
  const result = null;
  let error = null;

  try {
    const { result } = await getDocWhere( "User", "username", "==", username.toLowerCase() );
    //console.log(result);
    return result.length > 0;
  } catch ( e ) {
    error = e;
    //console.log(e);
  }

  return { result, error };
}

export async function usernameExistsAtDifferentUser( username: string, userid: string ) {
  const result = null;
  let error = null;
  
  try {
    const { result } = await getDocWhere( "User", "username", "==", username );
    if( result.length > 0 ){
      let exists = false;
      result.forEach( ( user ) => {
        if( userid != user.id ){
          exists = true;
        }
      } )

      return exists;
    }else{
      return false;
    }
  } catch ( e ) {
    error = e;
    //console.log(e);
  }

  return { result, error };
}