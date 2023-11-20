import { Card, Button, Form, Input, Select, Result, Skeleton, Space, Typography, Alert, Divider, List, Slider, Table, Avatar } from 'antd';
import Icon from '@ant-design/icons';
import styles from './account.module.scss'
import { db } from '../../db';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import SidebarLayout from '../../components/Sidebar/SidebarLayout';
import { useAuthContext } from '../../components/context/AuthContext';
import { useRouter } from 'next/navigation';
import { handleEmptyString } from '../../helper/architecture';
import { usernameExists, usernameExistsAtDifferentUser } from '../../firebase/auth/userExists';
import forgotpassword from '../../firebase/auth/forgot';
var paypal = require('paypal-rest-sdk');
const { Paragraph } = Typography;
const { TextArea } = Input;



export interface InitialProps {
  Data: {};
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  //Get the context of the request
  const { req, res } = ctx;
  //Get the cookies from the current request
  const { cookies } = req;


  return {
    props: {
        Data: {}
    },
  };
};


export default function Account(props: InitialProps) {
  const { login, user, company, role, quota } = useAuthContext();
  const router = useRouter();
  const [ personalForm ] = Form.useForm();
  const [ passwordForm ] = Form.useForm();
  const [ wasReset, setWasReset ] = useState(false);

  useEffect(() => {
    personalForm.setFieldValue("username", user.username);
    personalForm.setFieldValue("email", login.email);
    personalForm.setFieldValue("firstname", user.firstname);
    personalForm.setFieldValue("lastname", user.lastname);
    personalForm.setFieldValue("street", company.street);
    personalForm.setFieldValue("postalcode", company.postalcode);
    personalForm.setFieldValue("city", company.city);
  }, [])

  const getPersonalForm = () => {
    if(user.Role != "Company"){
        return(
            <Form layout='vertical' form={personalForm}>
                <div className={styles.formrow}>
                    <Form.Item
                        className={styles.formpart}
                        name={"username"}
                        label="Benutzername"
                        rules={[
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
                    >
                        <Input className={styles.forminput} />
                    </Form.Item>
                </div>

                <div className={styles.formrow}>
                    <Form.Item className={styles.formpart} name={"email"} label="E-Mail">
                        <Input className={styles.forminput} disabled/>
                    </Form.Item>
                </div>

                <div className={`${styles.formrow} ${styles.multiformrow}`}>
                    <Form.Item className={styles.formpart} name={"firstname"} label="Vorname">
                        <Input className={styles.forminput} />
                    </Form.Item>

                    <Form.Item className={styles.formpart} name={"lastname"} label="Nachname">
                        <Input className={styles.forminput} />
                    </Form.Item>
                </div>
            </Form>
        );
    }else{
        return(
            <Form layout='vertical' form={personalForm}>
                <Form.Item
                        className={styles.formpart}
                        name={"username"}
                        label="Benutzername"
                        rules={[
                            () => ({
                                async validator(_, value) {
                                if(value != ""){
                                    if (await usernameExistsAtDifferentUser(value, login.uid)) {
                                        return Promise.reject(new Error('Dieser Benutzername wird bereits verwendet!'));
                                        
                                    }
                                }
                                return Promise.resolve();
                                },
                            }),
                        ]}
                    >
                        <Input className={styles.forminput} />
                </Form.Item>

                <div className={styles.formrow}>
                    <Form.Item className={styles.formpart} name={"email"} label="E-Mail">
                        <Input className={styles.forminput} disabled/>
                    </Form.Item>
                </div>

                <div className={`${styles.formrow} ${styles.multiformrow}`}>
                    <Form.Item className={styles.formpart} name={"firstname"} label="Vorname">
                        <Input className={styles.forminput} />
                    </Form.Item>

                    <Form.Item className={styles.formpart} name={"lastname"} label="Nachname">
                        <Input className={styles.forminput} />
                    </Form.Item>
                </div>

                <div className={`${styles.formrow} ${styles.multiformrow}`}>
                    <Form.Item className={styles.formpart} name={"street"} label="Straße">
                        <Input className={styles.forminput} />
                    </Form.Item>

                    <Form.Item className={styles.formpart} name={"postalcode"} label="PLZ">
                        <Input className={styles.forminput} />
                    </Form.Item>

                    <Form.Item className={styles.formpart} name={"city"} label="Ort">
                        <Input className={styles.forminput} />
                    </Form.Item>
                </div>
            </Form>
        );
    }
  }


  const sendResetMail = async () => {
    const { result, error } = await forgotpassword(login.email);

    if (error) {
        console.log(error);
    }else{
        setWasReset(true);
    }
};

const getResetButton = () => {
    if(wasReset){
        return(
            <Result
                status="success"
                title={<div className={styles.passwordresetnotice}>Neues Passwort, Neues Glück – Dein Reset-Link ist Unterwegs!</div>}
                subTitle={<div className={styles.passwordresetsubtitle}>Checke deine E-Mails – wir haben dir den Link zum Zurücksetzen deines Passworts geschickt! 🚀</div>}
            />
        );
    }else{
        return(
            <div className={styles.savebuttonrow}>
                <Button type='primary' onClick={() => {sendResetMail()}} className={styles.save}>Passwort zurücksetzen</Button>
            </div>
        );
    }
}


  return (
    <SidebarLayout capabilities={(role)? role.capabilities: {}} user={user} login={login}>
      <div className={styles.main}>
        <Avatar size={250} style={{ backgroundColor: '#f0f0f2', color: '#474747', fontSize: 100 }}>{handleEmptyString(user.firstname).toUpperCase().charAt(0)}{handleEmptyString(user.lastname).toUpperCase().charAt(0)}</Avatar>
        <div className={styles.personal}>
            <Card className={styles.personalcard} title="Persönliche Informationen" headStyle={{backgroundColor: "#F9FAFB"}} bordered={true}>
                {getPersonalForm()}
                <div className={styles.savebuttonrow}>
                    <Button type='primary' onClick={() => {router.back()}} className={styles.save}>Speichern</Button>
                </div>
            </Card>
        </div>
        <div className={styles.password}>
            <Card className={styles.passwordcard} title="Passwort" headStyle={{backgroundColor: "#F9FAFB"}} bordered={true}>
                {/* <Form layout='vertical' form={passwordForm}>
                    <div className={styles.formrow}>
                        <Form.Item
                            className={styles.formpart}
                            name={"password"}
                            label="Passwort"
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
                        >
                            <Input type='password' className={styles.forminput} />
                        </Form.Item>
                    </div>

                    <div className={styles.formrow}>
                        <Form.Item
                            className={styles.formpart}
                            name={"passwordreapeted"}
                            label="Passwort wiederholen"
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
                            <Input type='password' className={styles.forminput}/>
                        </Form.Item>
                    </div>
                </Form> */}
                {getResetButton()}
            </Card>
        </div>
      </div>
    </SidebarLayout>
  )
}
