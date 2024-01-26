import { Card, Divider, Form, Input, Popover, Slider } from "antd";
import {
  InfoCircleOutlined
} from "@ant-design/icons";
import styles from "./rechargeform.module.scss"
import { useEffect, useState } from "react";
import { convertToCurrency } from "../../helper/architecture";
import { TokenCalculator } from "../../helper/price";
import { useStripe } from "@stripe/react-stripe-js";
import axios from "axios";
import { Company, Plan } from "../../firebase/types/Company";
import { User } from "../../firebase/types/User";
import { Role } from "../../firebase/types/Role";
import updateData from "../../firebase/data/updateData";
import { Calculations } from "../../firebase/types/Settings";
import FatButton from "../FatButton";


const RechargeForm = ( props: { 
  defaultstate: { threshold: number, product: number },
  company: Company,
  user: User,
  role: Role,
  onCustomerApprove,
  calculations: Calculations 
} ) => {
  const [ tokenstobuy, setTokenstobuy ] = useState( 0 );
  const stripe = useStripe();
  const [form] = Form.useForm();
  const [ calculator ] = useState(new TokenCalculator(props.calculations));

  const calculateSavings = () => {
    const reduced = props.calculations.products[tokenstobuy].price;
    const before = props.calculations.products[tokenstobuy].price/ (1 - (props.calculations.products[tokenstobuy].discount + props.calculations.autoDiscountPercent)/100);
    return before - reduced;
  }

  const possibleMails = () => {
    return calculator.indexToCredits(tokenstobuy, true);
  }

  const calculatePricePerMail = () => {
    return props.calculations.products[tokenstobuy].price / possibleMails();
  }

  useEffect(() => {
    if(props.company.plan && props.company.plan.state == "active"){
      form.setFieldValue("threshold", props.defaultstate.threshold);
      form.setFieldValue("tokenamount", props.defaultstate.product);
      setTokenstobuy(props.defaultstate.product);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props, props.company, props .defaultstate]);


  const resetForm = () => {
    form.setFieldValue("threshold", 10);
    form.setFieldValue("tokenamount", 0);
  }

  const onPayment = async () => {
    try {
      if (!stripe) return null;
    } catch (error) {
      console.log(error);
    }

    if(!props.company.customerId){
      const { data } = await axios.post("/api/payment/createcustomer", {
        name: (props.role.isCompany)? props.company.name: `${props.user.firstname} ${props.user.lastname}`,
        email: props.user.email,
        address: {
          city: props.company.city,
          street: props.company.street,
          postalcode: props.company.postalcode
        }
      });

      await updateData( "Company", props.user.Company, { customerId: data.message } );
      props.onCustomerApprove();
    }

    const thresholdAsNumber = parseInt(form.getFieldValue("threshold"));
    if(isNaN(thresholdAsNumber)){
      return null;
    }

    const newplan: Plan = {
      product: tokenstobuy,
      timestamp: Math.floor( Date.now() / 1000 ),
      state: "active",
      threshold: thresholdAsNumber
    }

    console.log(newplan);


    await updateData( "Company", props.user.Company, { plan: newplan } );
    props.onCustomerApprove();
    resetForm();
  }

  const onDeactivate = async () => {
    console.log("deactivating");
    if(props.company.plan && props.company.plan.state == "active"){
      const newplan = props.company.plan;
      newplan.state = "inactive";

      await updateData( "Company", props.user.Company, { plan: newplan } );
      props.onCustomerApprove();
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
      onPayment();
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
            <div className={styles.tokens}>{calculator.indexToCredits(tokenstobuy, true)}</div>
            <div className={styles.tokeninfo}>Anzahl Credits</div>
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
            <div className={styles.singledetail}>Entspricht: <span className={styles.detailhighlight}>{
              possibleMails()
            } Mails</span></div>
            <div className={styles.singledetail}>Preis je Mail: <span className={styles.detailhighlight}>{convertToCurrency( calculatePricePerMail() )}</span></div>
            <div className={styles.singledetail}>
                Deine Ersparnis:
              <span className={`${styles.detailhighlight} ${(tokenstobuy >= 0)? styles.savingsamount: ""}`}>
                {convertToCurrency( calculateSavings() )} ({Number(props.calculations.products[tokenstobuy].discount) + 5} %)
              </span>
            </div>
          </div>

          <Divider className={styles.tokendivider} />

          <div className={styles.summary}>
            <div className={styles.summarytext}>Gesamtpreis</div>
            <div className={styles.summarysum}>{convertToCurrency( props.calculations.products[tokenstobuy].price )}</div>
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