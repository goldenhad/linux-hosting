import Image from "next/image";
import axios from "axios";
import router from "next/router";
import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import { Alert, Button, Checkbox, Form, Input, Select, Space } from 'antd';
import logo from '../../public/mailbuddy.png'
import styles from './register.module.scss'
import signUp, { signUpUser } from "../../firebase/auth/signup";
import Head from "next/head";
import userExists, { usernameExists } from "../../firebase/auth/userExists";
import CookieBanner from "../../components/CookieBanner";


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
    const [ registerForm ] = Form.useForm();
    const [ registeringCompany, setRegisteringCompany ] = useState(false);

    const onFinishRegisterCompany = async (values: any) => {
        let isPersonal = values.usecase != "Für mein Unternehmen";

        if(isPersonal){
            const { result, error } = await signUp(values.firstname, values.lastname, values.email, values.username, values.password, "", "", "", "", "DE", isPersonal);
            
            if (error) {
                console.log(error);
                setLoginFailed(true);
            }else{
                setLoginFailed(false);
                // else successful
                console.log(result)
                return router.push("/setup")
            }
        }else{
            const { result, error } = await signUp(values.firstname, values.lastname, values.email, values.username, values.password, values.company, values.street, values.city, values.postalcode, "DE", isPersonal);
            
            if (error) {
                console.log(error);
                setLoginFailed(true);
            }else{
                setLoginFailed(false);
                // else successful
                console.log(result)
                return router.push("/setup")
            }
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
            return router.push("/setup")
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

    const evalUseCase = () => {
        if(registeringCompany){
            return <>
                <Form.Item
                        label="Name des Unternehmens"
                        name="company"
                        rules={[
                            {
                            required: true,
                            message: 'Bitte geben Sie einen Namen für Ihr Unternehmen ein!',
                            },
                        ]}
                        className={styles.loginpart}
                    >
                        <Input className={styles.logininput} />
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
                            className={styles.loginpart}
                            >
                            <Input className={styles.logininput_left} />
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
                            className={styles.loginpart}
                            >
                            <Input className={styles.logininput_middle} />
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
                            className={styles.loginpart}
                            >
                            <Input className={styles.logininput_right} />
                        </Form.Item>
                    </Space.Compact>
            </>
        }
    }


    const getForm = () => {
        if(usedInvite){
            // Hier muss Formular rein für den User...
            return (<Form
                    name="basic"
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
                    <Space.Compact block>
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
                            className={styles.loginpart}
                            >
                            <Input className={styles.logininput} disabled={true} />
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
                            className={styles.loginpart}
                            >
                            <Input className={styles.logininput} disabled={true} />
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
                            () => ({
                                async validator(_, value) {
                                if(value != ""){
                                    if (await userExists(value)) {
                                        return Promise.reject(new Error('Die E-Mail wird bereits verwendet!'));
                                        
                                    }
                                }
                                return Promise.resolve();
                                },
                            }),
                        ]}
                        className={styles.loginpart}
                        >
                        <Input className={styles.logininput} disabled={true} />
                    </Form.Item>

                    <Form.Item
                        label="Username"
                        name="username"
                        rules={[
                            {
                            required: true,
                            message: 'Bitte geben Sie einen Usernamen ein!',
                            },
                            () => ({
                                async validator(_, value) {
                                if(value != ""){
                                    if (await usernameExists(value)) {
                                        return Promise.reject(new Error('Dieser Benutzername wird bereits verwendet!'));
                                        
                                    }
                                }
                                return Promise.resolve();
                                },
                            }),
                        ]}
                        className={styles.loginpart}
                        >
                        <Input className={styles.logininput} />
                    </Form.Item>

                    <Form.Item
                        label="Password"
                        name="password"
                        rules={[
                            {
                            required: true,
                            message: 'Bitte geben Sie ein Password ein!',
                            },
                            () => ({
                                validator(_, value: string) {
                                if (value.length >= 6) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error('Das Passwort muss länger als 6 Zeichen sein!'));
                                },
                            }),
                        ]}
                        className={styles.loginpart}
                        >
                        <Input.Password className={styles.logininput} />
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
                        className={styles.loginpart}
                        >
                        <Input.Password className={styles.logininput} />
                    </Form.Item>

                    <Alert style={{marginBottom: 20, display: (loginFailed)? "block": "none"}} message="Beim Registrieren ist etwas schief gelaufen bitte versuche es noch einmal!" type="error" />

                    <Form.Item className={styles.loginbutton}>
                        <Button type="primary" htmlType="submit">
                            Registrieren
                        </Button>
                    </Form.Item>
                </Form>);
        }else{
            return (<Form
                    name="basic"
                    className={styles.loginform}
                    onFinish={onFinishRegisterCompany}
                    onFinishFailed={onFinishFailed}
                    autoComplete="off"
                    layout="vertical"
                    onChange={() => { setLoginFailed(false) }}
                    form={registerForm}
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
                            className={styles.loginpart}
                        >
                            <Input className={styles.logininput_left} />
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
                            className={styles.loginpart}
                        >
                            <Input className={styles.logininput_right} />
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
                            () => ({
                                async validator(_, value) {
                                if(value != ""){
                                    if (await userExists(value)) {
                                        return Promise.reject(new Error('Die E-Mail wird bereits verwendet!'));
                                        
                                    }
                                }
                                return Promise.resolve();
                                },
                            }),
                        ]}
                        className={styles.loginpart}
                    >
                        <Input className={styles.logininput} />
                    </Form.Item>

                    <Form.Item
                        label="Username"
                        name="username"
                        rules={[
                            {
                            required: true,
                            message: 'Bitte geben Sie einen Usernamen ein!',
                            },
                            () => ({
                                async validator(_, value) {
                                if(value != ""){
                                    if (await usernameExists(value)) {
                                        return Promise.reject(new Error('Dieser Benutzername wird bereits verwendet!'));
                                        
                                    }
                                }
                                return Promise.resolve();
                                },
                            }),
                        ]}
                        className={styles.loginpart}
                    >
                        <Input className={styles.logininput} />
                    </Form.Item>

                    <Space.Compact block>
                        <Form.Item
                            label="Password"
                            name="password"
                            rules={[
                                {
                                required: true,
                                message: 'Bitte geben Sie ein Password ein!',
                                },
                            ]}
                            className={styles.loginpart}
                        >
                            <Input.Password className={styles.logininput_left} />
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
                                () => ({
                                    validator(_, value: string) {
                                    if (value.length >= 6) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Das Passwort muss länger als 6 Zeichen sein!'));
                                    },
                                }),
                            ]}
                            className={styles.loginpart}
                        >
                            <Input.Password className={styles.logininput_right} />
                        </Form.Item>
                    </Space.Compact>

                    <Form.Item label="Nutzung" name={"usecase"} className={styles.loginpart}>
                        <Select onChange={(value) => { (value == "Für mein Unternehmen")? setRegisteringCompany(true): setRegisteringCompany(false) }} placeholder={"Wie planst du Mailbuddy zu nutzen?"} options={[{key: 0, value: "Nur für mich persönlich"}, {key: 1, value: "Für mein Unternehmen"}]}/>
                    </Form.Item>

                    {
                        evalUseCase() 
                    }

                    <Alert style={{marginBottom: 20, display: (loginFailed)? "block": "none"}} message="Beim Registrieren ist etwas schief gelaufen bitte versuche es noch einmal!" type="error" />

                    <Form.Item className={styles.loginbutton}>
                        <Button type="primary" htmlType="submit">
                            Registrieren
                        </Button>
                    </Form.Item>
                </Form>);
        }
    }

    return(
        <div>
            <div className={styles.logincontainer}>
                <div className={styles.logorow}>
                    <div className={styles.logobox}>
                        <img src={"/logo.svg"} alt="Logo" width={100}/>
                    </div>
                </div>

                <div className={styles.formContainer}>
                    <div className={styles.formtitle}>Registrieren</div>
                    <div className={styles.formexplanation}>"Willkommen an Bord! Perfektioniere deine E-Mail-Kunst – starte mit dem Registrierungsformular direkt unter diesem Text."</div>
                    {getForm()}
                </div>
            </div>
            <div className={styles.copyrightfooter}>© Mailbuddy 2023</div>
        </div>
    );
}

Register.getLayout = (page) => {
    return(
        <>
        <Head>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="icon" type="image/x-icon" href="small_logo.ico" />
            <title>Siteware-Mailbuddy | mail assistant</title>
        </Head>
        <main>
            {page}
            <CookieBanner />
        </main>
        </>
    );
}