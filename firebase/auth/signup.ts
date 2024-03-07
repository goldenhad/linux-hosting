import { firebase_app } from "../../db";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import getDocument, { getDocWhere } from "../data/getData";
import { addDataWithoutId } from "../data/setData";
import addData from "../data/setData";
import crypto from "crypto";
import updateData from "../data/updateData";
import { InvitedUser } from "../types/Company";
import { Calculations } from "../types/Settings";
import { TokenCalculator } from "../../helper/price";

const auth = getAuth( firebase_app );

export default async function signUp( firstname, lastname, email, username, password, name, street, city, postalcode, country, isPersonal, recommended, coupon? ) {
  let result = null;
  const error = null;
        
  try {
    const usernameexistsquery = await getDocWhere( "User", "username", "==", username );
    //console.log(usernameexistsquery);
    //console.log(usernameexistsquery.result.length == 0);
    if( usernameexistsquery.result.length == 0 ){
      try {
        result = await createUserWithEmailAndPassword( auth, email, password );
        try{
          const calculationsres = await getDocument( "Settings", "Calculation");
          const calculations: Calculations = calculationsres.result.data();

          const calc = new TokenCalculator(calculations);

          let credits = calculations.startCredits;

          if(coupon){
            const coupons = calculations.coupons;

            const singlecouponIndex = coupons.findIndex((val) => {
              return val.code == coupon;
            })

            if(singlecouponIndex != -1){
              credits = coupons[singlecouponIndex].credits;
            }
          }

          const companycreationresult = await addDataWithoutId( "Company", {
            name: name,
            street: street,
            city: city,
            postalcode: postalcode,
            country: country,
            settings: { background: "" },
            Usage: [],
            tokens: calc.denormalizeTokens(credits),
            unlimited: false,
            orders: [],
            invitedUsers: []
          } );

          //console.log("created the company");
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

            //console.log("Created the user");
            
            /* try{
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
              console.log("created the customer at stripe")
              await updateData("Company", companycreationresult.result.id , { customerId: customerid });
              console.log("Updated the company with the customer id")
            }catch(e){
              console.log(e);
              console.log("Could not create the customer at stripe...");
            } */

            if( recommended ){
              const cmpny_result = await getDocument( "Company", recommended );
              const cmpny = cmpny_result.result.data();

              if( !cmpny.recommended ){
                await updateData( "Company", recommended, {
                  tokens: calculations.startCredits,
                  recommended: true 
                } );
              }
            }

            //console.log(companycreationresult);

            //console.log(usercreationresult);
          } catch( e ) {
            console.log(e);
          }
        }catch( e ){
          console.log(e);
        }
      } catch ( e ) {
        console.log(e);
      }
    }else{
      throw error("Username already exists!")
    }
  } catch ( ie ) {
    console.log(ie);
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