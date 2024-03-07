import { Button, Result } from "antd";
import styles from "./thankyou.module.scss"
import { useEffect, useState } from "react";
import { GetServerSideProps } from "next";
import SidebarLayout from "../../components/Sidebar/SidebarLayout";
import { useAuthContext } from "../../components/context/AuthContext";
import Link from "next/link";
import { Order } from "../../firebase/types/Company";
import updateData from "../../firebase/data/updateData";
import axios from "axios";
import { useRouter } from "next/router";


// Define the page props
export interface InitialProps {
  Data: {
    sessionid: string,
    status: string,
  };
}

/**
 * Parse the query params
 * @param ctx
 */
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
    // If some data of the order is missing redirect the user
    return{ redirect: "/", props: { Data: {} } };
  }
};

/**
 * Display a thank-you message page after the user did a purchase
 * @param props
 * @constructor
 */
export default function Thankyou( props: InitialProps ) {
  const context = useAuthContext();
  const { user, company } = context;
  const [order, setOrder] = useState({
    id: "",
    timestamp: Math.floor( Date.now() / 1000 ),
    tokens: 0,
    amount: 0,
    method: "undefined",
    state: "undefined",
    type: "undefined",
    invoiceId: "undefined"
  });
  const router = useRouter();

  /**
   * Execute the order
   */
  useEffect(() => {
    /**
     * Update the orders of the company with the local object
     */
    const updateOrder = async () => {
      await updateData( "Company", user.Company, { orders: company.orders } );
    }

    /**
     * Update the tokens of the company with the local value
     */
    const updateTokens = async () => {
      await updateData( "Company", user.Company, { tokens: company.tokens } );
    }

    // Check if a stripe session id was provided
    if(props.Data.sessionid){
      // Filter the orders by the given session id
      const orderid = company.orders.findIndex( ( order: Order ) => {
        return order.id == props.Data.sessionid
      } );

      // If the filtered order id is valid
      if(company.orders[orderid]){
        // Get the order by the filtered id
        setOrder(company.orders[orderid]);

        // Check the state of the order loaded through the page
        if(props.Data.status == "success"){
          // Check the state of the filtered order
          if(company.orders[orderid].state == "awaiting_payment"){
            // If the user is not yet accepted, add the amount of the order to the company account
            company.orders[orderid].state = "accepted";
            company.tokens += company.orders[orderid].tokens;

            // Update the tokens of the company with the local value
            updateTokens();
          }
        }else{
          // If the page was called with any other state set the order state to "canceled"
          company.orders[orderid].state = "canceled";
        }

        // Update the state of the order
        updateOrder();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Display the result page according to the state of the purchase
   */
  const getResult = () => {
    // Determine the displayed message depending on the state returned from stripe
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

  /**
   * Display a button depending on the order state
   */
  const getButton = () => {
    if(props.Data.sessionid){
      if( props.Data.status == "success" ) {
        return (
          <div className={styles.buttongroup}>
            <Button className={styles.backnow} onClick={async () => {
              const invoiceurlreq = await axios.get(`/api/payment/invoice?orderid=${props.Data.sessionid}`);
              if(invoiceurlreq.data.message){
                const invoiceurl = invoiceurlreq.data.message
                router.push(invoiceurl);
              }
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
