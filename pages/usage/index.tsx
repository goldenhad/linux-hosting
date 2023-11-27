import { Alert, Button, Card, Form, Input, Tooltip, Modal, Progress, Select, Space, Table, Tag, Typography } from 'antd';
import styles from './usage.module.scss'
import axios from 'axios';
import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import SidebarLayout from '../../components/Sidebar/SidebarLayout';
import { useRouter } from 'next/router';
import { convertToCurrency, handleEmptyString } from '../../helper/architecture';
import { useAuthContext } from '../../components/context/AuthContext';
import { getDocWhere } from '../../firebase/data/getData';
import { EyeOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, ShoppingCartOutlined, FileTextOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { Usage } from '../../firebase/types/Company';
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
  Data: { paypalURL: string; };
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    //Get the context of the request
    const { req, res } = ctx;
    //Get the cookies from the current request
    const { cookies } = req;
    
    return {
      props: {
        Data: {
            paypalURL : process.env.PAYPALURL
        }
      },
    };
};



export default function Usage(props: InitialProps) {
    const { login, user, company, role, calculations } = useAuthContext();
    const [ overused, setOverused ] = useState(false);
    const [ currusage, setCurrusage ] = useState(0);
    const [ users, setUsers ] = useState([]);
    const router = useRouter();

    useEffect(() => {
        if(role.isCompany) {
            router.push("/");
        }
    }, []);


    useEffect(() => {
        const load = async () => {
            let {result, error} = await getDocWhere("User", "Company", "==", user.Company);
            if(!error){
                //console.log(result);
                setUsers(result);
            }else{
                setUsers([]);
            }
        }

        load();
    }, [company]);


    const calculateMails = () => {
        return Math.floor(company.tokens/calculations.tokensPerMail);
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
                //console.log(obj)
                return new Date(obj.timestamp * 1000).toLocaleString('de',{timeZone:'Europe/Berlin', timeZoneName: 'short'});
            }
        },
        {
            title: 'Erworbene Mails',
            dataIndex: 'tokens',
            key: 'tokens',
            render: (_: any, obj: any) => {
                return obj.amount
            }
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
                    <Card className={styles.tokeninformation} headStyle={{backgroundColor: "#F9FAFB"}} title={"Mails"} bordered={true}>
                        <div className={styles.tokeninfocard}>
                            <h2>Dein Mail-Budget</h2>
                            <div className={styles.quotarow}>
                            <div className={styles.tokenbudget}>{(company.unlimited)? "∞" : `~ ${calculateMails()}`} Mails</div>
                            </div>
                        </div>
                        <div className={styles.generatebuttonrow}>
                            <Link href={"/upgrade"}>
                                {(!company.unlimited)? <Button className={styles.backbutton} type='primary'>Weitere Mails kaufen</Button> : <></>}
                            </Link>
                        </div>
                    </Card>
                    <Card className={styles.tokenusage} headStyle={{backgroundColor: "#F9FAFB"}} title={"Mail-Verbrauch"} bordered={true}>
                        <div className={styles.tokeninfocard}>
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
                                                    label: "Mails",
                                                    data: months.map((label, idx) => {
                                                        let sum = 0;
                                                        users.forEach((su: User) => {
                                                          su.usedCredits.forEach((usage: Usage) => {
                                                            if(usage.month == idx+1 && usage.year == new Date().getFullYear()){
                                                                sum += Math.floor(usage.amount/calculations.tokensPerMail);
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
                        </div>
                        
                    </Card>
                </div>
                <Card title={"Einkäufe"} bordered={true} headStyle={{backgroundColor: "#F9FAFB"}}>
                    <Table dataSource={company.orders} columns={purchasecolumns} />
                </Card>
            </div>
        </SidebarLayout>
    );
}
