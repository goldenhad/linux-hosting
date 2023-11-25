import { Alert, Button, Card, Form, Input, List, Modal, Progress, Select, Space, Table, Tag, Typography } from 'antd';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { GetServerSideProps } from 'next';
import SidebarLayout from '../../../components/Sidebar/SidebarLayout';
import { useRouter } from 'next/router';
import { convertToCurrency, handleEmptyString } from '../../../helper/architecture';
import { useAuthContext } from '../../../components/context/AuthContext';
import Link from 'next/link';
import { Order } from '../../../firebase/types/Company';
import Invoice from '../../../components/invoice/invoice';
import { useReactToPrint } from 'react-to-print';
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



export default function InvoiceDownload(props: InitialProps) {
    const { login, user, company, role } = useAuthContext();
    const [ order, setOrder ] = useState({
        id: "",
        timestamp: 0,
        tokens: 0,
        amount: 0,
        method: "",
        state: "",
        invoiceId: ""
    });
    const componentRef = useRef(null);


    const router = useRouter();

    useEffect(() => {
        let orderidx = company.orders.findIndex((orderobj: Order) => {
            return orderobj.id == props.Data.orderid
        });

        if(orderidx == -1){
            router.push("/");
        }else{
            setOrder(company.orders[orderidx]);
        }
    }, []);


    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
    });

  
    return (
        <SidebarLayout role={role} user={user} login={login}>
            <div style={{ display: "flex", flexDirection: "column", width: "100%", justifyContent: "center", alignItems: "center" }}>
                <div style={{ display: "block", width: 800 }}>
                    <Invoice company={company} user={user} order={order} ref={componentRef}></Invoice>
                </div>
                <div style={{ width: "360px" }}>
                    <Button style={{ width: 360, marginBottom: 50, marginTop: 50, height: 44, fontWeight: 700, fontSize: 16, padding: "10px 18px 10px 18px" }} type='primary' onClick={handlePrint}>Download</Button>
                </div>
            </div>
            
        </SidebarLayout>
    );
}
