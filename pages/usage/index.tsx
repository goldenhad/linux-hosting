import { Alert, Button, Card, Form, Input, List, Modal, Progress, Select, Space, Table, Tag, Typography } from 'antd';
import styles from './usage.module.scss'
import axios from 'axios';
import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import SidebarLayout from '../../components/Sidebar/SidebarLayout';
import { useRouter } from 'next/router';
import { convertToCurrency, handleEmptyString } from '../../helper/architecture';
import { useAuthContext } from '../../components/context/AuthContext';
import { getDocWhere } from '../../firebase/data/getData';
import { EyeOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, CloseOutlined, FileTextOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { Usage } from '../../firebase/types/Company';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
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
    Tooltip,
    Legend
);

const months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];


export interface InitialProps {
  Data: { };
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    //Get the context of the request
    const { req, res } = ctx;
    //Get the cookies from the current request
    const { cookies } = req;
    
    return {
      props: {
          
      },
    };
};



export default function Usage(props: InitialProps) {
    const { login, user, company, role } = useAuthContext();
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
                console.log(result);
                setUsers(result);
            }else{
                setUsers([]);
            }
        }

        load();
    }, [company])

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
                        return(<></>);
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
                console.log(obj)
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
                return (
                    <div className={styles.actionrow}>
                        <div className={styles.singleaction}>
                            <Link href={`/order/invoice/${obj.id}`}>
                                <FileTextOutlined style={{ fontSize: 20 }}/>
                            </Link>
                        </div>
                    </div>
                );
            }
          },
      ];

  
    return (
        <SidebarLayout role={role} user={user} login={login}>
            <div className={styles.main}>
                <div className={styles.companyoverview}>
                    <Card className={styles.tokeninformation} headStyle={{backgroundColor: "#F9FAFB"}} title={"Tokens"} bordered={true}>
                        <div className={styles.tokeninfocard}>
                            <h2>Dein Token-Budget</h2>
                            <div className={styles.quotarow}>
                            <div className={styles.tokenbudget}>{(company.unlimited)? "∞" : company.tokens} Tokens</div>
                            </div>
                        </div>
                        <div className={styles.generatebuttonrow}>
                            <Link href={"/upgrade"}>
                                {(!company.unlimited)? <Button className={styles.backbutton} type='primary'>Weitere Tokens kaufen</Button> : <></>}
                            </Link>
                        </div>
                    </Card>
                    <Card className={styles.tokenusage} headStyle={{backgroundColor: "#F9FAFB"}} title={"Tokens"} bordered={true}>
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
                                                    label: "Tokens",
                                                    data: months.map((label, idx) => {
                                                        let sum = 0;
                                                        users.forEach((su: User) => {
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
