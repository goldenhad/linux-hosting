import { Button } from "antd";
import { useEffect, useRef, useState } from "react";
import { GetServerSideProps } from "next";
import SidebarLayout from "../../../components/Sidebar/SidebarLayout";
import { useRouter } from "next/router";
import { useAuthContext } from "../../../components/context/AuthContext";
import { Order } from "../../../firebase/types/Company";
import Invoice from "../../../components/invoice/invoice";
import { useReactToPrint } from "react-to-print";

export interface InitialProps {
  Data: { orderid: string };
}

export const getServerSideProps: GetServerSideProps = async ( ctx ) => { 
  const { id } = ctx.query;
  
  return {
    props: {
      Data: {
        orderid: ( id )? id: ""
      }
    }
  };
};



export default function InvoiceDownload( props: InitialProps ) {
  const { login, user, company, role } = useAuthContext();
  const [ order, setOrder ] = useState( {
    id: "",
    timestamp: 0,
    tokens: 0,
    amount: 0,
    method: "",
    state: "",
    invoiceId: ""
  } );
  const componentRef = useRef( null );


  const router = useRouter();

  useEffect( () => {
    const orderidx = company.orders.findIndex( ( orderobj: Order ) => {
      return orderobj.id == props.Data.orderid
    } );

    if( orderidx == -1 ){
      router.push( "/" );
    }else{
      setOrder( company.orders[orderidx] );
    }
  }, [company.orders, props.Data.orderid, router] );


  const handlePrint = useReactToPrint( {
    content: () => componentRef.current
  } );

  
  return (
    <SidebarLayout role={role} user={user} login={login}>
      <div style={{ display: "flex", flexDirection: "column", width: "100%", justifyContent: "center", alignItems: "center" }}>
        <div style={{ display: "block", width: 800 }}>
          <Invoice company={company} user={user} order={order} ref={componentRef}></Invoice>
        </div>
        <div style={{ width: "360px" }}>
          <Button
            style={{ width: 360, marginBottom: 50, marginTop: 50, height: 44, fontWeight: 700, fontSize: 16, padding: "10px 18px 10px 18px" }}
            type='primary'
            onClick={handlePrint}
          >
            Download
          </Button>
        </div>
      </div>
            
    </SidebarLayout>
  );
}
