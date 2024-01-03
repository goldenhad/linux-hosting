import { Button } from "antd";
import { useEffect, useRef, useState } from "react";
import { GetServerSideProps } from "next";
import SidebarLayout from "../../../components/Sidebar/SidebarLayout";
import { useRouter } from "next/router";
import { useAuthContext } from "../../../components/context/AuthContext";
import { Order } from "../../../firebase/types/Company";
import { FileOutlined } from "@ant-design/icons"
import { useReactToPrint } from "react-to-print";
import { isMobile } from "react-device-detect";

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
  const context = useAuthContext();
  const { company } = context;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    <SidebarLayout context={context}>
      <div style={{ display: "flex", flexDirection: "column", width: "100%", alignItems: "center", height: "100vh" }}>
        <div style={{ fontSize: 96, color: "#D0D5DD" }}>
          {(isMobile)? <FileOutlined />: <></>}
        </div>
        <div style={(isMobile)? { display: "none", width: 800 }: { display: "block", width: 800 }}>
        </div>
        <div style={{ width: "360px", display: "flex", flexDirection: "row", justifyContent: "center" }}>
          <Button
            style={{ maxWidth: 360, width: "80%", marginBottom: 50, marginTop: 50, height: 44, fontWeight: 700, fontSize: 16, padding: "10px 18px 10px 18px" }}
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
