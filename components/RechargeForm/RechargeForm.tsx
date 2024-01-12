import { Button, Card, Divider, Form, Input, Popover, Slider } from "antd";
import {
  InfoCircleOutlined
} from "@ant-design/icons";
import styles from "./rechargeform.module.scss"
import { useEffect, useState } from "react";
import { convertToCurrency, normalizeTokens } from "../../helper/architecture";
import { calculateTokens, mailPriceMapping } from "../../helper/price";
import { useElements, useStripe } from "@stripe/react-stripe-js";
import axios from "axios";
import { Company, Plan } from "../../firebase/types/Company";
import { User } from "../../firebase/types/User";
import { Role } from "../../firebase/types/Role";
import updateData from "../../firebase/data/updateData";


const RechargeForm = ( props: { defaultstate: { threshold: number, tokens: number }, company: Company, user: User, role: Role, onCustomerApprove } ) => {
  const [ tokenstobuy, setTokenstobuy ] = useState( 0 );
  const stripe = useStripe();
  const elements = useElements();
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  useEffect(() => {
    if(props.company.plan && props.company.plan.state == "active"){
      editForm.setFieldValue("threshold", props.defaultstate.threshold);
      editForm.setFieldValue("tokenamount", props.defaultstate.tokens);
    }
  }, [props]);


  const resetForm = () => {
    editForm.setFieldValue("threshold", 10);
    editForm.setFieldValue("tokenamount", 0);
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

    

    const newplan: Plan = {
      tokens: calculateTokens(tokenstobuy),
      timestamp: Math.floor( Date.now() / 1000 ),
      state: "active",
      amount: mailPriceMapping[tokenstobuy],
      threshold: form.getFieldValue("threshold")
    }


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
      resetForm();
    }
  }

  const FormElement = () => {
    if(props.company.plan && props.company.plan.state == "active"){

      return(
        <Form layout="vertical" form={editForm}>
          <Form.Item className={styles.formpart} label={
            <b>
                Grenze
              <Popover content={"Die Grenzeinstellung bestimmt, dass neue Credits automatisch hinzugefügt werden, "+
                "sobald dein Budget einen festgelegten Wert unterschreitet."} placement="top" title="Details">
                <span className={styles.tokeninformationicon}><InfoCircleOutlined /></span>
              </Popover>
            </b>
          } name="threshold" rules={[{ required: true, message: "Eine Grenze muss definiert werden!" }]}>
            <Input className={styles.forminput} type="number"/>
          </Form.Item>

          <Card className={styles.quoatacard} bordered={true}>
            <div className={styles.tokenrow}>
              <div className={styles.tokens}>{normalizeTokens(calculateTokens(tokenstobuy)).toFixed(0)}</div>
              <div className={styles.tokeninfo}>Anzahl Credits</div>
            </div>
            <Form.Item className={styles.tokenslideritem} name={"tokenamount"}>
              <Slider
                className={styles.tokenslider}
                max={6}
                step={1}
                tooltip={{ formatter: null }}
                onChange={
                  ( val ) => {
                    setTokenstobuy( val )
                  }
                }/>
            </Form.Item>
            <Divider className={styles.tokendivider} />
        
            <div className={styles.summary}>
              <div className={styles.summarytext}>Gesamtpreis</div>
              <div className={styles.summarysum}>{convertToCurrency( mailPriceMapping[tokenstobuy] )}</div>
            </div>
          </Card>

          <Divider className={styles.tokendivider} />
      
          <div className={styles.buybuttonrow}>
            <div className={styles.buybutton}>
              <Button type="primary" onClick={async () => {
                onPayment()
              }}>Aufladen aktualisieren</Button>
                
            </div>
            <div className={styles.buybutton}>
              <Button onClick={async () => {
                onDeactivate()
              }}>Aufladen deaktivieren</Button>
                
            </div>
          </div>
        </Form>
      );
    }else{
      return(
        <Form layout="vertical" initialValues={{ "threshold": 10 }} form={form}>
          <Form.Item className={styles.formpart} label={
            <b>
                Grenze
              <Popover content={"Die Grenzeinstellung bestimmt, dass neue Credits automatisch hinzugefügt werden, "+
                "sobald dein Budget einen festgelegten Wert unterschreitet."} placement="top" title="Details">
                <span className={styles.tokeninformationicon}><InfoCircleOutlined /></span>
              </Popover>
            </b>
          } name="threshold" rules={[{ required: true, message: "Eine Grenze muss definiert werden!" }]}>
            <Input className={styles.forminput} type="number"/>
          </Form.Item>

          <Card className={styles.quoatacard} bordered={true}>
            <div className={styles.tokenrow}>
              <div className={styles.tokens}>{normalizeTokens(calculateTokens(tokenstobuy)).toFixed(0)}</div>
              <div className={styles.tokeninfo}>Anzahl Credits</div>
            </div>
            <Form.Item className={styles.tokenslideritem} name={"tokenamount"}>
              <Slider
                className={styles.tokenslider}
                defaultValue={0}
                max={6}
                step={1}
                tooltip={{ formatter: null }}
                onChange={
                  ( val ) => {
                    setTokenstobuy( val )
                  }
                }/>
            </Form.Item>
            <Divider className={styles.tokendivider} />
        
            <div className={styles.summary}>
              <div className={styles.summarytext}>Gesamtpreis</div>
              <div className={styles.summarysum}>{convertToCurrency( mailPriceMapping[tokenstobuy] )}</div>
            </div>
          </Card>

          <Divider className={styles.tokendivider} />
      
          <div className={styles.buybuttonrow}>
            <div className={styles.buybutton}>
              <Button onClick={async () => {
                onPayment()
              }}>Aufladen aktivieren</Button>
                
            </div>
          </div>
        </Form>
      );
    }
  }

  return(
    <FormElement />
  );
}

export default RechargeForm;