import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import { Alert, Button, Form, Input, Result } from "antd";
import styles from "./confirm.module.scss"
import Head from "next/head";
import { getAuth } from "firebase/auth";
import { firebase_app } from "../../db";
import { useRouter } from "next/router";

const auth = getAuth(firebase_app);

// Props given by firebase to this page trough redirection
interface restprops {
    mode: string,
    oobCode: string,
    apiKey: string,
}

/**
 * Parse the request to the page from firebase
 * @param ctx
 */
export const getServerSideProps: GetServerSideProps = async ( ctx ) => {
  const mode = ctx.query.mode;
  const code = ctx.query.oobCode;
  const apikey = ctx.query.apiKey;

  //console.log(mode, code, apikey);

  if( mode && code && apikey ){
    return { props: { mode: mode, oobCode: code, apiKey: apikey  } }
  }else{
    return { props: {  } }
  }
}

/**
 * Reset page. Lets users action their password.
 * @param props Props of the firebase request to this page
 * @constructor
 */
export default function Confirm( props: restprops ){
  const router = useRouter();

  useEffect(() => {
    if(auth.currentUser.emailVerified){
      router.push("/");
    }
  }, []);

  return(
    <div>
      <div className={styles.logincontainer}>
        <div className={styles.logorow}>
          <div className={styles.logobox}>
            {/* eslint-disable-next-line */}
            <img src={"/logo.svg"} alt="Logo" width={100}/>
          </div>
        </div>

        <div className={styles.formContainer}>
          <div className={styles.formtitle}>Bestätigen Sie Ihre E-Mail</div>
          <div className={styles.formexplanation}>
              Bevor wir fortfahren können, benötigen wir eine Bestätigung Ihrer E-Mail-Adresse.
              Zu diesem Zweck haben wir Ihnen einen entsprechenden Link zugesendet.
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Exclusive Layout of the action page
 * @param page
 */
Confirm.getLayout = (page) => {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/x-icon" href="small_logo.ico" />
        <title>Siteware business | ai assistant</title>
      </Head>
      <main>
        {page}
      </main>
    </>
  );
}