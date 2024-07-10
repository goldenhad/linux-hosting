import { useState } from "react";
import { Alert, Button, Form, Input, Result } from "antd";
import styles from "./password.forgot.module.scss"
import Head from "next/head";
import forgotpassword from "../../../lib/firebase/auth/forgot";


/**
 * Password forgot page. Users can action their password here
 * @constructor
 */
export default function Forgot_Password(){
  // Issue some states to detect a password action and a login failure
  const [ loginFailed, setLoginFailed ] = useState( false );
  const [ wasReset, setWasReset ] = useState( false );

  /**
    * Function to execute if the user enters their mail
    * @param values input values
    */
  const onFinish = async ( values ) => {
    // Call the forgot password function and execute the action process at firebase
    const { error } = await forgotpassword( values.email );

    // Check if we encountered an error
    if ( error ) {
      //console.log(error);
      setLoginFailed( true );
    }else{
      setLoginFailed( false );
      //console.log(result)
      setWasReset( true );
    }
  };

  /**
     * Function to execute if the form input failed
     * DO WE NEED THIS???
     */
  const onFinishFailed = () => {
    //console.log('Failed:', errorInfo);
    setLoginFailed( true );
  };


  /**
     * Subcomponent to create the password action form
     * @constructor
     */
  const ResetForm = () => {
    // Switch the component content if the action process succeeds
    if( wasReset ){
      return(
        <>
          <Result
            status="success"
            title={<div className={styles.passwordresetnotice}>Neues Passwort, Neues Glück – Dein Reset-Link ist Unterwegs!</div>}
            subTitle={<div className={styles.passwordresetsubtitle}>Checke deine E-Mails – wir haben dir einen Link zum Zurücksetzen deines Passworts geschickt! 🚀</div>}
            extra={[
              <div key={0} className={styles.backlink}>
                <Button type="primary" key="console" href={"/login"}>
                    Zurück zum Login
                </Button>
              </div>
            ]}
          />
        </>
      );
    }else{
      return(
        <>
          <div className={styles.formtitle}>Passwort vergessen</div>
          <div className={styles.formexplanation}>
            Trage einfach deine E-Mail unten ein und wir zaubern dir einen Link ins Postfach, der dein Passwort-Problem im Nu verschwinden lässt!
          </div>
          <Form
            name="basic"
            className={styles.loginform}
            initialValues={{
              remember: true
            }}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
            layout="vertical"
            onChange={() => {
              setLoginFailed( false ) 
            }}
          >
            <Form.Item
              label="E-Mail"
              name="email"
              className={styles.loginpart}
            >
              <Input className={styles.logininput} />
            </Form.Item>

            <Alert
              style={{ marginBottom: 20, display: ( loginFailed )? "block": "none" }}
              message="Beim Anmelden ist etwas schief gelaufen bitte versuche es noch einmal!" type="error" />

            <Form.Item className={styles.loginbutton}>
              <Button type="primary" htmlType="submit">
                Passwort zurücksetzen
              </Button>
            </Form.Item>
          </Form>
        </>
      );
    }
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
          <ResetForm />
        </div>
      </div>
      <div className={styles.copyrightfooter}>© Siteware 2024</div>
    </div>
  );
}

/**
 * We use a special layout here as we are not in the default layout with context
 * @param page
 */
Forgot_Password.getLayout = ( page ) => {
  return(
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/x-icon" href="small_logo.ico" />
        <title>Siteware | ai assistant</title>
      </Head>
      <main>
        {page}
      </main>
    </>
  );
}