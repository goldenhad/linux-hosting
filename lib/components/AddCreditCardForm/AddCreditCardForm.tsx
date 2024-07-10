import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { Form, Button } from "antd"
import styles from "./addcreditcardform.module.scss"
import axios from "axios";
import { Company, PaymentMethod } from "../../../lib/firebase/types/Company";
import Stripe from "stripe";
import updateData from "../../../lib/firebase/data/updateData";
import { User } from "../../../lib/firebase/types/User";
import { useState } from "react";
import { MessageInstance } from "antd/es/message/interface";

/**
 * Component for handling stripe credit card payments
 * @param props.company Object containing the company information
 * @param props.user Object containing the user
 * @param props.onSuccess Function to be called if the addition of the card was successfull
 * @param props.messageApi Object used for sending messages to the user
 * @constructor
 */
const AddCreditCardForm = ( props: { company: Company, user: User, onSuccess: () => void, messageApi: MessageInstance  } ) => {
  const elements = useElements();
  const stripe = useStripe();
  const [ loading, setLoading ] = useState(false);
  const [form] = Form.useForm();

  /**
   * Tries to add a new payment method to the user
   */
  const addPaymentMethod = async () => {
    // Enable loading animation for the 'hinzufügen'-Button
    setLoading(true);

    const card = elements.getElement("card");
    // If we can't find the element or stripe is undefined return directly
    if (!stripe || !card) return null;

    try{
      let companyCustomerId = props.company.customerId;

      // Check if the user has already got an ID from stripe
      if(!props.company.customerId){     
        // If the user does not a have an ID...
        // Call the api and request the creation of a new stripe customer   
        const { data } = await axios.post("/api/payment/createcustomer", {
          name: (props.company.name != "")? props.company.name: `${props.user.firstname} ${props.user.lastname}`,
          email: props.user.email,
          address: {
            city: props.company.city,
            street: props.company.street,
            postalcode: props.company.postalcode
          }
        });

        // The API will return the id of the newly created customer in the message member
        const customerid = data.message;
        companyCustomerId = customerid;
        await updateData("Company", props.user.Company , { customerId: customerid });
      }
      
      // With the customerID of the user call the API to create a setup
      const createsetupintent = await axios.post("/api/payment/createsetup", {
        customer: companyCustomerId
      })

      // We pass the client secret from the API call to stripe in order to confirm the setupintent
      // In this step we also provide the given card details
      const confirm = await stripe.confirmCardSetup(createsetupintent.data.message, {
        payment_method: {
          card: card
        }
      });

      // Check if the confirmation completed or caused an error
      if(!confirm.error){
        // Call the API to finishe the previously created setupintent
        const finish = await axios.post("/api/payment/finishsetup", {
          setupintent: confirm.setupIntent.id,
          customer: companyCustomerId
        });

        // Check the result of the finish request.
        if(finish.status == 200){
          // Get the created setupintent from our last API call
          const setupintent: Stripe.SetupIntent = finish.data.intent;

          // Create a payment method object, so we can store the users card information
          const methods: Array<PaymentMethod> = [{
            id: setupintent.id,
            name: "Kreditkarte",
            type: "card",
            default: false,
            methodId: setupintent.payment_method as string,
            lastState: "init"
          }]

          // Add the payment method object to the users company
          const res = await updateData("Company", props.user.Company, { paymentMethods: methods })
          if(res.error){
            // If we encounter any error during the update company request, provide an error message
            props.messageApi.error("Beim Aktualisieren deiner Zahlungsdaten ist ein Fehler aufgetreten!")
          }else{
            // If we didn't encounter an error call the onSuccess Callback and clear the card form
            props.onSuccess();
            card.clear();
            form.resetFields();
          }
            
        }else{
          // If the finish request failed, provide the user an error message
          props.messageApi.error("Beim Aktualisieren deiner Zahlungsdaten ist ein Fehler aufgetreten!")
        }
      }else{
        // Error message if the confirmation of the card caused an error
        props.messageApi.error("Beim Aktualisieren deiner Zahlungsdaten ist ein Fehler aufgetreten!")
      }
    }catch(e){
      // Catch any error caused by the card setup process
      props.messageApi.error("Beim Aktualisieren deiner Zahlungsdaten ist ein Fehler aufgetreten!")
    }
    
    // disable the loading of the 'hinzufügen'-button after the prcoess
    setLoading(false);
  }

  return(
    <div>
      <Form form={form} layout="vertical" onFinish={() => {
        addPaymentMethod() 
      }}>
            
        <Form.Item label={"Karteninformationen"} className={styles.formpart}>
          <CardElement />
        </Form.Item>

        <div className={styles.addbuttonrow}>
          <Button className={styles.addpaymentbutton} type='primary' htmlType="submit" loading={loading}>Hinzufügen</Button>
        </div>
      </Form>

      
    </div>
  )
}

export default AddCreditCardForm;