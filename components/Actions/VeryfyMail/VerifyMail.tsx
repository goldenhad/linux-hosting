import { useEffect, useState } from "react";
import { message } from "antd";
import { applyActionCode, checkActionCode, getAuth } from "firebase/auth";
import { firebase_app } from "../../../db";
import { useRouter } from "next/router";
import styles from "./verify.action.module.scss";
import axios from "axios";
import FatButton from "../../FatButton";
import { sendEmailVerification } from "@firebase/auth";
import { useAuthContext } from "../../context/AuthContext";

const auth = getAuth( firebase_app );


export function VerifyMail(props: { oobCode: string }){
  const router = useRouter();
  const [ verifyFailed, setVerifyFailed ] = useState(false);
  const [ worked, setWorked ] = useState(false);
  const [ emailSend, setEmailSend ] = useState(false);
  const [ sending, setSending ] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect( () => {
    /*const takeAction = async () => {
      console.log(auth.currentUser);
      if(auth.currentUser){

      }
    }*/

    auth.onAuthStateChanged(async (user) => {
      if(!user.emailVerified){
        if(props.oobCode != "") {
          try{
            await applyActionCode(auth, props.oobCode);
            setVerifyFailed(false);
            setWorked(true);
          }catch (e){
            console.log(e);
            console.log(props.oobCode);
            setVerifyFailed(true);
          }
        }
      }else{
        setVerifyFailed(false);
        setWorked(true);
      }
    }, (err) => {
      console.log(err);
    })

    //takeAction();
  }, [props.oobCode]);

  const sendMail = async () => {
    await sendEmailVerification(auth.currentUser);
  }
  
  
  const FailedNotice = () => {
    return(
      <div className={styles.notice}>
        <div className={styles.title}>Verifizierung fehgeschlagen!</div>

        <div className={styles.info}>
          Ups, es scheint, als wäre die Überprüfung Ihrer E-Mail nicht durchgegangen. Das kann durchaus mal vorkommen,
          vor allem, wenn der Verifikationslink seine Gültigkeit verloren hat. Kein Grund zur Sorge!
          Mit dem Button direkt unter dieser Nachricht können Sie ganz einfach einen neuen Verifikationslink anfordern.
        </div>
        <FatButton onClick={async () => {
          setSending(true);
          await sendMail();
          messageApi.success("E-Mail versandt! Überprüfen Sie ihr Postfach.")
          setSending(false);
          setEmailSend(true);
        }} disabled={emailSend} loading={sending} text={"E-Mail erneut senden"} />
      </div>
    );
  }

  const WorkedNotice = () => {
    return (
      <div className={styles.notice}>
        <div className={styles.title}>Verifizierung erfolgreich!</div>

        <div className={styles.info}>
            Die Bestätigung Ihrer E-Mail war erfolgreich. Sie können das Fenster nun schließen!
        </div>
        <FatButton onClick={async () => {
          await axios.get("/api/logout");
          router.push("/login");
        }} text={"Zum Login"}/>
      </div>
    );
  }

  return (
    <>
      {contextHolder}
      <div className={styles.container}>
        <div className={styles.logorow}>
          <div className={styles.logobox}>
            {/* eslint-disable-next-line */}
              <img src={"/logo.svg"} alt="Logo" width={100}/>
          </div>
        </div>

        <div className={styles.wrapper}>
          {(verifyFailed) ? <FailedNotice/> : <></>}
          {(worked) ? <WorkedNotice/> : <></>}
        </div>
      </div>


    </>
  );
}