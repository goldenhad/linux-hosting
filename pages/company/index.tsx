import { Alert, Button, Card, Form, Input, Modal, Progress, Select, Space, Statistic, Table, Tooltip, Typography } from 'antd';
import styles from './edit.company.module.scss'
import axios from 'axios';
import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { prisma } from '../../db'
import { CombinedUser } from '../../helper/LoginTypes';
import SidebarLayout from '../../components/SidebarLayout';
import { JsonObject } from '@prisma/client/runtime/library';
import { useRouter } from 'next/router';
import { Company, Role, TokenUsage, User } from '@prisma/client';
import { handleEmptyString } from '../../helper/architecture';
import { useAuthContext } from '../../components/context/AuthContext';
const { Paragraph } = Typography;
const { TextArea } = Input;


export interface InitialProps {
  Data: { currentMonth: number, currentYear: number; };
  quota: TokenUsage;
  InitialState: CombinedUser;
}

function pad(number: number, size: number){
    let nstring = number.toString();
    let leadings = "";

    if(nstring.length < size){
        for(let i=0; i < size-nstring.length; i++){
            leadings += "0";
        }
    }

    return leadings + nstring;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    //Get the context of the request
    const { req, res } = ctx;
    //Get the cookies from the current request
    const { cookies } = req;
  
    let datum = new Date();
  
    return {
      props: {
          Data: {
            currentMonth: datum.getMonth() + 1,
            currentYear: datum.getFullYear(),
          }
      },
    };
  
    
};



export default function Company(props: InitialProps) {
    const { login, user, company, role, quota } = useAuthContext();
    const [ errMsg, setErrMsg ] = useState([]);
    const [ isErrVisible, setIsErrVisible ] = useState(false);
    const [ editSuccessfull, setEditSuccessfull ] = useState(false);
    const [ overused, setOverused ] = useState(false);
    const [ form ] = Form.useForm();
    const router = useRouter();


    const refreshData = () => {
        router.replace(router.asPath);
    }

    useEffect(() => {
        if (login == null) router.push("/login");

        if(getCurrentUsage().amount > quota.tokens){
            setOverused(true);
        }

        form.setFieldValue("companyname", company.name);
        form.setFieldValue("companystreet", company.street);
        form.setFieldValue("companycity", company.city);
        form.setFieldValue("companypostalcode", company.postalcode);
        form.setFieldValue("companycountry", company.country);
        form.setFieldValue("companybackground", company.settings.background);
    }, [login]);

    
    const getCurrentUsage = () => {
        return company.Usage.find((elm, idx) => { return elm.month == props.Data.currentMonth && elm.year == props.Data.currentYear });
    }

    const editCompany = async (values: any) => {
        //Define a default case for the error
        let error = false;
        //Define a array so save error-messages
        let msg: any = [];

        axios.put(`/api/company/${user.Company}`, {
            companyname: handleEmptyString(values.companyname),
            companystreet: handleEmptyString(values.companystreet),
            companycity: handleEmptyString(values.companycity),
            companypostalcode: handleEmptyString(values.companypostalcode),
            companycountry: handleEmptyString(values.companycountry),
            companybackground: handleEmptyString(values.companybackground)
        })
        .then(function (response) {
            //reload data
            refreshData();
        })
        .catch(function (error) {

            setErrMsg(["Speichern fehlgeschlagen!"]);
            setIsErrVisible(true);
        });

        setErrMsg([]);
        setIsErrVisible(false);
        setEditSuccessfull(true);
    }

    const getCompanyInput = () => {
        let caps = role.capabilities;

        if(role.capabilities.projects.edit){
            return (<Form 
                layout='vertical'
                onFinish={editCompany}
                form={form}
            >

                <Form.Item
                    label="Firmenname"
                    name="companyname"
                >
                    <Input placeholder="Name der Firma..." />
                </Form.Item>

                <Space direction='horizontal' wrap>
                <Form.Item
                    label="Straße"
                    name="companystreet"
                >
                    <Input placeholder="Musterstraße 1..." />
                </Form.Item>

                <Form.Item
                    label="Ort"
                    name="companycity"
                >
                    <Input placeholder="Musterstadt..." />
                </Form.Item>

                <Form.Item
                    label="Plz"
                    name="companypostalcode"
                >
                    <Input placeholder="123456"/>
                </Form.Item>

                <Form.Item
                    label="Land"
                    name="companycountry"
                >
                    <Select
                        options={[
                        {
                            value: 'de',
                            label: 'Deutschland',
                        },
                        ]}
                    />
                </Form.Item>
                </Space>

                <Form.Item
                    label="Background der Firma"
                    name="companybackground"
                >
                    <TextArea placeholder="Was ist das Kerngeschäft der Firma?"/>
                </Form.Item>

                <div className={styles.errorrow} style={{display: (isErrVisible)? "block": "none"}}>
                    <Alert type='error' message={errMsg} />
                </div>

                <div className={styles.successrow} style={{display: (editSuccessfull)? "block": "none"}}>
                    <Alert type='success' message="Speichern erfolgreich!" />
                </div>

                <div className={styles.finishformrow}>
                    <Button type='primary' htmlType='submit'>Speichern</Button>
                </div>

            </Form>);
        }else{
            return (<Form 
                layout='vertical'
                onFinish={() => {}}
                form={form}
            >

                <Form.Item
                    label="Firmenname"
                    name="companyname"
                >
                    <Input disabled/>
                </Form.Item>

                <Space direction='horizontal' wrap>
                <Form.Item
                    label="Straße"
                    name="companystreet"
                >
                    <Input disabled/>
                </Form.Item>

                <Form.Item
                    label="Ort"
                    name="companycity"
                >
                    <Input disabled/>
                </Form.Item>

                <Form.Item
                    label="Plz"
                    name="companypostalcode"
                >
                    <Input disabled/>
                </Form.Item>

                <Form.Item
                    label="Land"
                    name="companycountry"
                >
                    <Select
                        options={[
                        {
                            value: 'de',
                            label: 'Deutschland',
                        },
                        ]}
                        disabled
                    />
                </Form.Item>
                </Space>

                <Form.Item
                    label="Background der Firma"
                    name="companybackground"
                >
                    <TextArea disabled/>
                </Form.Item>

            </Form>);
        }
    }

  
    return (
        <SidebarLayout capabilities={role.capabilities} user={user} login={login}>
            <div className={styles.main}>
                <Space direction='vertical' className={styles.spacelayout} size="large">
                    <Card title={`Ihre Firma`} bordered={true}>
                        {getCompanyInput()}
                    </Card>
                    <Card title={"Credits"} bordered={true}>
                        <h2>Verbrauchte Credits (seit 01.{pad(props.Data.currentMonth, 2)}.{props.Data.currentYear})</h2>
                        <div className={styles.quotarow}>
                            {/* <div className={styles.quota}>{}</div> */}
                            
                            <Tooltip title={`${getCurrentUsage().amount} Credits von ${quota.tokens} verbraucht.`}>
                                <Progress className={styles.quotaprogress} status={(overused)? "exception": undefined} percent={Math.round((getCurrentUsage().amount / quota.tokens) * 10000000)  } />
                            </Tooltip>
                        </div>
                    </Card>
                </Space>
            </div>
        </SidebarLayout>
    );
}
