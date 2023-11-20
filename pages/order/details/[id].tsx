import { Alert, Button, Card, Form, Input, List, Modal, Progress, Select, Space, Table, Tag, Typography } from 'antd';
import styles from './usage.module.scss'
import axios from 'axios';
import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import SidebarLayout from '../../../components/Sidebar/SidebarLayout';
import { useRouter } from 'next/router';
import { convertToCurrency, handleEmptyString } from '../../../helper/architecture';
import { useAuthContext } from '../../../components/context/AuthContext';
import { EyeOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, CloseOutlined, FileTextOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { Order } from '../../../firebase/types/Company';
const { Paragraph } = Typography;

const { TextArea } = Input;


export interface InitialProps {
  Data: { orderid: string };
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    //Get the context of the request
    const { req, res } = ctx;
    //Get the cookies from the current request
    const { cookies } = req;
  
    let { id } = ctx.query;
  
    return {
      props: {
          Data: {
            orderid: (id)? id: ""
          }
      },
    };
};



export default function Usage(props: InitialProps) {
    const { login, user, company, role, quota } = useAuthContext();
    const [ order, setOrder ] = useState({
        id: "",
        timestamp: 0,
        tokens: 0,
        amount: 0,
        method: "",
        state: "",
    });

    const router = useRouter();

    useEffect(() => {
        let orderidx = company.orders.findIndex((orderobj: Order) => {
            return orderobj.id == props.Data.orderid
        });

        if(orderidx == -1){
            router.push("/");
        }
    }, []);

  
    return (
        <SidebarLayout capabilities={role.capabilities} user={user} login={login}>
            <div className={styles.main}>
                <Card title={`Einkauf #${order.id}`}>

                </Card>
            </div>
        </SidebarLayout>
    );
}
