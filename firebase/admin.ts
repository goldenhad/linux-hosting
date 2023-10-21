//lib/firebase-admin.js

import * as admin from 'firebase-admin';

var serviceAccount = require("../mailbuddy_priv_key.json");




if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const firestore = admin.firestore();
const auth = admin.auth();

export { firestore, auth }