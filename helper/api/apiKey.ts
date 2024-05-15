import * as CryptoJS from "crypto-js";
import { firestore } from "../../firebase/admin";

interface KeyInformation {
    company_id: string,
    api_key: string
}

export interface ValidationResult{
  companyId: string,
}

export function validateApiKey(apiKey): Promise<ValidationResult> {
  /**
   * Returns a promise that resolves if the given api key is valid. Rejects
   * the promise if api key is invalid in any regard
   */
  return new Promise(async (resolve, reject) => {
    try{
      // Get the api key password from the env file
      const apikeyguard = process.env.APIKEY_GUARD;

      // decrypt the given api key with the guard
      const decrypted = CryptoJS.AES.decrypt(apiKey, apikeyguard);

      try{
        // Convert the decrypted value to a string
        const decryptedString = CryptoJS.enc.Utf8.stringify(decrypted);
        // Parse converted as json to get the included JSON object containing all the data
        const parsedString: KeyInformation = JSON.parse(decryptedString);
        // Type the json object as KeyInformation object
        const keyInformation = parsedString;

        // Validate the members of the given key object
        if(keyInformation && keyInformation.company_id != "" && keyInformation.api_key != ""){
          // If the company id is present get the company representation from our database
          const privateKeyReq = await firestore.doc(`Company/${keyInformation.company_id}`).get();

          // Validate if the company can be found in the database
          if(privateKeyReq){
            // Get the data of the company
            const companyData = privateKeyReq.data();

            // Query the company representation for the api password to check against the key contained in the decrypted object
            const privateKey = companyData.api_password;

            try{
              // Validate existance of the api password contained in the company representation
              if(privateKey && privateKey != ""){
                // Check if the given api_key and the password from the database match
                if(keyInformation.api_key == privateKey){
                  // If they match, then the given api key is valid
                  console.log("passed!");
                  resolve({ companyId: keyInformation.company_id });
                }else{
                  throw Error("API key does not match");
                }
              }else {
                throw Error("API key definition incomplete");
              }
            }catch(matchError){
              console.error(matchError);
              reject({ errorcode: 997, message: "API key invalid" });
            }
          }else{
            throw Error("Key parsing revealed invalid object");
          }
        }else{
          throw Error("Key parsing revealed invalid object");
        }

      }catch(parseError){
        console.error(parseError);
        reject({ errorcode: 998, message: "API key does not exist!" });
      }

    }catch(decryptionError){
      console.error(decryptionError);
      reject({ errorcode: 999, message: "API key does not exist!" });
    }
  })
}