import { Alert, Button, Card, Form, Input, Tooltip, Modal, Progress, Select, Space, Table, Tag, Typography, TourProps, Tour } from 'antd';
import styles from './usage.module.scss'
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
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
import updateData from '../../firebase/data/updateData';
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
    const [open, setOpen] = useState<boolean>(!user.tour.usage);

    const budgetRef = useRef(null);
    const statRef = useRef(null);
    const buyRef = useRef(null);
    const orderRef = useRef(null);


    let steps: TourProps['steps'] = [
        {
            title: 'Nutzung und Mail-Budget',
            description: 'Willkommen in den Nutzungsinformationen. Hier kannst du dein Mail-Budget überprüfen und Statistiken zur Nutzung unseres Tools einsehen. Außerdem hast du die Möglichkeit, weitere Mails zu kaufen und deine bisherigen Bestellungen einzusehen.',
            nextButtonProps: {
                children: (
                "Weiter"
                )
            },
            prevButtonProps: {
                children: (
                "Zurück"
                )
            }
        },
        {
            title: 'Mail-Budget',
            description: 'Hier wird dein aktuelles Mail-Budget angezeigt. Die angegebene Zahl gibt dir einen Überblick darüber, wie viele Mails du ungefähr noch schreiben kannst.',
            target: () => budgetRef.current,
            nextButtonProps: {
                children: (
                "Weiter"
                )
            },
            prevButtonProps: {
                children: (
                "Zurück"
                )
            }
        },
        {
            title: 'Ihr wollt noch mehr E-Mails optimieren?',
            description: 'Solltet du den Bedarf haben, mehr E-Mails zu optimieren, kannst du zusätzliche E-Mail-Kapazitäten hier direkt erwerben.',
            target: () => buyRef.current,
            nextButtonProps: {
                children: (
                "Weiter"
                )
            },
            prevButtonProps: {
                children: (
                "Zurück"
                )
            }
        },
        {
            title: 'Statistik',
            description: 'Hier findest du eine kurze und klare Übersicht darüber, wie viele Mails du über das aktuelle Jahr mit Siteware.Mail bereits verbraucht hast.',
            target: () => statRef.current,
            nextButtonProps: {
              children: (
                "Weiter"
              )
            },
            prevButtonProps: {
              children: (
                "Zurück"
              )
            }
        },
        {
            title: 'Eure bisherigen Einkäufe',
            description: 'In dieser Tabelle findet ihr eine Übersicht deiner bisherigen Einkäufe bei Siteware.Mail. Hier hast du die Möglichkeit, Rechnungen herunterzuladen und unterbrochene Einkäufe abzuschließen.',
            target: () => orderRef.current,
            nextButtonProps: {
                children: (
                "Alles klar"
                ),
                onClick: async () => {
                let currstate = user.tour;
                currstate.usage = true;
                updateData("User", login.uid, { tour: currstate })
                }
            },
            prevButtonProps: {
                children: (
                "Zurück"
                )
            }
        }
    ];


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
                    <Card ref={budgetRef} className={styles.tokeninformation} headStyle={{backgroundColor: "#F9FAFB"}} title={"Mails"} bordered={true}>
                        <div className={styles.tokeninfocard}>
                            <h2>Dein Mail-Budget</h2>
                            <div className={styles.quotarow}>
                            <div className={styles.tokenbudget}>{(company.unlimited)? "∞" : `~ ${calculateMails()}`} Mails</div>
                            </div>
                        </div>
                        <div className={styles.generatebuttonrow}>
                            <Link href={"/upgrade"}>
                                {(!company.unlimited)? <Button ref={buyRef} className={styles.backbutton} type='primary'>Weitere Mails kaufen</Button> : <></>}
                            </Link>
                        </div>
                    </Card>
                    <Card ref={statRef} className={styles.tokenusage} headStyle={{backgroundColor: "#F9FAFB"}} title={"Mail-Verbrauch"} bordered={true}>
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
                <Card ref={orderRef} title={"Einkäufe"} bordered={true} headStyle={{backgroundColor: "#F9FAFB"}}>
                    <Table dataSource={company.orders} columns={purchasecolumns} />
                </Card>
                <Tour open={open} onClose={async () => {
                    let currstate = user.tour;
                    currstate.usage = true;
                    updateData("User", login.uid, { tour: currstate });
                    setOpen(false);
                }} steps={steps} />
            </div>
        </SidebarLayout>
    );
}
