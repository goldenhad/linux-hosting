import { useEffect, useState } from "react";
import resetpassword from "../../../firebase/auth/reset";
import { Alert, Button, Card, Form, Input, message, Result } from "antd";
import { getAuth } from "firebase/auth";
import { firebase_app } from "../../../db";
import { useRouter } from "next/router";
import verifyEmail from "../../../firebase/auth/verify";
import styles from "./verify.action.module.scss";
import axios from "axios";
import FatButton from "../../FatButton";
import { sendEmailVerification } from "@firebase/auth";

const auth = getAuth( firebase_app );


export function VerifyMail(props: { oobCode: string }){
  const router = useRouter();
  const [ verifyFailed, setVerifyFailed ] = useState(false);
  const [ emailSend, setEmailSend ] = useState(false);
  const [ sending, setSending ] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect( () => {
    const takeAction = async () => {
      if(auth.currentUser != null){
        if(props.oobCode != "") {
          if (!auth.currentUser.emailVerified || true) {
            const verreq = await axios.post("/api/account/verify", { uid: auth.currentUser.uid });
            if (verreq.status != 200) {
              console.log("VERIFIED");
              setVerifyFailed(true);
              router.push("/confirm");
            } else {
              console.log("VERIFICATION FAILED!!!");
              setVerifyFailed(true);
            }
          }else{
            router.push("/");
          }
        }
      }
    }

    takeAction();
  }, []);

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

  return(
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
        </div>
      </div>


    </>
  );
}