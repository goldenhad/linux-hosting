import { Button, Result } from "antd";
import styles from "./thankyou.module.scss"
import { useEffect, useState } from "react";
import { GetServerSideProps } from "next";
import SidebarLayout from "../../components/Sidebar/SidebarLayout";
import { useAuthContext } from "../../components/context/AuthContext";
import Link from "next/link";
import { Order } from "../../firebase/types/Company";
import { getPDFUrl } from "../../helper/invoice";
import updateData from "../../firebase/data/updateData";



export interface InitialProps {
  Data: {
    sessionid: string,
    status: string,
  };
}

export const getServerSideProps: GetServerSideProps = async ( ctx ) => {
  if( ctx.query.sessionid != undefined && ctx.query.status != undefined ){
    //console.log(ctx.query.token);
    return {
      props: {
        Data: {
          sessionid: ctx.query.sessionid,
          status: ctx.query.status
        }
      }
    };
  }else{
    return{ redirect: "/", props: { Data: {} } };
  }
};


export default function Thankyou( props: InitialProps ) {
  const context = useAuthContext();
  const { role, user, company, calculations } = context;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [seed, setSeed] = useState( 1 );
  const [order, setOrder] = useState({
    id: "",
    timestamp: Math.floor( Date.now() / 1000 ),
    tokens: 0,
    amount: 0,
    method: "undefined",
    state: "undefined",
    type: "undefined",
    invoiceId: "undefined"
  })

  useEffect(() => {
    const updateOrder = async () => {
      await updateData( "Company", user.Company, { orders: company.orders } );
    }

    const updateTokens = async () => {
      await updateData( "Company", user.Company, { tokens: company.tokens } );
    }


    if(props.Data.sessionid){
      const orderid = company.orders.findIndex( ( order: Order ) => {
        return order.id == props.Data.sessionid
      } );
  
      if(company.orders[orderid]){
        setOrder(company.orders[orderid]);
  
        if(props.Data.status == "success"){
          if(company.orders[orderid].state == "awaiting_payment"){
            company.orders[orderid].state = "accepted";
            company.tokens += company.orders[orderid].tokens;
            
            updateTokens();
          }
        }else{
          company.orders[orderid].state = "cancled";
        }

        updateOrder();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getResult = () => {
    if(props.Data.sessionid){
      if( props.Data.status == "success" ){
        return(
          <Result
            status="success"
            title="Kauf erfolgreich abgeschlossen!"
            subTitle={`Transaktion #${order.invoiceId} abgeschlossen. Die erworbenen Credits sollten umgehend in dein Konto gebucht werden.`}
          />
        );
      }else{
        return(
          <Result
            status="error"
            title="Kauf abgebrochen"
            subTitle={
              `Transaktion #${order.invoiceId} wurde abgebrochen. 
              `
            }
          />
        );
      }
    }else{
      return(
        <Result
          status="error"
          title="Es ist ein Fehler aufgetreten"
        />
      );
    }
  }

  const getButton = () => {
    if(props.Data.sessionid){
  
      if( props.Data.status == "success" ) {
        return (
          <div className={styles.buttongroup}>
            <Button className={styles.backnow} onClick={() => {
              getPDFUrl(role, user, company, order, calculations).download(`Siteware_business_invoice_${order.invoiceId}`)
            }}>Rechnung herunterladen</Button>
  
            <Link href={"/usage"}>
              <Button type="primary" className={styles.backnow}>Zurück zu meinem Konto</Button>
            </Link>
          </div>
        );
      }else{
        return(
          <Link href={"/usage"}>
            <Button type="primary" className={styles.backnow}>Zurück zu meinem Konto</Button>
          </Link>
        );
      }
    }else{
      return(
        <Link href={"/usage"}>
          <Button type="primary" className={styles.backnow}>Zurück zu meinem Konto</Button>
        </Link>
      );
    }
  }
  return (
    <SidebarLayout context={context}>
      <div className={styles.main}>
        <div className={styles.resultrow}>
          {getResult()}
        </div>
        <div className={styles.buttonrow}>
          <div className={styles.backbutton}>
            {getButton()}
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
}
