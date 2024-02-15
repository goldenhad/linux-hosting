import { Button, Card, Divider, Form, Slider } from "antd";
import styles from "./creditform.module.scss";
import { TokenCalculator } from "../../helper/price";
import { useState } from "react";
import { convertToCurrency } from "../../helper/architecture";
import { useStripe } from "@stripe/react-stripe-js";
import axios from "axios";
import { useRouter } from "next/router";
import { User } from "../../firebase/types/User";
import { Company, Order } from "../../firebase/types/Company";
import { Calculations, InvoiceSettings } from "../../firebase/types/Settings";
import updateData from "../../firebase/data/updateData";


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
  const possibleMails = () => {
    return calculator.indexToCredits(tokenstobuy);
  }

  /**
   * Calculates the saved hours with the selected amount of tokens
   * @returns Saved hours as number
   */
  const calculateHours = () => {
    return Math.floor((possibleMails() * props.calculation.savedMinutesProMail)/60);
  }

  /**
   * Calculates the cost per mails for the selected tokens
   * @returns The cost per mail as number
   */
  const calculatePricePerMail = () => {
    return props.calculation.products[tokenstobuy].price / possibleMails();
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
      <div className={styles.headline}>
        <h1 className={styles.mainheadline}>Credits Kaufen</h1>
        <div className={styles.subheadline}>Bis zu 35% sparen!</div>
      </div>
      <Card className={styles.quoatacard} bordered={true}>
        <div className={styles.tokenrow}>
          <div className={styles.tokens}>{calculator.indexToCredits(tokenstobuy)}</div>
          <div className={styles.tokeninfo}>Anzahl Credits</div>
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
          <div className={styles.singledetail}>Entspricht: <span className={styles.detailhighlight}>{
            possibleMails()
          } Mails</span></div>
          <div className={styles.singledetail}>Preis je Mail: <span className={styles.detailhighlight}>{convertToCurrency( calculatePricePerMail() )}</span></div>
          <div className={styles.singledetail}>
                Deine Ersparnis:
            <span className={`${styles.detailhighlight} ${(tokenstobuy > 0)? styles.savingsamount: ""}`}>
              {convertToCurrency( calculateSavings() )} ({props.calculation.products[tokenstobuy].discount} %)
            </span>
          </div>
        </div>

        <Divider className={styles.tokendivider} />

        <div className={styles.summary}>
          <div className={styles.summarytext}>Gesamtpreis</div>
          <div className={styles.summarysum}>{convertToCurrency( props.calculation.products[tokenstobuy].price )}</div>
        </div>
      </Card>

      <div className={styles.buyrow}>
        <div className={styles.checkout}>
          <Divider className={styles.tokendivider} />
          <div className={styles.checkoutheadline}>Deine Ersparnis</div>
          <div className={styles.savings}>
            <div className={styles.singlesaving}>Zeitersparnis im Monat: <span className={styles.savinghighlight}>{calculateHours()} Stunden</span></div>
            <div className={styles.singlesaving}>Arbeitskosten: {convertToCurrency( calculateHours() * 45 )} (Bei 45,- EUR je Std.)</div>
          </div>
        </div>

        <div className={styles.buybuttonrow}>
          <div className={styles.buybutton}>
            <Button onClick={async () => {
              onPayment()
            }}>Bezahlen</Button>
                
          </div>

          <div className={styles.buybutton}>
            <Button onClick={() => {
              router.push( "usage" )
            }} className={styles.buynow}>Zurück zur Übersicht</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Creditform;
