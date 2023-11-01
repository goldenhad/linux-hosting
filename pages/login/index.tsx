import Image from "next/image";
import axios from "axios";
import router from "next/router";
import { GetServerSideProps } from "next";
import { Component, useState } from "react";
import { Alert, Button, Checkbox, Form, Input } from 'antd';
import logo from '../../public/mailbuddy.png'
import styles from './login.module.scss'
import signIn from "../../firebase/auth/signin";
import Head from "next/head";


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

export default function Login(){
    const [ loginFailed, setLoginFailed ] = useState(false);

    const onFinish = async (values: any) => {
        const { result, error } = await signIn(values.email, values.password);

        if (error) {
            console.log(error);
            setLoginFailed(true);
        }else{
            setLoginFailed(false);
            // else successful
            console.log(result)
            return router.push("/")
        }

        
    };

    const onFinishFailed = (errorInfo: any) => {
        console.log('Failed:', errorInfo);
        setLoginFailed(true);
    };

    return(
        <main>
            <div style={{
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center"
            }}>
                <div style={{borderRadius: "10%", overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 25}}>
                    <img src={"/full_logo.png"} alt="Logo" width={"50%"}/>
                </div>
                <Form
                    name="basic"
                    labelCol={{
                        span: 8,
                    }}
                    wrapperCol={{
                        span: 24,
                    }}
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
                    rules={[
                        {
                        required: true,
                        message: 'Bitte geben Sie ihre E-Mail ein!',
                        },
                    ]}
                    >
                    <Input />
                    </Form.Item>

                    <Form.Item
                    label="Password"
                    name="password"
                    rules={[
                        {
                        required: true,
                        message: 'Bitte geben Sie ihr Password ein!',
                        },
                    ]}
                    >
                    <Input.Password />
                    </Form.Item>

                    <Alert style={{marginBottom: 20, display: (loginFailed)? "block": "none"}} message="Beim Anmelden ist etwas schief gelaufen bitte versuche es noch einmal!" type="error" />

                    <Form.Item
                        wrapperCol={{
                            offset: 0,
                            span: 24,
                        }}
                        style={{
                            textAlign: "center"
                        }}
                    >
                        <Button type="primary" htmlType="submit">
                            Anmelden
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </main>
    );
}

Login.getLayout = (page) => {
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