//lib/firebase-admin.js

import * as admin from "firebase-admin";

import serviceAccount from "../../mailbuddy_priv_key.json";


if ( !admin.apps.length ) {
  admin.initializeApp( {
    credential: admin.credential.cert( serviceAccount as admin.ServiceAccount )
  } );
}

const firestore = admin.firestore();
const auth = admin.auth();

export { firestore, auth }