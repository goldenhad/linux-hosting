import { Alert, Button, Card, Form, Input, List, Modal, Progress, Select, Space, Table, Typography } from 'antd';
import styles from './usage.module.scss'
import axios from 'axios';
import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import SidebarLayout from '../../components/Sidebar/SidebarLayout';
import { useRouter } from 'next/router';
import { handleEmptyString } from '../../helper/architecture';
import { useAuthContext } from '../../components/context/AuthContext';
import { getDocWhere } from '../../firebase/data/getData';
import updateData from '../../firebase/data/updateData';
import { RightCircleOutlined } from '@ant-design/icons';
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



export default function Usage(props: InitialProps) {
    const { login, user, company, role, quota } = useAuthContext();
    const [ overused, setOverused ] = useState(false);
    const [ currusage, setCurrusage ] = useState(0);
    const [ users, setUsers ] = useState([]);
    const router = useRouter();

    useEffect(() => {
        if(user.Role != "Singleuser") {
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

    const findUsage = (usagearr: Array<Usage>) => {
        for(let idx=0; idx < usagearr.length; idx++){
            let elm = usagearr[idx];
            if(elm.month == props.Data.currentMonth && elm.year == props.Data.currentYear){
                return elm;
            }
        }

        return {amount: 0};
    }
    
    const getUpgradeLink = () => {
        return(
            <div className={styles.generatebuttonrow}>
                <Button className={styles.backbutton} type='primary'>Weitere Tokens kaufen</Button>
            </div>
        );
    }

    const purchasecolumns = [
        {
          title: 'Transaktion',
          dataIndex: 'id',
          key: 'id',
        },
        {
          title: 'Datum',
          dataIndex: 'date',
          key: 'date',
        },
        {
          title: 'Erworbene Tokens',
          dataIndex: 'boughtCredits',
          key: 'boughtCredits',
        },
        {
            title: 'Betrag',
            dataIndex: 'cost',
            key: 'cost',
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

  
    return (
        <SidebarLayout capabilities={role.capabilities} user={user} login={login}>
            <div className={styles.main}>
                <div className={styles.companyoverview}>
                    <Card className={styles.tokeninformation} headStyle={{backgroundColor: "#F9FAFB"}} title={"Tokens"} bordered={true}>
                        <div className={styles.tokeninfocard}>
                            <h2>Dein Token-Budget</h2>
                            <div className={styles.quotarow}>
                                <div className={styles.tokenbudget}>{company.tokens} Tokens</div>
                            </div>
                        </div>
                        <div className={styles.generatebuttonrow}>
                            <Button className={styles.backbutton} type='primary'>Weitere Tokens kaufen</Button>
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
                <Card title={"Käufe"} bordered={true} headStyle={{backgroundColor: "#F9FAFB"}}>
                    <Table dataSource={[]} columns={purchasecolumns} />
                </Card>
            </div>
        </SidebarLayout>
    );
}
