"use client";
import { ConfigProvider } from "antd";
import styles from "./upgrade.module.scss"
import { GetServerSideProps } from "next";
import { useAuthContext } from "../../components/context/AuthContext";
import Creditform from "../../components/CreditForm/Creditform";
import getStripe from "../../helper/stripe";
import { Elements } from "@stripe/react-stripe-js";


const stripePromise = getStripe();

/**
 * Parse the query string to resolve a given amount of token
 * @param ctx
 */
export const getServerSideProps: GetServerSideProps = async ( ctx ) => {
  const { token } = ctx.query;

  return {
    props: {
      Data: {
        token: ( token )? token: ""
      }
    }
  };
};


/**
 * Implements a page where users can buy account tokens with stripe and a custom form
 * @constructor
 */
export default function Upgrade( ) {
  const context = useAuthContext();
  const { user, company, invoice_data, calculations } = context;

  return (
    <ConfigProvider theme={{
      components: {
        Slider: {
          trackBg: "#1478FD",
          handleColor: "#1478FD",
          handleActiveColor: "#1478FD",
          railSize: 8,
          dotSize: 12,
          controlSize: 12
        }
      }
    }}>
      <div className={styles.main}>
        <div className={styles.logorow}>
          <div className={styles.logobox}>
            {/*eslint-disable-next-line */}
            <img src={"/logo.svg"} alt="Logo" width={100}/>
          </div>
        </div>
        <Elements stripe={stripePromise}>
          <Creditform user={user} company={company} invoiceData={invoice_data} calculation={calculations}/>
        </Elements>
      </div>
    </ConfigProvider>
  )
}
