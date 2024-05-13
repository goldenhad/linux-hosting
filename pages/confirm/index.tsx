import { GetServerSideProps } from "next";
import { useState } from "react";
import styles from "./confirm.module.scss"
import Head from "next/head";
import { useRouter } from "next/router";
import FatButton from "../../components/FatButton";
import axios from "axios";

// Props given by firebase to this page trough redirection
interface restprops {
    valid: boolean
}

/**
 * Parse the request to the page from firebase
 * @param ctx
 */
export const getServerSideProps: GetServerSideProps = async ( ctx ) => {
  const valid = ctx.query.valid;

  //console.log(mode, code, apikey);

  return { props: { valid: valid == "1"  } }
}

/**
 * Reset page. Lets users action their password.
 * @param props Props of the firebase request to this page
 * @constructor
 */
export default function Confirm( props: restprops ){
  const router = useRouter();
  const [ valid ] = useState(props.valid);

  const validDescription = () => {
    if(valid){
      return(
        <>
          <div>
              Die Bestätigung Ihrer E-Mail war erfolgreich. Sie können das Fenster nun schließen!
            <FatButton onClick={() => {
              router.replace("/")
            }} text={"Zu Siteware"} />
          </div>
        </>
      );
    }else{
      return "Bevor wir fortfahren können, benötigen wir eine Bestätigung Ihrer E-Mail-Adresse.\n" +
              "              Zu diesem Zweck haben wir Ihnen einen entsprechenden Link zugesendet.";
    }
  }
  
  const loggout = async () => {
    await axios.get("/api/logout");
    router.replace("/login");
  }

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
          <div className={styles.formtitle}>{(valid)? "Verifikation erfolgreich": "Bestätigen Sie Ihre E-Mail"}</div>
          <div className={styles.formexplanation}>
            {validDescription()}
          </div>
          <FatButton onClick={() => {
            loggout() 
          }} text={"Zurück zum Login"}></FatButton>
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