import router from "next/router";
import { GetServerSideProps } from "next";
import { Component, useState } from "react";
import { Alert, Button, Checkbox, Form, Input, Result } from 'antd';
import styles from './password.forgot.module.scss'
import signIn from "../../../firebase/auth/signin";
import Head from "next/head";
import Link from "next/link";
import forgotpassword from "../../../firebase/auth/forgot";


export const getServerSideProps: GetServerSideProps = async (ctx) => {
    //Get the context of the request
    const { req, res } = ctx
    //Get the cookies from the current request
    const {cookies} = req
    
    //Check if the login cookie is set
    if( cookies.login ){
        //Redirect if the cookie is not set
        res.writeHead(302, { Location: "/" });
        res.end();
    }

    return { props: { InitialState: {} } }
}

export default function Forgot_Password(){
    const [ loginFailed, setLoginFailed ] = useState(false);
    const [ wasReset, setWasReset ] = useState(false);

    const onFinish = async (values: any) => {
        const { result, error } = await forgotpassword(values.email);

        if (error) {
            console.log(error);
            setLoginFailed(true);
        }else{
            setLoginFailed(false);
            console.log(result)
            setWasReset(true);
        }

        
    };

    const onFinishFailed = (errorInfo: any) => {
        console.log('Failed:', errorInfo);
        setLoginFailed(true);
    };



    const getResetForm = () => {
        if(wasReset){
            return(
                <>
                    <Result
                        status="success"
                        title={<div className={styles.passwordresetnotice}>Neues Passwort, Neues Glück – Dein Reset-Link ist Unterwegs!</div>}
                        subTitle={<div className={styles.passwordresetsubtitle}>Checke deine E-Mails – wir haben dir den Link zum Zurücksetzen deines Passworts geschickt! 🚀</div>}
                        extra={[
                            <div className={styles.backlink}>
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
                    <div className={styles.formexplanation}>Trage einfach deine E-Mail unten ein und wir zaubern dir einen Link ins Postfach, der dein Passwort-Problem im Nu verschwinden lässt!</div>
                    <Form
                        name="basic"
                        className={styles.loginform}
                        initialValues={{
                            remember: true,
                        }}
                        onFinish={onFinish}
                        onFinishFailed={onFinishFailed}
                        autoComplete="off"
                        layout="vertical"
                        onChange={() => { setLoginFailed(false) }}
                    >
                        <Form.Item
                            label="E-Mail"
                            name="email"
                            className={styles.loginpart}
                        >
                            <Input className={styles.logininput} />
                        </Form.Item>

                        <Alert style={{marginBottom: 20, display: (loginFailed)? "block": "none"}} message="Beim Anmelden ist etwas schief gelaufen bitte versuche es noch einmal!" type="error" />

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
                        <img src={"/full_logo.png"} alt="Logo" width={100}/>
                    </div>
                </div>

                <div className={styles.formContainer}>
                    {getResetForm()}
                </div>
            </div>
        </div>
    );
}

Forgot_Password.getLayout = (page) => {
    return(
        <>
        <Head>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="icon" type="image/x-icon" href="small_logo.ico" />
            <title>Siteware-Mailbuddy | mail assistant</title>
        </Head>
        <main>
            {page}
        </main>
        </>
    );
}