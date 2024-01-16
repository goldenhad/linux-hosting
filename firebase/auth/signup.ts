import { firebase_app } from "../../db";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import getDocument, { getDocWhere } from "../data/getData";
import { addDataWithoutId } from "../data/setData";
import addData from "../data/setData";
import crypto from "crypto";
import updateData from "../data/updateData";
import { InvitedUser } from "../types/Company";
import axios from "axios";
import { Calculations } from "../types/Settings";
import { TokenCalculator } from "../../helper/price";

const auth = getAuth( firebase_app );

export default async function signUp( firstname, lastname, email, username, password, name, street, city, postalcode, country, isPersonal, recommended ) {
  let result = null;
  const error = null;
        
  try {
    const usernameexistsquery = await getDocWhere( "User", "username", "==", username );
    if( usernameexistsquery.result.length == 0 ){
      try {
        result = await createUserWithEmailAndPassword( auth, email, password );
        try{
          const companycreationresult = await addDataWithoutId( "Company", {
            name: name,
            street: street,
            city: city,
            postalcode: postalcode,
            country: country,
            settings: { background: "" },
            Usage: [],
            tokens: 150000,
            unlimited: false,
            orders: [],
            invitedUsers: []
          } );
          try {
            await addData( "User", result.user.uid, {
              firstname: firstname,
              lastname: lastname,
              email: email,
              username: username,
              Role: ( isPersonal )? "Singleuser": "Company-Admin",
              Company: `${companycreationresult.result.id}`,
              profiles: [],
              usedCredits: [],
              services: {
                favourites: []
              },
              lastState: {
                dialog: "",
                monolog: "",
                blog: ""
              },
              salt: crypto.randomBytes( 8 ).toString( "hex" ),
              setupDone: false,
              recommend: {
                timesUsed: 0
              },
              tour: {
                home: false,
                dialog: false,
                monolog: false,
                blog: false,
                usage: false,
                profiles: false,
                company: false
              }
            } );
            
            try{
              const { data } = await axios.post("/api/payment/createcustomer", {
                name: (name != "")? name: `${firstname} ${lastname}`,
                email: email,
                address: {
                  city: city,
                  street: street,
                  postalcode: postalcode
                }
              });

              const customerid = data.message;
              await updateData("Company", companycreationresult.result.id , { customerId: customerid });
            }catch{
              console.log("Could not create the customer at stripe...");
            }

            if( recommended ){
              const cmpny_result = await getDocument( "Company", recommended );
              const cmpny = cmpny_result.result.data();
              const calculationsres = await getDocument( "Settings", "Calculation");
              const calculations: Calculations = calculationsres.result;

              const calc = new TokenCalculator(calculations);

              if( !cmpny.recommended ){
                await updateData( "Company", recommended, {
                  tokens: cmpny.tokens +  calc.denormalizeTokens(calculations.startCredits),
                  recommended: true 
                } );
              }
            }
            //console.log(usercreationresult);
          } catch( e ) {
            //console.log(e);
          }
        }catch( e ){
          //console.log(e);
        }
      } catch ( e ) {
        //console.log(e);
      }
    }
  } catch ( ie ) {
    //console.log(ie);
  }
    

  return { result, error };
}


export async function signUpUser( firstname, lastname, email, username, password, companyid, role, invitecode ) {
  let result = null;
  let error = false;
        
  try {
    //console.log("Entering, User signup!");
    const usernameexistsquery = await getDocWhere( "User", "username", "==", username );
    //console.log(usernameexistsquery.result.length);
    if( usernameexistsquery.result.length == 0 ){
      try {
        try {
          const invusers = await getDocument( "Company", companyid );
          if( invusers.result.data() ){
            const data = invusers.result.data();
            if( data.invitedUsers ){
              const invited = data.invitedUsers;
              
              const userWasInvited = invited.find( ( elm: InvitedUser ) => {
                return elm.email == email;
              } );

              console.log( "Was the user invited?" );
              console.log( userWasInvited );

              if( userWasInvited ){
                result = await createUserWithEmailAndPassword( auth, email, password );
                await addData( "User", result.user.uid,{
                  firstname: firstname,
                  lastname: lastname,
                  username: username,
                  email: email,
                  Role: role,
                  Company: companyid,
                  profiles: [],
                  usedCredits: [],
                  lastState: {
                    dialog: "",
                    monolog: ""
                  },
                  salt: crypto.randomBytes( 8 ).toString( "hex" ),
                  setupDone: false,
                  inviteCode: invitecode,
                  recommend: {
                    timesUsed: 0
                  },
                  tour: {
                    home: false,
                    dialog: false,
                    monolog: false,
                    blog: false,
                    usage: false,
                    profiles: false,
                    company: false
                  }
                } );


                const cleaned = invited.filter( ( elm: InvitedUser ) => {
                  return elm.email != email;
                } );

                console.log( cleaned );
  
                await updateData( "Company", companyid, { invitedUsers: cleaned } );
              }else{
                error = true;
              }
            }else{
              error = true;
            }
          }else{
            error = true;
          }
          
          console.log( error );
        } catch( e ) {
          console.log( e );
        }
      } catch ( e ) {
        console.log( e );
      }
    }
  } catch ( ie ) {
    console.log( ie );
  }
    

  return { result, error };
}