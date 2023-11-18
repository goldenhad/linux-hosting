import { Card, Button, Form, Input, Select, Result, Skeleton, Space, Typography, Alert, Divider, List } from 'antd';
import Icon from '@ant-design/icons';
import styles from './upgrade.module.scss'
import { db } from '../../db';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import SidebarLayout from '../../components/Sidebar/SidebarLayout';
import { useAuthContext } from '../../components/context/AuthContext';
import { redirect, useRouter } from 'next/navigation';
import { Usage } from '../../firebase/types/Company';
import { Profile } from '../../firebase/types/Profile';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { convertToCurrency, handleEmptyString } from '../../helper/architecture';
import ArrowRight from '../public/icons/arrowright.svg';
import { getAllDocs } from '../../firebase/data/getData';
import { RightCircleOutlined } from '@ant-design/icons';
var paypal = require('paypal-rest-sdk');
const { Paragraph } = Typography;
const { TextArea } = Input;



export interface InitialProps {
  Data: {
    currentMonth: number,
    currentYear: number,
  };
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


export default function Upgrade(props: InitialProps) {
  const { login, user, company, role, quota } = useAuthContext();
  const [ plans, setPlans ] = useState([]);
  const { push } = useRouter();

  useEffect(() => {
    const getQuotas = async () => {
        let {result, error} = await getAllDocs('Quota');
        if(result){
            setPlans(result);
        }
    }

    getQuotas();
  }, [])


  const displayPrice = (price: number) => {
    if(price < 1){
        return "Keine Kosten";
    }else{
        return convertToCurrency(price)
    }
  }


  const issuePayment = async (price: number, name: string) => {
    let userlink = await axios.post("/api/payment/paypal", {amount: price.toString()});
    if(userlink.data.message.href){
      push(userlink.data.message.href);
    }
  }

  const getBuyButton = (id: string, name: string, price: number) => {
    return <Button onClick={async () => {await issuePayment(price, name)}} type="primary" className={styles.buynow}>Jetzt upgraden</Button>
  }


  const getQuotaCard = () => {
    return plans.map((plan, idx) => {
        return (
            <div className={styles.quoatacard} title={undefined} key={idx}>
                <h2>{plan.name}</h2>
                <div className={styles.quoataprice}>{displayPrice(plan.price)}</div>
                <List
                    className={styles.featuremap}
                    
                    dataSource={plan.features}
                    renderItem={(item: string) => {
                        return(
                            <List.Item>
                                <div className={styles.feature}>
                                    <div className={styles.featureicon}><RightCircleOutlined /></div>
                                    <div className={styles.featuretext}>{item}</div>
                                </div>
                            </List.Item>
                        );
                    } }>
                </List>
                <div className={styles.buyrow}>{getBuyButton(plan.uid, plan.name, plan.price)}</div>
            </div>
        );
    })
  }


  return (
    <SidebarLayout capabilities={(role)? role.capabilities: {}} user={user} login={login}>
      <div className={styles.main}>
        {getQuotaCard()}
      </div>
    </SidebarLayout>
  )
}
