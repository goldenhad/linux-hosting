import { Alert, Button, Card, Form, Input, List, Modal, Tooltip, Select, Space, Table, Tag, Typography } from 'antd';
import styles from './edit.company.module.scss'
import axios from 'axios';
import { useEffect, useReducer, useState } from 'react';
import { GetServerSideProps } from 'next';
import SidebarLayout from '../../components/Sidebar/SidebarLayout';
import { useRouter } from 'next/router';
import { convertToCurrency, handleEmptyString } from '../../helper/architecture';
import { useAuthContext } from '../../components/context/AuthContext';
import { getDocWhere } from '../../firebase/data/getData';
import updateData from '../../firebase/data/updateData';
import { ClockCircleOutlined, FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import Link from 'next/link';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip as ChartTooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { User } from '../../firebase/types/User';
import { Usage } from '../../firebase/types/Company';
const { Paragraph } = Typography;
const { TextArea } = Input;

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    ChartTooltip,
    Legend
);

const months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

export interface InitialProps {
  Data: { currentMonth: number, currentYear: number; paypalURL: string; };
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
            paypalURL : process.env.PAYPALURL
          }
      },
    };
  
    
};


export default function Company(props: InitialProps) {
    const { login, user, company, role } = useAuthContext();
    const [ errMsg, setErrMsg ] = useState([]);
    const [ isErrVisible, setIsErrVisible ] = useState(false);
    const [ inviteErrMsg, setInviteErrMsg ] = useState("");
    const [ isInviteErrVisible, setIsInviteErrVisible ] = useState(false);
    const [ editSuccessfull, setEditSuccessfull ] = useState(false);
    const [ userTableData, setUserTableData ] = useState([]);
    const [ inviteUserModalOpen, setInviteUserModalOpen ] = useState(false);
    const [ inviteForm ] = Form.useForm();
    const [ form ] = Form.useForm();
    const [ userTableLoading, setUserTableLoading ] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if(!role.isCompany) {
            router.push("/");
        }
    }, []);

    useEffect(() => {
        if (login == null) router.push("/login");

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
                setUserTableData(result);
                setUserTableLoading(false);
            }else{
                setUserTableData([]);
            }
        }

        load();
    }, [company])


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

    const checkRoleString = (value: string) => {
        return value == "Mailagent" || value == "Company-Admin" || value == "Company-Manager";
    }

    const getCompanyInput = () => {
        if(role.canEditCompanyDetails){
            return (<Form 
                layout='vertical'
                onFinish={editCompany}
                onChange={() => {setIsErrVisible(false), setEditSuccessfull(false)}}
                form={form}
            >

                <Form.Item
                    label="Firmenname"
                    name="companyname"
                    className={styles.formpart}
                >
                    <Input className={styles.forminput} placeholder="Name der Firma..." />
                </Form.Item>

                <Space direction='horizontal' wrap>
                <Form.Item
                    label="Straße"
                    name="companystreet"
                    className={styles.formpart}
                >
                    <Input className={styles.forminput} placeholder="Musterstraße 1..." />
                </Form.Item>

                <Form.Item
                    label="Ort"
                    name="companycity"
                    className={styles.formpart}
                >
                    <Input className={styles.forminput} placeholder="Musterstadt..." />
                </Form.Item>

                <Form.Item
                    label="Plz"
                    name="companypostalcode"
                    className={styles.formpart}
                >
                    <Input className={styles.forminput} placeholder="123456"/>
                </Form.Item>

                <Form.Item
                    label="Land"
                    name="companycountry"
                    className={styles.formpart}
                >
                    <Select
                        className={styles.formselect}
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
                    className={styles.formpart}
                >
                    <TextArea className={styles.forminput} rows={10} placeholder="Was ist das Kerngeschäft der Firma?"/>
                </Form.Item>

                <div className={styles.errorrow} style={{display: (isErrVisible)? "block": "none"}}>
                    <Alert type='error' message={errMsg} />
                </div>

                <div className={styles.successrow} style={{display: (editSuccessfull)? "block": "none"}}>
                    <Alert type='success' message="Speichern erfolgreich!" />
                </div>

                <div className={styles.finishformrow}>
                    <Button className={styles.savebutton} type='primary' htmlType='submit'>Speichern</Button>
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
                    <TextArea rows={10} disabled/>
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
            title: 'Rolle',
            dataIndex: 'Role',
            key: 'Role',
            render: (_: any, obj: User & { id: string }, idx: number) => {
                let rolename = "Mailagent";
                switch(obj.Role){
                    case "Company-Admin":
                        rolename = "Admin";
                        break;
                    case "Company-Manager":
                        rolename = "Manager";
                        break;
                    default:
                        rolename = "Mailagent"
                        break;
                }

                if(obj.Role != "Company-Admin" && user.email != obj.email && ( user.Role == "Company-Admin" || user.Role == "Company-Manager" )){
                    return (
                        <div>
                            <div>
                                <Select value={userTableData[idx].Role} style={{ width: 200 }} options={[
                                        { label: 'Company-Manager', value: 'Company-Manager' },
                                        { label: 'Mailagent', value: 'Mailagent' },
                                    ]}
                                    onChange={async (value) => {
                                        setUserTableLoading(true);
                                        await updateData("User", obj.id, { Role: checkRoleString(value)? value: "Mailagent" });
                                        let userdata = userTableData;
                                        userdata[idx].Role = checkRoleString(value)? value: "Mailagent";
                                        setUserTableData(userdata);
                                        setUserTableLoading(false);
                                    }} 
                                />
                            </div>
                        </div>
                    );
                }else{
                    return (
                        <div>
                            <div>
                                {rolename}
                            </div>
                        </div>
                    );
                }
            }
          },
      ];

      const inviteUser = async (values: any) => {
        try{
            await axios.post('/api/company/invite', {
                email: values.email,
                company: user.Company,
                firstname: values.firstname,
                lastname: values.lastname,
                role: values.role,
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
        if(role.isCompany && role.canEditCompanyDetails){
            return(
                <div>
                    <Card title={"Nutzer"} bordered={true} headStyle={{backgroundColor: "#F9FAFB"}}>
                        <Table loading={userTableLoading} dataSource={[...userTableData]} columns={usercolumns} rowKey={(record: User & { id: string }) => {return record.id}}/>
                        <div className={styles.inviteuserrow}>
                            <Button type='primary' onClick={() => {setInviteUserModalOpen(true)}}>Nutzer einladen</Button>
                        </div>
                    </Card>

                    <Modal title="Nutzer einladen" open={inviteUserModalOpen} onCancel={() => {setInviteUserModalOpen(false)}} footer = {[]}>
                        
                        <Form layout='vertical' onFinish={inviteUser} form={inviteForm} onChange={() => {setIsInviteErrVisible(false); setInviteErrMsg("")}}>
                            <Form.Item className={styles.formpart} label={<b>E-Mail</b>} name="email" rules={[{ required: true, message: 'Eine E-Mail ist erforderlich!' }]}>
                                <Input className={styles.forminput} placeholder="max@mustermann.de"/>
                            </Form.Item>

                            <Form.Item className={styles.formpart} label={<b>Vorname</b>} name="firstname" rules={[{ required: true, message: 'Eine Vorname ist erforderlich!' }]}>
                                <Input className={styles.forminput} placeholder="Max"/>
                            </Form.Item>

                            <Form.Item className={styles.formpart} label={<b>Nachname</b>} name="lastname" rules={[{ required: true, message: 'Eine Nachname ist erforderlich!' }]}>
                                <Input className={styles.forminput} placeholder="Mustermann"/>
                            </Form.Item>

                            <Form.Item className={styles.formpart} label={<b>Rolle</b>} name="role" rules={[{ required: true, message: 'Eine Rolle ist erforderlich!' }]}>
                                <Select className={styles.formselect} value={"Mailagagent"} options={[
                                        { label: 'Company-Manager', value: 'Company-Manager' },
                                        { label: 'Mailagent', value: 'Mailagent' },
                                    ]} 
                                />
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

    const purchasecolumns = [
        {
            title: 'Status',
            dataIndex: 'state',
            key: 'state',
            render: (_: any, obj: any) => {
                switch(obj.state){
                    case "completed":
                        return(
                            <Tag icon={<CheckCircleOutlined />} color="success">
                                abgeschlossen
                            </Tag>
                        );
                    
                    case "awaiting_payment":
                        return(
                            <Tag icon={<ClockCircleOutlined />} color="warning">
                                Wartestellung
                            </Tag>
                        );
                    default:
                        return(
                            <Tag icon={<CloseCircleOutlined />} color="error">
                                abgebrochen
                            </Tag>
                        );
                }
            }
        },
        {
            title: 'Transaktion',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Datum',
            dataIndex: 'timestamp',
            key: 'timestamp',
            render: (_: any, obj: any) => {
                return new Date(obj.timestamp * 1000).toLocaleString('de',{timeZone:'Europe/Berlin', timeZoneName: 'short'});
            }
        },
        {
            title: 'Erworbene Tokens',
            dataIndex: 'tokens',
            key: 'tokens',
        },
        {
            title: 'Betrag',
            dataIndex: 'amount',
            key: 'amount',
            render: (_: any, obj: any) => {
                return convertToCurrency(obj.amount);
              }
        },
        {
            title: 'Aktionen',
            dataIndex: 'actions',
            key: 'actions',
            render: (_: any, obj: any) => {
                if(obj.state == "awaiting_payment"){
                    return (
                        <div className={styles.actionrow}>
                            <div className={styles.singleaction}>
                                <Link href={`/order/invoice/${obj.id}`}>
                                    <Tooltip title={"Rechnung herunterladen"}>
                                        <FileTextOutlined style={{ fontSize: 20 }}/>
                                    </Tooltip>
                                </Link>
                            </div>
                            <div className={styles.singleaction}>
                                <Link href={`${props.Data.paypalURL}/checkoutnow?token=${obj.id}`}>
                                    <Tooltip title={"Einkauf fortsetzen"}>
                                        <ShoppingCartOutlined style={{ fontSize: 20 }}/>
                                    </Tooltip>
                                </Link>
                            </div>
                        </div>
                    );
                }else{
                    return (
                        <div className={styles.actionrow}>
                            <div className={styles.singleaction}>
                                <Link href={`/order/invoice/${obj.id}`}>
                                    <Tooltip title={"Rechnung herunterladen"}>
                                        <FileTextOutlined style={{ fontSize: 20 }}/>
                                    </Tooltip>
                                </Link>
                            </div>
                        </div>
                    );
                }
            }
          },
      ];

  
    return (
        <SidebarLayout role={role} user={user} login={login}>
            <div className={styles.main}>
                <div className={styles.companyoverview}>
                    <Card className={styles.companysettings} title={`Ihre Firma`} headStyle={{backgroundColor: "#F9FAFB"}} bordered={true}>
                        {getCompanyInput()}
                    </Card>
                    <Card className={styles.tokeninformation} headStyle={{backgroundColor: "#F9FAFB"}} title={"Tokens"} bordered={true}>
                        <h2>Dein Token-Budget</h2>
                        <div className={styles.quotarow}>
                            <div className={styles.tokenbudget}>{(company.unlimited)? "∞" : company.tokens} Tokens</div>
                        </div>
                        <h2>Verbrauch</h2>
                            <div className={styles.usageinfo}>
                                
                                <div className={styles.barcontainer}>
                                    <Bar
                                        options={{
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    position: 'top' as const,
                                                },
                                                title: {
                                                    display: false,
                                                    text: 'Chart.js Bar Chart',
                                                },
                                            },
                                        }}
                                        data={{
                                            labels:  months,
                                            datasets: [
                                                {
                                                    label: "Tokens",
                                                    data: months.map((label, idx) => {
                                                        let sum = 0;
                                                        userTableData.forEach((su: User) => {
                                                          su.usedCredits.forEach((usage: Usage) => {
                                                            if(usage.month == idx+1 && usage.year == new Date().getFullYear()){
                                                                sum += usage.amount;
                                                            }
                                                          });
                                                        })
                                                        return sum;
                                                    }),
                                                    backgroundColor: 'rgba(16, 24, 40, 0.8)',
                                                }
                                            ]
                                        }}
                                    />
                                </div>

                            </div>

                        <div className={styles.generatebuttonrow}>
                            {(company.unlimited)? <></>:<Link href={"/upgrade"}><Button className={styles.backbutton} type='primary'>Weitere Tokens kaufen</Button></Link>}
                        </div>
                    </Card>
                </div>
                <div className={styles.companyorders}>
                    <Card title={"Einkäufe"} bordered={true} headStyle={{backgroundColor: "#F9FAFB"}}>
                        <Table dataSource={company.orders} columns={purchasecolumns} />
                    </Card>
                </div>
                <div className={styles.companyusers}>
                    {getUserOverview()}
                </div>
            </div>
        </SidebarLayout>
    );
}
