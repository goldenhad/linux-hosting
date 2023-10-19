import { PrismaClient } from '@prisma/client'
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from "firebase/firestore";


declare global {

  // allow global `var` declarations

  // eslint-disable-next-line no-var

  var prisma: PrismaClient | undefined

}


export const prisma =

  global.prisma ||

  new PrismaClient({

    //log: ['query'],

  })


if (process.env.NODE_ENV !== 'production') global.prisma = prisma


const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};


export let firebase_app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(firebase_app);