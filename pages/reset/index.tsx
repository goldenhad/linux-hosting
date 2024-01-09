import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import { Alert, Button, Form, Input, Result } from "antd";
import styles from "./reset.module.scss"
import Head from "next/head";
import resetpassword from "../../firebase/auth/reset";

interface restprops {
    mode: string,
    oobCode: string,
    apiKey: string,
}


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

export default function Forgot_Password( props: restprops ){
  const [ resetFailed, setResetFailed ] = useState( false );
  const [ wasReset, setWasReset ] = useState( false );
  const [ resetState ] = useState( props as restprops );

  useEffect( () => {
    //console.log(resetState);
  }, [] )

  const onFinish = async ( values ) => {
    const { error } = await resetpassword( resetState.oobCode, values.password );

    if ( error ) {
      //console.log(error);
      setResetFailed( true );
    }else{
      setResetFailed( false );
      //console.log(result)
      setWasReset( true );
    }

        
  };

  const onFinishFailed = () => {
    //console.log('Failed:', errorInfo);
    setResetFailed( true );
  };



  const getResetForm = () => {
    if( wasReset ){
      return(
        <>
          <Result
            status="success"
            title={<div className={styles.passwordresetnotice}>Passwort-Update Erfolgreich - Willkommen Zurück an Bord!</div>}
            subTitle={
              <div className={styles.passwordresetsubtitle}>
                    Fantastisch! Dein Passwort wurde neu gesetzt. Du kannst dich jetzt mit deinem neuen Passwort einloggen
              </div>}
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
          <div className={styles.formtitle}>Neues Passwort vergeben</div>
          <div className={styles.formexplanation}>Bitte lege ein neues Passwort fest</div>
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
              setResetFailed( false ) 
            }}
          >
            <Form.Item
              label="Passwort"
              name="password"
              className={styles.loginpart}
              rules={[
                {
                  required: true,
                  message: "Bitte geben Sie ein Password ein!"
                }
              ]}
            >
              <Input.Password className={styles.logininput} />
            </Form.Item>

            <Form.Item
              label="Passwort wiederholen"
              name="passwordwdhl"
              className={styles.loginpart}
              rules={[
                {
                  required: true,
                  message: "Bitte wiederholen Sie das Passwort!"
                },
                ( { getFieldValue } ) => ( {
                  validator( _, value ) {
                    if ( !value || getFieldValue( "password" ) === value ) {
                      return Promise.resolve();
                    }
                    return Promise.reject( new Error( "Die Passwörter stimmen nicht überein!" ) );
                  }
                } ),
                () => ( {
                  validator( _, value: string ) {
                    if ( value.length >= 6 ) {
                      return Promise.resolve();
                    }
                    return Promise.reject( new Error( "Das Passwort muss länger als 6 Zeichen sein!" ) );
                  }
                } )
              ]}
            >
              <Input.Password className={styles.logininput} />
            </Form.Item>

            <Alert
              style={{ marginBottom: 20, display: ( resetFailed )? "block": "none" }}
              message="Beim setzen des neuen Passworts ist etwas schief gelaufen bitte versuche es noch einmal!"
              type="error"
            />

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
          {getResetForm()}
        </div>
      </div>
    </div>
  );
}

Forgot_Password.getLayout = ( page ) => {
  return(
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