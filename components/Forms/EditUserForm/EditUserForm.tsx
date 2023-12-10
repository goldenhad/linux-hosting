import { Form, FormInstance, Input } from "antd";
import React from "react";
import styles from "./edituserform.module.scss"
import FatButton from "../../FatButton";
import { usernameExistsAtDifferentUser } from "../../../firebase/auth/userExists";
import updateData from "../../../firebase/data/updateData";
import { onlyUpdateIfSet } from "../../../helper/architecture";
import { MessageInstance } from "antd/es/message/interface";
import { User } from "../../../firebase/types/User";
import { Company } from "../../../firebase/types/Company";


const EditUserForm = (
  props: {
        singleUser: boolean,
        form: FormInstance<any>,
        login: any,
        user: User,
        company: Company,
        messageApi: MessageInstance
    }
) => {

  /**
   * Asynchronous function to be called after the props.user has edited their account information
   */
  async function saveAccountInfo(){
    // Get the input from the form
    const username = props.form.getFieldValue( "username" );
    const firstname = props.form.getFieldValue( "firstname" );
    const lastname = props.form.getFieldValue( "lastname" );
    const street = props.form.getFieldValue( "street" );
    const postalcode = props.form.getFieldValue( "postalcode" );
    const city = props.form.getFieldValue( "city" );

    // Update the data of the props.user if it is defined
    const { error } = await updateData( "props.user", props.login.uid, { 
      username: onlyUpdateIfSet( username, props.user.username ),
      firstname: onlyUpdateIfSet( firstname, props.user.firstname ),
      lastname: onlyUpdateIfSet( lastname, props.user.lastname )
    } );

    if( !error ){
      // Only update the company information if the props.user is not a SingleUser
      if( props.singleUser ){
        // Update the data of the company if it is defined
        await updateData( "Company", props.user.Company, { 
          street: onlyUpdateIfSet( street, props.company.street ),
          postalcode: onlyUpdateIfSet( postalcode, props.company.postalcode ),
          city: onlyUpdateIfSet( city, props.company.city )
        } );
      }

      if( !error ){
        props.messageApi.success("Speichern erfolgreich!")
      }else{
        props.messageApi.error("Speichern fehlgeschlagen, bitte versuche es erneut!")
      }
    }else{
      props.messageApi.error("Speichern fehlgeschlagen, bitte versuche es erneut!")
    }
  }

  if(props.singleUser){
    return(
      <Form layout='vertical' form={props.form} onFinish={() => {
        saveAccountInfo()
      }}>
        <div className={styles.formrow}>
          <Form.Item
            className={styles.formpart}
            name={"username"}
            label="Benutzername"
            rules={[
              () => ( {
                async validator( _, value ) {
                  if( value != "" ){
                    if ( await usernameExistsAtDifferentUser( value, props.login.uid ) ) {
                      return Promise.reject( new Error( "Dieser Benutzername wird bereits verwendet!" ) );
                                          
                    }
                  }
                  return Promise.resolve();
                }
              } )
            ]}
          >
            <Input className={styles.forminput} />
          </Form.Item>
        </div>
  
        <div className={styles.formrow}>
          <Form.Item className={styles.formpart} name={"email"} label="E-Mail">
            <Input className={styles.forminput} disabled/>
          </Form.Item>
        </div>
  
        <div className={`${styles.formrow} ${styles.multiformrow}`}>
          <Form.Item className={styles.formpart} name={"firstname"} label="Vorname">
            <Input className={styles.forminput} />
          </Form.Item>
  
          <Form.Item className={styles.formpart} name={"lastname"} label="Nachname">
            <Input className={styles.forminput} />
          </Form.Item>
        </div>
  
        <FatButton text="Speichern" isSubmitButton={true}/>
      </Form>
    );
  }else{
    return(
      <Form layout='vertical' form={props.form} onFinish={() => {
        saveAccountInfo()
      }}>
        <Form.Item
          className={styles.formpart}
          name={"username"}
          label="Benutzername"
          rules={[
            () => ( {
              async validator( _, value ) {
                if( value != "" ){
                  if ( await usernameExistsAtDifferentUser( value, props.login.uid ) ) {
                    return Promise.reject( new Error( "Dieser Benutzername wird bereits verwendet!" ) );
                                          
                  }
                }
                return Promise.resolve();
              }
            } )
          ]}
        >
          <Input className={styles.forminput} />
        </Form.Item>
  
        <div className={styles.formrow}>
          <Form.Item className={styles.formpart} name={"email"} label="E-Mail">
            <Input className={styles.forminput} disabled/>
          </Form.Item>
        </div>
  
        <div className={`${styles.formrow} ${styles.multiformrow}`}>
          <Form.Item className={styles.formpart} name={"firstname"} label="Vorname">
            <Input className={styles.forminput} />
          </Form.Item>
  
          <Form.Item className={styles.formpart} name={"lastname"} label="Nachname">
            <Input className={styles.forminput} />
          </Form.Item>
        </div>
  
        <div className={`${styles.formrow} ${styles.multiformrow}`}>
          <Form.Item className={styles.formpart} name={"street"} label="Straße">
            <Input className={styles.forminput} />
          </Form.Item>
  
          <Form.Item className={styles.formpart} name={"postalcode"} label="PLZ">
            <Input className={styles.forminput} />
          </Form.Item>
  
          <Form.Item className={styles.formpart} name={"city"} label="Ort">
            <Input className={styles.forminput} />
          </Form.Item>
        </div>
  
        <div className={styles.savebuttonrow}>
          <FatButton isSubmitButton={true} text="Speichern" />
        </div>
      </Form>
    );
  }

  
}

export default EditUserForm;