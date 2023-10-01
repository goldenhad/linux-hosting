import { Alert, Button, Card, Form, Input, Modal, Select, Space, Statistic, Table, Typography } from 'antd';
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
import { Company, Project, Role, TokenUsage, User } from '@prisma/client';
import { handleEmptyString } from '../../helper/architecture';
const { Paragraph } = Typography;
const { TextArea } = Input;


export interface InitialProps {
  Data: { SingleProject: Project & { company: any }, Users: Array<User>, Roles: Array<Role> };
  currentMonth: number;
  currentYear: number;
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

  //Check if the login cookie is set
  if (!cookies.login) {
      //Redirect if the cookie is not set
      res.writeHead(302, { Location: "/login" });
      res.end();

      return { props: { InitialState: {} } };
  } else {
    let cookie = JSON.parse(Buffer.from(cookies.login, "base64").toString("ascii"));
    let rawid = cookie.project.id;
    let currentMonth = new Date().getMonth() + 1;
    let currentYear = new Date().getFullYear();

    if(!isNaN(rawid)){
        if(!cookie.role.capabilities.superadmin){
    
            let quota = await prisma.tokenUsage.findFirst({
                where: {
                    projectId: rawid,
                    month: currentMonth,
                    year: currentYear,
                }
            })
    
            if(!quota){
                quota = await prisma.tokenUsage.create({
                    data: {
                        month: currentMonth,
                        year: currentYear,
                        amount: 0,
                        project: {
                            connect: {
                                id: rawid
                            }
                        }
                    },
                    
                })
            }

        
            return {
                props: {
                    InitialState: cookie,
                    Data: {
                        SingleProject: cookie.project,
                    },
                    currentMonth: currentMonth,
                    currentYear: currentYear,
                    quota: quota,
                },
            };
        }
    }

    res.writeHead(302, { Location: "/" });
    res.end();

    return { props: { InitialState: {} } };
  }
};



export default function Company(props: InitialProps) {
    const [ errMsg, setErrMsg ] = useState([]);
    const [ isErrVisible, setIsErrVisible ] = useState(false);
    const [ editSuccessfull, setEditSuccessfull ] = useState(false);
    const [ form ] = Form.useForm();
    const router = useRouter();


    const refreshData = () => {
        router.replace(router.asPath);
    }

    const editCompany = async (values: any) => {
        //Define a default case for the error
        let error = false;
        //Define a array so save error-messages
        let msg: any = [];

        axios.put(`/api/project/${props.Data.SingleProject.id}`, {
            name: handleEmptyString(values.projectname),
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

    useEffect(() => {
        let setts = props.InitialState.project.company.settings as JsonObject;
        form.setFieldValue("companyname", props.InitialState.project.company.name);
        form.setFieldValue("companystreet", props.InitialState.project.company.street);
        form.setFieldValue("companycity", props.InitialState.project.company.city);
        form.setFieldValue("companypostalcode", props.InitialState.project.company.postalcode);
        form.setFieldValue("companycountry", props.InitialState.project.company.country);
        form.setFieldValue("companybackground", setts.background);

    }, [props.InitialState.project]);


    const getCompanyInput = () => {
        let caps = props.InitialState.role.capabilities as JsonObject;

        if(caps.canEditOwnProject){
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
        <SidebarLayout capabilities={props.InitialState.role.capabilities as JsonObject}>
            <div className={styles.main}>
                <Space direction='vertical' className={styles.spacelayout} size="large">
                    <Card title={`Projekt ${props.Data.SingleProject.id}`} bordered={true}>
                        {getCompanyInput()}
                    </Card>
                    <Card title={"Tokens"} bordered={true}>
                        <h2>Verbrauchte Tokens (seit 01.{pad(props.currentMonth, 2)}.{props.currentYear})</h2>
                        <div className={styles.quotarow}>
                            <div className={styles.quota}>{props.quota.amount + 20000}</div>
                        </div>
                    </Card>
                </Space>
            </div>
        </SidebarLayout>
    );
}
