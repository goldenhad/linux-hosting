import { Button, Result } from "antd";
import styles from "./thankyou.module.scss"
import axios from "axios";
import { useEffect, useState } from "react";
import { GetServerSideProps } from "next";
import SidebarLayout from "../../components/Sidebar/SidebarLayout";
import { useAuthContext } from "../../components/context/AuthContext";
import Link from "next/link";
import { Order } from "../../firebase/types/Company";
import { useRouter } from "next/router";
import updateData from "../../firebase/data/updateData";



export interface InitialProps {
  Data: {
    orderId: string,
    payerId: string,
  };
}

export const getServerSideProps: GetServerSideProps = async ( ctx ) => {
  if( ctx.query.token && ctx.query.PayerID ){
    //console.log(ctx.query.token);

    return {
      props: {
        Data: {
          orderId: ctx.query.token,
          payerId: ctx.query.PayerID
        }
      }
    };
  }else{
    return{ redirect: "/", props: {} };
  }
};


export default function Upgrade( props: InitialProps ) {
  const context = useAuthContext();
  const { user, company, role } = context;
  const [seed, setSeed] = useState( 1 );
  const router = useRouter();

  useEffect( () => {
    const handleOrderState = async ( order: Order ) => {
      const paypalOrder = await axios.get( `/api/payment/orderdetails/${order.id}` );
        
      const currentOrders = company.orders;

      const orderidx = currentOrders.findIndex( ( iter: Order ) => {
        return iter.id == order.id;
      } )

      //console.log(paypalOrder.data.message);

      if( orderidx != -1 ){
        if( paypalOrder.data.message.status == "APPROVED" ){
          const updatedOrder = order;
          updatedOrder.state = "completed"
          currentOrders[orderidx] = updatedOrder;
          const updatedTokens = company.tokens + order.tokens;

          await updateData( "Company", user.Company, { orders: currentOrders, tokens: updatedTokens } );
        }
      }else{
        throw "ORDER GOT MISSING DURING HANDLING."
      }
    }

    if( props.Data.orderId && props.Data.payerId ){

      const order = company.orders.find( ( order: Order ) => {
        return order.id == props.Data.orderId
      } );

      if( order ){
        if( order.state != "completed" ){
          try{
            handleOrderState( order );
          }catch( e ){
            router.push( "/" );
          }
        }
      }else{
        router.push( "/" )
      }

    }
  }, [company.orders, company.tokens, props.Data.orderId, props.Data.payerId, router, seed, user.Company] );


  const getResult = () => {
    const order = company.orders.find( ( order: Order ) => {
      return order.id == props.Data.orderId
    } );

    if( order.state == "payment_received" || order.state == "completed" ){
      return(
        <Result
          status="success"
          title="Kauf erfolgreich abgeschlossen!"
          subTitle={`Transaktion #${props.Data.orderId} abgeschlossen. Die erworbenen Token sollten umgehend in dein Konto gebucht werden.`}
        />
      );
    }else{
      return(
        <Result
          status="warning"
          title="Kauf noch nicht autorisiert!"
          subTitle={
            `Transaktion #${props.Data.orderId} ist noch nicht autorisiert. 
            Sobald der Kaufvorgang abgeschlossen ist verbuchen wir deine Tokens. Lade diese Seite in den kommenden Minuten nochmal neu!
            `
          }
        />
      );
    }
  }

  const getButton = () => {
    const order = company.orders.find( ( order: Order ) => {
      return order.id == props.Data.orderId
    } );

    if( order.state == "completed" ) {
      return (
        <div className={styles.buttongroup}>
          <Link href={`/order/invoice/${order.id}`}>
            <Button className={styles.backnow}>Rechnung herunterladen</Button>
          </Link>

          <Link href={( role.isCompany )? "/company": "/usage"}>
            <Button type="primary" className={styles.backnow}>Zurück zu meinem Konto</Button>
          </Link>
        </div>
      );
    }else{
      return( <Button onClick={() => {
        setSeed( Math.random() );
      }} className={styles.backnow}>Aktualisieren</Button> );
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
