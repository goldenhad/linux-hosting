import Image from "next/image";
import axios from "axios";
import router from "next/router";
import { GetServerSideProps } from "next";
import { useState } from "react";
import { Alert, Button, Checkbox, Form, Input } from 'antd';
import logo from '../../public/mailbuddy.png'


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

    const onFinish = (values: any) => {
        axios.post('/api/login', {
            username: values.username,
            password: values.password
        })
          .then(function (response) {
            setLoginFailed(false);
    
            // Make sure we're in the browser
            if (typeof window !== 'undefined') {
                router.push('/');
                return; 
            }
    
        })
          .catch(function (error) {
            console.log(error);
            setLoginFailed(true);
        });
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
                <div style={{borderRadius: "10%", overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center"}}>
                    <img src={"/mailbuddy.png"} alt="Logo" width={744/10} height={744/10}/>
                </div>
                <h2 style={{marginTop: 25, marginBottom: 50}} >Mailbuddy</h2>
                <Form
                    name="basic"
                    labelCol={{
                        span: 8,
                    }}
                    wrapperCol={{
                        span: 24,
                    }}
                    style={{
                        width: 600,
                    }}
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
                    label="Username"
                    name="username"
                    rules={[
                        {
                        required: true,
                        message: 'Bitte geben Sie ihren Benutzernamen ein!',
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