import Image from "next/image";
import axios from "axios";
import router from "next/router";
import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import { Alert, Button, Checkbox, Form, Input, Space } from 'antd';
import logo from '../../public/mailbuddy.png'
import styles from './login.module.scss'
import signIn from "../../firebase/auth/signin";
import signUp, { signUpUser } from "../../firebase/auth/signup";
import Head from "next/head";


export const getServerSideProps: GetServerSideProps = async (ctx) => {
    //Get the context of the request
    const { req, res, query } = ctx
    //Get the cookies from the current request
    const {cookies} = req
    
    //Check if the login cookie is set
    if( cookies.login ){
        //Redirect if the cookie is not set
        res.writeHead(302, { Location: "/" });
        res.end();
    }

    let invite = query.invite;
    if(invite){
        try{
            const json = Buffer.from(invite as string, "base64").toString();
            let invitiparams = JSON.parse(json);

            console.log(invitiparams);

            return { props: {invite: { company: invitiparams.company, firstname: invitiparams.firstname, lastname: invitiparams.lastname, email: invitiparams.email }} }
        } catch(e) {
            return { props: {  } };
        }
    }else{
        return { props: {  } };
    }
    
}

export default function Register(props){
    const [ loginFailed, setLoginFailed ] = useState(false);
    const [ usedInvite, setUsedInvite ] = useState(props.invite != undefined);
    const [ registerUserForm ] = Form.useForm();

    const onFinishRegisterCompany = async (values: any) => {
        const { result, error } = await signUp(values.firstname, values.lastname, values.email, values.username, values.password, values.company, values.street, values.city, values.postalcode, "DE");

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


    const onFinishRegisterUser = async (values: any) => {
        const { result, error } = await signUpUser(values.firstname, values.lastname, values.email, values.username, values.password, props.invite.company);

        if (error) {
            console.log(error);
            setLoginFailed(true);
        }else{
            setLoginFailed(false);
            // else successful
            console.log(result)
            return router.push("/")
        }
    }

    useEffect(() => {
        if(props.invite){
            registerUserForm.setFieldValue("firstname", props.invite.firstname);
            registerUserForm.setFieldValue("lastname", props.invite.lastname);
            registerUserForm.setFieldValue("email", props.invite.email);
        }
    }, []);

    const onFinishFailed = (errorInfo: any) => {
        console.log('Failed:', errorInfo);
        setLoginFailed(true);
    };



    const getForm = () => {
        if(usedInvite){
            // Hier muss Formular rein für den User...
            return (<Form
                    name="basic"
                    labelCol={{
                        span: 24,
                    }}
                    wrapperCol={{
                        span: 24,
                    }}
                    className={styles.loginform}
                    initialValues={{
                        remember: true,
                    }}
                    onFinish={onFinishRegisterUser}
                    onFinishFailed={onFinishFailed}
                    autoComplete="off"
                    layout="vertical"
                    onChange={() => { setLoginFailed(false) }}
                    form={registerUserForm}
                >
                    <Space.Compact style={{width: "100%"}} block>
                        <Form.Item
                            label="Vorname"
                            name="firstname"
                            style={{width: "50%"}}
                            rules={[
                                {
                                required: true,
                                message: 'Bitte geben Sie einen Vornamen ein!',
                                },
                            ]}
                            >
                            <Input disabled={true} />
                        </Form.Item>

                        <Form.Item
                            label="Nachname"
                            name="lastname"
                            style={{width: "50%"}}
                            rules={[
                                {
                                required: true,
                                message: 'Bitte geben Sie einen Nachnamen ein!',
                                },
                            ]}
                            >
                            <Input disabled={true} />
                        </Form.Item>
                    </Space.Compact>

                    <Form.Item
                        label="E-Mail"
                        name="email"
                        rules={[
                            {
                            required: true,
                            message: 'Bitte geben Sie ein E-Mail ein!',
                            },
                        ]}
                        >
                        <Input disabled={true} />
                    </Form.Item>

                    <Form.Item
                        label="Username"
                        name="username"
                        rules={[
                            {
                            required: true,
                            message: 'Bitte geben Sie einen Usernamen ein!',
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
                            message: 'Bitte geben Sie ein Password ein!',
                            },
                        ]}
                        >
                        <Input.Password />
                        </Form.Item>

                    <Form.Item
                        label="Password wiederholen"
                        name="passwordwdhl"
                        rules={[
                            {
                            required: true,
                            message: 'Bitte wiederholen Sie das Passwort!',
                            },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                if (!value || getFieldValue('password') === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error('Die Passwörter stimmen nicht überein!'));
                                },
                            }),
                        ]}
                        >
                        <Input.Password />
                    </Form.Item>

                    <Alert style={{marginBottom: 20, display: (loginFailed)? "block": "none"}} message="Beim Registrieren ist etwas schief gelaufen bitte versuche es noch einmal!" type="error" />

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
                            Registrieren
                        </Button>
                    </Form.Item>
                </Form>);
        }else{
            return (<Form
                    name="basic"
                    labelCol={{
                        span: 24,
                    }}
                    wrapperCol={{
                        span: 24,
                    }}
                    className={styles.loginform}
                    initialValues={{
                        remember: true,
                    }}
                    onFinish={onFinishRegisterCompany}
                    onFinishFailed={onFinishFailed}
                    autoComplete="off"
                    layout="vertical"
                    onChange={() => { setLoginFailed(false) }}
                >
                    <Space.Compact style={{width: "100%"}} block>
                        <Form.Item
                            label="Vorname"
                            name="firstname"
                            style={{width: "50%"}}
                            rules={[
                                {
                                required: true,
                                message: 'Bitte geben Sie einen Vornamen ein!',
                                },
                            ]}
                            >
                            <Input  />
                        </Form.Item>

                        <Form.Item
                            label="Nachname"
                            name="lastname"
                            style={{width: "50%"}}
                            rules={[
                                {
                                required: true,
                                message: 'Bitte geben Sie einen Nachnamen ein!',
                                },
                            ]}
                            >
                            <Input />
                        </Form.Item>
                    </Space.Compact>

                    <Form.Item
                        label="E-Mail"
                        name="email"
                        rules={[
                            {
                            required: true,
                            message: 'Bitte geben Sie ein E-Mail ein!',
                            },
                        ]}
                        >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        label="Username"
                        name="username"
                        rules={[
                            {
                            required: true,
                            message: 'Bitte geben Sie einen Usernamen ein!',
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
                            message: 'Bitte geben Sie ein Password ein!',
                            },
                        ]}
                        >
                        <Input.Password />
                        </Form.Item>

                    <Form.Item
                        label="Password wiederholen"
                        name="passwordwdhl"
                        rules={[
                            {
                            required: true,
                            message: 'Bitte wiederholen Sie das Passwort!',
                            },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                if (!value || getFieldValue('password') === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error('Die Passwörter stimmen nicht überein!'));
                                },
                            }),
                        ]}
                        >
                        <Input.Password />
                    </Form.Item>

                    <Form.Item
                        label="Name des Unternehmens"
                        name="company"
                        rules={[
                            {
                            required: true,
                            message: 'Bitte geben Sie einen Namen für Ihr Unternehmen ein!',
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>

                    <Space.Compact style={{width: "100%"}} block>
                        <Form.Item
                            label="Straße"
                            name="street"
                            style={{width: "50%"}}
                            rules={[
                                {
                                required: true,
                                message: 'Bitte geben Sie einen Namen für Ihr Unternehmen ein!',
                                },
                            ]}
                            >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            label="Ort"
                            name="city"
                            style={{width: "30%"}}
                            rules={[
                                {
                                required: true,
                                message: 'Bitte geben Sie einen Namen für Ihr Unternehmen ein!',
                                },
                            ]}
                            >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            label="PLZ"
                            name="postalcode"
                            style={{width: "20%"}}
                            rules={[
                                {
                                required: true,
                                message: 'Bitte geben Sie einen Namen für Ihr Unternehmen ein!',
                                },
                            ]}
                            >
                            <Input />
                        </Form.Item>
                    </Space.Compact>

                    <Alert style={{marginBottom: 20, display: (loginFailed)? "block": "none"}} message="Beim Registrieren ist etwas schief gelaufen bitte versuche es noch einmal!" type="error" />

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
                            Registrieren
                        </Button>
                    </Form.Item>
                </Form>);
        }
    }

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
                {getForm()}
            </div>
        </main>
    );
}

Register.getLayout = (page) => {
    return(
        <>
        <Head>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="icon" type="image/x-icon" href="mailbuddy.ico" />
            <title>Siteware-Mailbuddy | mail assistant</title>
        </Head>
        <main>
            {page}
        </main>
        </>
    );
}