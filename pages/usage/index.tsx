import { Alert, Button, Card, Form, Input, List, Modal, Progress, Select, Space, Table, Tooltip, Typography } from 'antd';
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
const { Paragraph } = Typography;

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



export default function Usage(props: InitialProps) {
    const { login, user, company, role, quota } = useAuthContext();
    const [ overused, setOverused ] = useState(false);
    const [ currusage, setCurrusage ] = useState(0);
    const router = useRouter();

    useEffect(() => {
        if(user.Role != "Singleuser") {
            router.push("/");
        }
    }, []);

    useEffect(() => {
        if(company){
            setCurrusage(findUsage(company.Usage).amount);
        }
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
            <Paragraph className={styles.upgrade}>
                Entdecke jetzt mehr Möglichkeiten upgrade auf unsere weiteren Pläne und erlebe das volle Spektrum an Funktionen und Tokens! <Link href='/upgrade'>Weitere Pläne</Link>
            </Paragraph>
        );
    }

  
    return (
        <SidebarLayout capabilities={role.capabilities} user={user} login={login}>
            <div className={styles.main}>
                <div className={styles.companyoverview}>
                    <Card className={styles.tokeninformation} headStyle={{backgroundColor: "#F9FAFB"}} title={"Tokens"} bordered={true}>
                        <div className={styles.tokeninfocard}>
                            <h2>Verbrauchte Tokens (seit 01.{pad(props.Data.currentMonth, 2)}.{props.Data.currentYear})</h2>
                            <div className={styles.quotarow}>
                                <Tooltip title={`${currusage} Tokens von ${quota.tokens} verbraucht.`}>
                                    <Progress type='circle' size="default" className={styles.quotaprogress} status={(overused)? "exception": undefined} percent={Math.round((currusage / quota.tokens) * 100)  } />
                                </Tooltip>
                            </div>
                            <h2 className={styles.quotatitle}>Aktueller Plan: {company.Quota}</h2>
                            
                            <div className={styles.planinformation}>
                                <List
                                    className={styles.quotainfolist}
                                    bordered
                                    dataSource={quota.features}
                                    renderItem={(item) => {
                                        return(
                                            <List.Item>
                                                <div className={styles.quotainfo}>
                                                    <div className={styles.quotainfoicon}><RightCircleOutlined /></div>
                                                    <div className={styles.quotainfotext}>{item}</div>
                                                </div>
                                            </List.Item>
                                        );
                                    } }>
                                </List>

                            </div>

                            {getUpgradeLink()}
                        </div>
                        
                    </Card>
                </div>
            </div>
        </SidebarLayout>
    );
}
