import { Alert, Button, Card, Form, Input, Modal, Progress, Select, Space, Statistic, Table, Tooltip, Typography } from 'antd';
import styles from './edit.company.module.scss'
import axios from 'axios';
import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import SidebarLayout from '../../components/Sidebar/SidebarLayout';
import { useRouter } from 'next/router';
import { handleEmptyString } from '../../helper/architecture';
import { useAuthContext } from '../../components/context/AuthContext';
import { getDocWhere } from '../../firebase/data/getData';
import updateData from '../../firebase/data/updateData';
const { TextArea } = Input;


export interface InitialProps {
  Data: { currentMonth: number, currentYear: number; };
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
    const [ inviteErrMsg, setInviteErrMsg ] = useState("");
    const [ isInviteErrVisible, setIsInviteErrVisible ] = useState(false);
    const [ editSuccessfull, setEditSuccessfull ] = useState(false);
    const [ overused, setOverused ] = useState(false);
    const [ users, setUsers ] = useState([]);
    const [ inviteUserModalOpen, setInviteUserModalOpen ] = useState(false);
    const [ inviteForm ] = Form.useForm();
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

    useEffect(() => {
        const load = async () => {
            let {result, error} = await getDocWhere("User", "Company", "==", user.Company);
            if(!error){
                console.log(result);
                setUsers(result);
            }else{
                setUsers([]);
            }
        }

        load();
    }, [company])

    
    const getCurrentUsage = () => {
        return company.Usage.find((elm, idx) => { return elm.month == props.Data.currentMonth && elm.year == props.Data.currentYear });
    }

    const editCompany = async (values: any) => {
        let comp = company;
        comp.name = handleEmptyString(values.companyname);
        comp.street = handleEmptyString(values.companystreet);
        comp.city = handleEmptyString(values.companycity);
        comp.postalcode = handleEmptyString(values.companypostalcode);
        comp.country = handleEmptyString(values.companycountry);
        comp.settings.background = handleEmptyString(values.companybackground);

        try{
            await updateData("Company", user.Company, comp);

            setErrMsg([]);
            setIsErrVisible(false);
            setEditSuccessfull(true);
        } catch(e) {
            setErrMsg(["Speichern fehlgeschlagen!"]);
            setIsErrVisible(true);
        }
    }

    const getCompanyInput = () => {
        if(role.capabilities.projects.edit){
            return (<Form 
                layout='vertical'
                onFinish={editCompany}
                onChange={() => {setIsErrVisible(false), setEditSuccessfull(false)}}
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
                        style={{ width: 150 }}
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


    const usercolumns = [
        {
          title: 'Name',
          dataIndex: 'name',
          key: 'name',
          render: (_: any, obj: any) => {
            return obj.firstname + " " + obj.lastname;
          }
        },
        {
          title: 'Username',
          dataIndex: 'username',
          key: 'username',
        },
        {
          title: 'Credits diesen Monat',
          dataIndex: 'usedCredits',
          key: 'usedCredits',
          render: (_: any, obj: any) => {
            let usageidx = obj.usedCredits.findIndex((val) => {return val.month == props.Data.currentMonth && val.year == props.Data.currentYear});
            if(usageidx != -1){
                return obj.usedCredits[usageidx].amount;
            }else{
                return "0";
            }
          }
        },
        {
            title: 'Aktionen',
            dataIndex: 'actions',
            key: 'actions',
            render: (_: any, obj: any) => {
              return undefined;
            }
          },
      ];

      const inviteUser = async (values: any) => {
        try{
            await axios.post('/api/company/invite', {
                email: values.email,
                company: user.Company,
                firstname: values.firstname,
                lastname: values.lastname
            });
            
            setIsInviteErrVisible(false);
            setInviteErrMsg("");
            inviteForm.resetFields(["email", "firstname", "lastname"]);
            setInviteUserModalOpen(false);
        }catch(e){
            setIsInviteErrVisible(true);
            setInviteErrMsg("Ein Nutzer mit dieser E-Mail Adresse nutzt Mailbuddy bereits!");
        }
      }

    const getUserOverview = () => {
        if(user.Role == "Company"){
            return(
                <div>
                    <Card title={"Nutzer"} bordered={true}>
                        <Table dataSource={users} columns={usercolumns} />
                        <Button type='primary' onClick={() => {setInviteUserModalOpen(true)}}>Nutzer einladen</Button>
                    </Card>

                    <Modal title="Nutzer einladen" open={inviteUserModalOpen} onCancel={() => {setInviteUserModalOpen(false)}} footer = {[]}>
                        
                        <Form layout='vertical' onFinish={inviteUser} form={inviteForm} onChange={() => {setIsInviteErrVisible(false); setInviteErrMsg("")}}>
                            <Form.Item label={<b>E-Mail</b>} name="email" rules={[{ required: true, message: 'Eine E-Mail ist erforderlich!' }]}>
                                <Input placeholder="max@mustermann.de"/>
                            </Form.Item>

                            <Form.Item label={<b>Vorname</b>} name="firstname" rules={[{ required: true, message: 'Eine Vorname ist erforderlich!' }]}>
                                <Input placeholder="Max"/>
                            </Form.Item>

                            <Form.Item label={<b>Nachname</b>} name="lastname" rules={[{ required: true, message: 'Eine Nachname ist erforderlich!' }]}>
                                <Input placeholder="Mustermann"/>
                            </Form.Item>
                            
                            <div className={styles.errorrow} style={{display: (isInviteErrVisible)? "block": "none"}}>
                                <Alert type='error' message={inviteErrMsg} />
                            </div>

                            <div className={styles.finishformrow}>
                                <Space direction='horizontal'>
                                <Button type='default' onClick={() => {setInviteUserModalOpen(false)}}>Abbrechen</Button>
                                <Button type='primary' htmlType='submit' onClick={() => {}}>Einladen</Button>
                                </Space>
                            </div>
            
                        </Form>

                    </Modal>
                </div>
                
            );
        }else{
            return <></>;
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
                    {getUserOverview()}
                </Space>


                
            </div>
        </SidebarLayout>
    );
}
