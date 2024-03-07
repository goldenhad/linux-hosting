import { Card, Form, Slider } from "antd";
import styles from "./creditform.module.scss";
import { TokenCalculator, toGermanCurrencyString } from "../../helper/price";
import { useState } from "react";
import { useStripe } from "@stripe/react-stripe-js";
import axios from "axios";
import { useRouter } from "next/router";
import { User } from "../../firebase/types/User";
import { Company, Order } from "../../firebase/types/Company";
import { AssistantCost, Calculations, InvoiceSettings } from "../../firebase/types/Settings";
import updateData from "../../firebase/data/updateData";
import FatButton from "../FatButton";


/**
 * Component implementing a user input to select and buy tokens depending on our
 * calculation model in the database
 * @param props.user Object containing the user
 * @param props.company Object containing the company
 * @param props.invoiceData Object containing data for invoicing
 * @param props.calculation Object containing the data used for calculation
 * @returns 
 */
const Creditform = ( props: {
   user: User,
   company: Company,
   invoiceData: InvoiceSettings,
   calculation: Calculations
  } ) => {
  const [ tokenstobuy, setTokenstobuy ] = useState( 0 );
  const [ calculator ] = useState(new TokenCalculator(props.calculation));
  const stripe = useStripe();
  const router = useRouter();
  
  /**
   * Calculates saved amount of money for the selected tokens
   * @returns Saved amount as number
   */
  const calculateSavings = () => {
    const reduced = props.calculation.products[tokenstobuy].price;
    const before = props.calculation.products[tokenstobuy].price/ (1 - props.calculation.products[tokenstobuy].discount/100);
    return before - reduced;
  }

  /**
   * Calculates the mails that can be written with the selected amount of tokens
   * @returns Amount of writeable mails as number
   */
  /*const possibleMails = () => {
    return calculator.indexToCredits(tokenstobuy);
  }*/

  /**
   * Calculates the saved hours with the selected amount of tokens
   * @returns Saved hours as number
   */
  /*const calculateHours = () => {
    return Math.floor((possibleMails() * props.calculation.savedMinutesProMail)/60);
  }*/

  /**
   * Get an AssistantCost Object by the given id from the calculation object
   * @param id Id des AssistantCost objects
   * @returns Assistantobject
   */
  const assistantCostById = (id: string): AssistantCost => {
    const indx = props.calculation.assistantcost.findIndex((obj) => {
      return obj.id == id;
    })

    if(indx != -1){
      return props.calculation.assistantcost[indx];
    }else{
      return {
        id: "UNDEFINED",
        perUnit: 0
      }
    }
  }


  const toPossibleUnits = (cost: AssistantCost) => {
    return Math.round(calculator.indexToPrice(tokenstobuy) / cost.perUnit);
  }

  /**
   * Function to be called if the user seeks to pay the select amount of tokens
   * @returns Promise to resolve if the payment was issued
   */
  const onPayment = async () => {
    try {
      if (!stripe) return null;
    } catch (error) {
      console.log(error);
    }

    /**
     * Create a new order object with the API
     */
    const { data } = await axios.post("/api/payment/checkout", {
      price: props.calculation.products[tokenstobuy].price,
      email: props.user.email
    });

    // Get the current orders of the user
    const currentOrders = props.company.orders;
    // Calculate the next invoice number
    const nextInvoiceNumber = props.invoiceData.last_used_number+1;

    // Create a new order object
    const newOrder: Order = {
      id: data.message,
      timestamp: Math.floor( Date.now() / 1000 ),
      tokens: calculator.indexToTokens(tokenstobuy),
      amount: props.calculation.products[tokenstobuy].price,
      method: "Stripe",
      state: "awaiting_payment",
      type: "single_payment",
      invoiceId: `SM${props.invoiceData.number_offset + nextInvoiceNumber}`
    }

    // Add the created order to the customers orders
    currentOrders.push( newOrder );

    // Update the users company and the settings with the used invoice number
    await updateData( "Company", props.user.Company, { orders: currentOrders } );
    await updateData( "Settings", "Invoices", { last_used_number: nextInvoiceNumber } );

    // Redirect the user to the stripe checkout page
    const result = await stripe.redirectToCheckout({
      sessionId: data.message
    });
    if (result.error) {
      console.log(result.error.message);
    }
  }

  return (
    <div className={styles.cardrow}>
      <div className={styles.cardcol}>
        <div className={styles.headline}>
          <h1 className={styles.mainheadline}>Konto aufladen</h1>
          <div className={styles.subheadline}>Bis zu 35% sparen!</div>
        </div>
        <div className={styles.cards}>
          <Card className={styles.quoatacard} bordered={true}>
            <div className={styles.tokenrow}>
              <div className={styles.tokens}>{toGermanCurrencyString(calculator.indexToPrice(tokenstobuy))}</div>
              <div className={styles.tokeninfo}>Dein ausgewähltes Volumen</div>
            </div>
            <Form>
              <Form.Item className={styles.tokenslideritem} name={"tokenamount"}>
                <Slider
                  className={styles.tokenslider}
                  defaultValue={0}
                  max={props.calculation.products.length-1}
                  step={1}
                  tooltip={{ formatter: null }}
                  onChange={
                    ( val ) => {
                      setTokenstobuy( val )
                    }
                  }/>
              </Form.Item>
            </Form>
            <div className={styles.details}>
              <div className={styles.specialdetail}>Deine Ersparnis: <span className={styles.detailhighlight}>
                {toGermanCurrencyString( calculateSavings() )} ({props.calculation.products[tokenstobuy].discount} %)
              </span></div>
              {/*<div className={styles.singledetail}>Zeitersparnis: <span className={styles.detailunhighlighted}>{calculateHours()} Stunden</span></div>
              <div className={styles.singledetail}>
                Arbeitskosten bei 45,00 € je Std. 
                <span className={`${styles.detailunhighlighted}`}>
                  {toGermanCurrencyString(calculateHours() * 45)}
                </span>
              </div>*/}
            </div>
          </Card>

          <Card className={styles.equalscard}>
            <div className={styles.equalstext}>Das entspricht...</div>
            <div className={styles.equalssubheadline}>Das bekommst Du für Dein Budget</div>
            <table className={styles.costtable}>
              <thead>
                <tr>
                  <td className={styles.assistanttext}></td>
                  <td className={styles.assistantprice}>Einzelpreis</td>
                  <td className={styles.assistantprice}>Anzahl</td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={styles.assistanttext}>E-Mail Textvorschläge</td>
                  <td className={styles.assistantprice}>{toGermanCurrencyString(assistantCostById("monolog").perUnit)}</td>
                  <td className={styles.assistantprice}>{toPossibleUnits(assistantCostById("monolog"))}</td>
                </tr>
                <tr>
                  <td className={styles.assistanttext}>E-Mail Antworten</td>
                  <td className={styles.assistantprice}>{toGermanCurrencyString(assistantCostById("dialog").perUnit)}</td>
                  <td className={styles.assistantprice}>{toPossibleUnits(assistantCostById("dialog"))}</td>
                </tr>
                <tr>
                  <td className={styles.assistanttext}>Supportanfragen Excel</td>
                  <td className={styles.assistantprice}>{toGermanCurrencyString(assistantCostById("excel").perUnit)}</td>
                  <td className={styles.assistantprice}>{toPossibleUnits(assistantCostById("excel"))}</td>
                </tr>
              </tbody>
            </table>
          </Card>
        </div>

        <div className={styles.buyrow}>
          <div className={styles.buybuttonrow}>
            <div className={styles.buybutton}>
              <FatButton onClick={async () => {
                onPayment()
              }} text="Bezahlen"></FatButton>
                
            </div>

            <div className={styles.buybutton}>
              <FatButton onClick={() => {
                router.push( "usage" )
              }} type="default" text="Zurück zur Übersicht"></FatButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Creditform;
