"use client";
import { Card, Button, Form, Divider, Slider, ConfigProvider, Switch } from "antd";
import styles from "./upgrade.module.scss"
import axios from "axios";
import { useEffect, useState } from "react";
import { GetServerSideProps } from "next";
import { useAuthContext } from "../../components/context/AuthContext";
import { useRouter } from "next/navigation";
import { Order, Plan } from "../../firebase/types/Company";
import { convertToCurrency, normalizeTokens } from "../../helper/architecture";
import updateData from "../../firebase/data/updateData";
import { mailAmountMapping, mailSavingMapping, mailPriceMapping } from "../../helper/price";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { CardElement, useElements, useStripe, Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Creditform from "../../components/CreditForm/Creditform";
import getStripe from "../../helper/stripe";


export interface InitialProps {
  Data: {
    token: string,
  };
}

const stripePromise = getStripe();

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



export default function Upgrade( props: InitialProps ) {
  const context = useAuthContext();
  const { user, company, invoice_data } = context;

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
          <Creditform user={user} company={company} invoiceData={invoice_data}/>
        </Elements>
      </div>
    </ConfigProvider>
  )
}
