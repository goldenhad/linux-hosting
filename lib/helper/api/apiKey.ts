import * as CryptoJS from "crypto-js";
import { firestore } from "../../firebase/admin";
import { User } from "../../firebase/types/User";

interface KeyInformation {
    company_id: string,
    api_key: string
}

export interface ValidationResult{
  user: User,
}

export function validateApiKey(apiKey): Promise<ValidationResult> {
  /**
   * Returns a promise that resolves if the given api key is valid. Rejects
   * the promise if api key is invalid in any regard
   */
  return new Promise(async (resolve, reject) => {
    if(apiKey && apiKey != ""){
      try{
        // Get the api key password from the env file
        //const apikeyguard = process.env.APIKEY_GUARD;
  
        // decrypt the given api key with the guard
        //const decrypted = CryptoJS.AES.decrypt(apiKey, apikeyguard);
        console.log(apiKey)
  
        const userCol = firestore.collection("User");
        const docByKey = await userCol.where("apikey", "==", apiKey).get();
  
        if(!docByKey.empty){
          if(docByKey.docs.length == 1){
            const user = docByKey.docs[0].data() as User;
            resolve({ user: user });
          }else{
            reject({ errorcode: 666, message: "API key exists multiple times!" });
          }
        }else{
          console.error(docByKey.docs);
          reject({ errorcode: 777, message: "API key does not exist!" });
        }
  
      }catch(decryptionError){
        console.error(decryptionError);
        reject({ errorcode: 888, message: "API key does not exist!" });
      }
    }else{
      reject({ errorcode: 999, message: "Please provide an api key!" });
    }
  })
}