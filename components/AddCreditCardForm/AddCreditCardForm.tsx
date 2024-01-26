import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { Form, Button } from "antd"
import styles from "./addcreditcardform.module.scss"
import axios from "axios";
import { Company, PaymentMethod } from "../../firebase/types/Company";
import Stripe from "stripe";
import updateData from "../../firebase/data/updateData";
import { User } from "../../firebase/types/User";
import { useState } from "react";


const AddCreditCardForm = ( props: { company: Company, user: User, reddirectURL: string, onSuccess, messageApi } ) => {
  const elements = useElements();
  const stripe = useStripe();
  const [ loading, setLoading ] = useState(false);
  const [form] = Form.useForm();


  const addPaymentMethod = async () => {
    setLoading(true);

    const card = elements.getElement("card");
    if (!stripe || !card) return null;

    try{
      let companyCustomerId = props.company.customerId;
      if(!props.company.customerId){        
        const { data } = await axios.post("/api/payment/createcustomer", {
          name: (props.company.name != "")? props.company.name: `${props.user.firstname} ${props.user.lastname}`,
          email: props.user.email,
          address: {
            city: props.company.city,
            street: props.company.street,
            postalcode: props.company.postalcode
          }
        });

        console.log(data.message);

        const customerid = data.message;
        companyCustomerId = customerid;
        await updateData("Company", props.user.Company , { customerId: customerid });
      }
      console.log(companyCustomerId);
      const createsetupintent = await axios.post("/api/payment/createsetup", {
        customer: companyCustomerId
      })

      const confirm = await stripe.confirmCardSetup(createsetupintent.data.message, {
        payment_method: {
          card: card
        }
      });

      if(!confirm.error){

        const finish = await axios.post("/api/payment/finishsetup", {
          setupintent: confirm.setupIntent.id,
          customer: companyCustomerId
        });


        if(finish.status == 200){
          const setupintent: Stripe.SetupIntent = finish.data.intent;

          const methods: Array<PaymentMethod> = [{
            id: setupintent.id,
            name: "Kreditkarte",
            type: "card",
            default: false,
            methodId: setupintent.payment_method as string,
            lastState: "init"
          }]

          const res = await updateData("Company", props.user.Company, { paymentMethods: methods })
          if(res.error){
            props.messageApi.error("Beim Aktualisieren deiner Zahlungsdaten ist ein Fehler aufgetreten!")
          }else{
            props.onSuccess();
            card.clear();
            form.resetFields();
          }
            
        }else{
          console.log("setup not found!");
        }
      }else{
        props.messageApi.error("Beim Aktualisieren deiner Zahlungsdaten ist ein Fehler aufgetreten!")
      }
    }catch(e){
      props.messageApi.error("Beim Aktualisieren deiner Zahlungsdaten ist ein Fehler aufgetreten!")
    }
    
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

        {/* <Form.Item label={"Interner Name"} className={styles.formpart} name={"cardname"}>
          <Input className={styles.forminput}></Input>
        </Form.Item> */}

        {/* <p>Rechnungsadresse</p>

        <Form.Item label={"Straße"} className={styles.formpart} name={"street"}>
          <Input className={styles.forminput}></Input>
        </Form.Item>

        <Form.Item label={"PLZ"} className={styles.formpart} name={"postalcode"}>
          <Input className={styles.forminput}></Input>
        </Form.Item>

        <Form.Item label={"Ort"} className={styles.formpart} name={"city"}>
          <Input className={styles.forminput}></Input>
        </Form.Item> */}

        {/* <Form.Item className={styles.formswitch} name={"default"}>
          <Switch onChange={(checked) => {
            setIsDefault(checked)
          }}></Switch>
          <p>Als Standard Bezahlmethode aktivieren</p>
        </Form.Item> */}

        <div className={styles.addbuttonrow}>
          <Button className={styles.addpaymentbutton} type='primary' htmlType="submit" loading={loading}>Hinzufügen</Button>
        </div>
      </Form>

      
    </div>
  )
}

export default AddCreditCardForm;