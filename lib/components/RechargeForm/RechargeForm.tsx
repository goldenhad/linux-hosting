import { Card, Form, Input, Popover, Slider } from "antd";
import {
  InfoCircleOutlined
} from "@ant-design/icons";
import styles from "./rechargeform.module.scss"
import { useEffect, useState } from "react";
import { TokenCalculator, toGermanCurrencyString } from "../../../lib/helper/price";
import { useStripe } from "@stripe/react-stripe-js";
import axios from "axios";
import { Company, Plan } from "../../../lib/firebase/types/Company";
import { User } from "../../../lib/firebase/types/User";
import { Role } from "../../../lib/firebase/types/Role";
import updateData from "../../../lib/firebase/data/updateData";
import { Calculations } from "../../../lib/firebase/types/Settings";
import FatButton from "../FatButton";


/**
 * Auto recharge form. User can use this component to add an automatic credit recharge if the credits of the company reach a certain threshold
 * @param props.defaultstate.treshold Predefined threshold after which the recharge kicks in
 * @param props.defaultstate.product Index of the predefined recharge credit package
 * @param props.company Company object of the user
 * @param props.user User object
 * @param props.role Role object of the user
 * @param props.calculations Calculation Object
 * @param props.onCustomerApprove Function to be called if the customer establishes the auto recharge
 * @returns RechargeForm
 */
