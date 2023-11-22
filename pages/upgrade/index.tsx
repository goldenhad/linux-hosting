import { Card, Button, Form, Input, Select, Result, Skeleton, Space, Typography, Alert, Divider, List, Slider, Table, ConfigProvider } from 'antd';
import Icon from '@ant-design/icons';
import styles from './upgrade.module.scss'
import { db } from '../../db';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import SidebarLayout from '../../components/Sidebar/SidebarLayout';
import { useAuthContext } from '../../components/context/AuthContext';
import { redirect, useRouter } from 'next/navigation';
import { Order, Usage } from '../../firebase/types/Company';
import { Profile } from '../../firebase/types/Profile';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { convertToCurrency, handleEmptyString } from '../../helper/architecture';
import ArrowRight from '../public/icons/arrowright.svg';
import { getAllDocs } from '../../firebase/data/getData';
import { RightCircleOutlined,  } from '@ant-design/icons';
import updateData from '../../firebase/data/updateData';
import { mailAmountMapping, mailSavingMapping, mailPriceMapping } from '../../helper/price';
var paypal = require('paypal-rest-sdk');
const { Paragraph } = Typography;
const { TextArea } = Input;



export interface InitialProps {
  Data: {
    token: string,
  };
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  //Get the context of the request
  const { req, res } = ctx;
  //Get the cookies from the current request
  const { cookies } = req;

  let { token } = ctx.query;

  return {
    props: {
        Data: {
          token: (token)? token: "",
        }
    },
  };
};


export default function Upgrade(props: InitialProps) {
  const { login, user, company, role } = useAuthContext();
  const [ tokenstobuy, setTokenstobuy ] = useState(0);
  const { push } = useRouter();
  const router = useRouter();

  useEffect(() => {

    if(company.unlimited){
      router.push("/");
    }

    const delOrderObj = async () => {
      let orderindex = company.orders.findIndex((singleorder: Order) => {
        return singleorder.id == props.Data.token;
      })

      if(orderindex != -1){
        let orders = company.orders.filter((orderobj: Order) => {
          return orderobj.id != props.Data.token;
        })
        await updateData("Company", user.Company, { orders: orders });
      }
    }

    if(props.Data.token != ""){
      delOrderObj();
    }
  }, [])

  const issuePayment = async (tokens: number) => {
    let userlink = await axios.post("/api/payment/paypal", {tokens: tokens.toString()});
    
    if(userlink.data.message.id && userlink.data.message.links){
      let currentOrders = company.orders;
      let newOrder: Order = {
        id: userlink.data.message.id,
        timestamp: Math.floor(Date.now() / 1000),
        tokens: calculateTokens(),
        amount: mailPriceMapping[tokenstobuy],
        method: "Paypal",
        state: "awaiting_payment"
      }

      currentOrders.push(newOrder);
      console.log(currentOrders)

      await updateData("Company", user.Company, { orders: currentOrders })

      push(userlink.data.message.links[1].href);
    }
  }

  const calculateTokens = () => {
    return Math.round((mailPriceMapping[tokenstobuy]/(0.03 * 6))*3000);
  }

  const calculatePricePerMail = () => {
    return parseFloat((mailPriceMapping[tokenstobuy]/mailAmountMapping[tokenstobuy]).toFixed(2));
  }

  const calculateHours = () => {
    return Math.round((mailAmountMapping[tokenstobuy] * 5 * 0.9)/60);
  }

  const calculateSavings = () => {
    return mailSavingMapping[tokenstobuy] * mailPriceMapping[tokenstobuy];
  }


  return (
    <ConfigProvider theme={{
      components: {
        Slider: {
          trackBg: '#1478FD',
          handleColor: '#1478FD',
          handleActiveColor: '#1478FD',
          railSize: 8,
          dotSize: 12,
          controlSize: 12
        }
      }
    }}>
      <div className={styles.main}>
        <div className={styles.logorow}>
            <div className={styles.logobox}>
                <img src={"/logo.svg"} alt="Logo" width={100}/>
            </div>
        </div>
        <div className={styles.cardrow}>
          <div className={styles.headline}>
            <h1 className={styles.mainheadline}>Credits Kaufen</h1>
            <div className={styles.subheadline}>Bis zu 45% sparen!</div>
          </div>
          <Card className={styles.quoatacard} headStyle={{backgroundColor: "#F9FAFB"}} bordered={true}>
            <div className={styles.tokenrow}>
              <div className={styles.tokens}>{mailAmountMapping[tokenstobuy]}</div>
              <div className={styles.tokeninfo}>Mails</div>
            </div>
            <Form>
              <Form.Item className={styles.tokenslideritem} name={"tokenamount"}>
                <Slider className={styles.tokenslider} defaultValue={0} max={6} step={1} tooltip={{ formatter: null }} onChange={(val) => setTokenstobuy(val)}/>
              </Form.Item>
            </Form>
            <Divider className={styles.tokendivider} />
            <div className={styles.details}>
              <div className={styles.singledetail}>Preis je Mail: <span className={styles.detailhighlight}>{convertToCurrency(calculatePricePerMail())}</span></div>
              <div className={styles.singledetail}>Deine monatliche Ersparnis: <span className={styles.detailhighlight}>{convertToCurrency(calculateSavings())}</span></div>
              <div className={styles.singledetail}>Entspricht: <span className={styles.detailhighlight}>{calculateTokens()} Token</span></div>
              <div className={styles.singledetail}>Gesamtpreis: <span className={styles.detailhighlight}>{convertToCurrency(mailPriceMapping[tokenstobuy])}</span></div>
            </div>
          </Card>

          <div className={styles.buyrow}>
              <div className={styles.checkout}>

                <div className={styles.checkoutheadline}>Deine Ersparnis</div>
                <div className={styles.savings}>
                  <div className={styles.singlesaving}>Zeitersparnis im Monat: <span className={styles.savinghighlight}>{calculateHours()} Stunden</span></div>
                  <div className={styles.singlesaving}>Arbeitskosten: <span className={styles.savinghighlight}>{convertToCurrency(calculateHours() * 45)} (Bei 45,- EUR je Std.)</span></div>
                </div>
              </div>

              <div className={styles.buybuttonrow}>
                <div className={styles.buybutton}>
                  <Button onClick={async () => {await issuePayment(tokenstobuy)}} type="primary" className={styles.buynow}>Weiter zur Zahlung</Button>
                </div>

                <div className={styles.buybutton}>
                  <Button onClick={() => {router.back()}} className={styles.buynow}>Zurück zur Übersicht</Button>
                </div>
              </div>
            </div>
        </div>
      </div>
    </ConfigProvider>
  )
}