const RechargeForm = ( props: { 
  defaultstate: { threshold: number, product: number },
  company: Company,
  user: User,
  role: Role,
  calculations: Calculations,
  onCustomerApprove: () => void
} ) => {
  const [ tokenstobuy, setTokenstobuy ] = useState( 0 );
  const stripe = useStripe();
  const [form] = Form.useForm();
  const [ calculator ] = useState(new TokenCalculator(props.calculations));

  /**
   * Calculate the saved amount of money for the selected credit package
   * @returns Saved amount of money as number
   */
  const calculateSavings = () => {
    const reduced = props.calculations.products[tokenstobuy].price;
    const before = props.calculations.products[tokenstobuy].price/ (1 - (props.calculations.products[tokenstobuy].discount + props.calculations.autoDiscountPercent)/100);
    return before - reduced;
  }

  /**
   * Calculate the amount of writeable mails for the selected credit package
   * @returns Amount of writeable mails as number
   */
  /*const possibleMails = () => {
    return calculator.indexToCredits(tokenstobuy, true);
  }*/

  /**
   * Calculates the saved hours with the selected amount of tokens
   * @returns Saved hours as number
   */
  /*const calculateHours = () => {
    return Math.floor((possibleMails() * props.calculations.savedMinutesProMail)/60);
  }*/

  /**
   * Effect used to set the default state of the form with the previous selected plan
   * of the customer
   */
  useEffect(() => {
    if(props.company.plan && props.company.plan.state == "active"){
      form.setFieldValue("threshold", props.defaultstate.threshold);
      form.setFieldValue("tokenamount", props.defaultstate.product);
      setTokenstobuy(props.defaultstate.product);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props, props.company, props .defaultstate]);


  /**
   * Helper function to action the form to it's default state
   */
  const resetForm = () => {
    form.setFieldValue("threshold", 10);
    form.setFieldValue("tokenamount", 0);
  }

  /**
   * Function to be called after the customer tries to create the recharge plan
   * @returns Promise to resolve after the plan is activated
   */
  const onCreatePlan = async () => {
    try {
      // Evaluate if stripe is defined, if not stop right here
      if (!stripe) return null;
    } catch (error) {
      console.log(error);
    }

    // Check if the users company already has a stripe customer id
    if(!props.company.customerId){
      // Create a stripe customer
      const { data } = await axios.post("/api/payment/createcustomer", {
        name: (props.role.isCompany)? props.company.name: `${props.user.firstname} ${props.user.lastname}`,
        email: props.user.email,
        address: {
          city: props.company.city,
          street: props.company.street,
          postalcode: props.company.postalcode
        }
      });

      // Update the users company with the customer id returned by the API
      await updateData( "Company", props.user.Company, { customerId: data.message } );
      
      //props.onCustomerApprove();
    }
    // Parse the user input threshold
    const thresholdAsNumber = parseFloat(form.getFieldValue("threshold"));
    if(isNaN(thresholdAsNumber)){
      return null;
    }

    // Create a plan object with the user input
    const newplan: Plan = {
      product: tokenstobuy,
      timestamp: Math.floor( Date.now() / 1000 ),
      state: "active",
      threshold: thresholdAsNumber
    }

    // Update the users company with the new plan
    await updateData( "Company", props.user.Company, { plan: newplan } );
    // Call the given onCustomerApprove function afterwards
    props.onCustomerApprove();
    // Reset the form to the default state
    resetForm();
  }

  /**
   * Function to be called if the user deactivates their plan
   */
  const onDeactivate = async () => {
    // Check if users company has a defined plan
    if(props.company.plan && props.company.plan.state == "active"){
      // Set the plan inactive
      const newplan = props.company.plan;
      newplan.state = "inactive";
      // Update the users company with the inactive plan
      await updateData( "Company", props.user.Company, { plan: newplan } );
      // Call onCustomerApprove callback
      props.onCustomerApprove();
      // Reset the form
      setTokenstobuy(0);
      resetForm();
    }
  }

  return (
    <Form layout="vertical" initialValues={
      (props.company.plan && props.company.plan.state == "active")? { 
        
      }: { 
        "threshold": 10 
      }
    } form={form} onFinish={async () => {
      onCreatePlan();
    }}>
      <div className={styles.cardrow}>
        <Form.Item className={styles.formpart} label={
          <b>
            Grenze
            <Popover content={"Die Grenzeinstellung bestimmt, dass neue Credits automatisch hinzugefügt werden, "+
            "sobald dein Budget einen festgelegten Wert unterschreitet."} placement="top" title="Details">
              <span className={styles.tokeninformationicon}><InfoCircleOutlined /></span>
            </Popover>
          </b>
        } name="threshold" 
        rules={[
          () => ( {
            validator( _, value ) {
              if(props.company.plan && props.company.plan.state == "active"){
                if( value == "" ){
                  return Promise.reject( new Error( "Eine Grenze muss definiert sein!" ) );
                }
              }
              return Promise.resolve();
            }
          } )
        ]}>
          <Input className={styles.forminput} type="number"/>
        </Form.Item>
        <Card className={styles.quoatacard} bordered={true}>
          <div className={styles.tokenrow}>
            <div className={styles.tokens}>{toGermanCurrencyString(calculator.indexToPrice(tokenstobuy))}</div>
            <div className={styles.tokeninfo}>Dein ausgewähltes Volumen</div>
          </div>
        
          <Form.Item className={styles.tokenslideritem} name={"tokenamount"}>
            <Slider
              className={styles.tokenslider}
              defaultValue={0}
              max={props.calculations.products.length-1}
              step={1}
              tooltip={{ formatter: null }}
              onChange={
                ( val ) => {
                  setTokenstobuy( val )
                }
              }/>
          </Form.Item>
          <div className={styles.details}>
            <div className={styles.specialdetail}>Deine Ersparnis: <span className={styles.detailhighlight}>
              {toGermanCurrencyString( calculateSavings() )} ({props.calculations.products[tokenstobuy].discount} %)
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

        <div className={styles.buyrow}>
          <div className={styles.buybuttonrow}>
            <div className={styles.buybutton}>
              <FatButton isSubmitButton={true} text={
                (props.company.plan && props.company.plan.state == "active")? "Aufladen anpassen": "Aufladen aktivieren"
              }></FatButton>
            </div>

            {(props.company.plan && props.company.plan.state == "active")? <div className={styles.buybutton}>
              <FatButton
                type="default"
                text={"Aufladen deaktivieren"}
                onClick={async () => {
                  onDeactivate();
                }}
              ></FatButton>
            </div>: <></>}
          </div>
        </div>

      </div>
    </Form>
  );
}

export default RechargeForm;