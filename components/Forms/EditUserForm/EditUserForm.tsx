import { Form, FormInstance, Input } from "antd";
import React, { useEffect, useState } from "react";
import styles from "./edituserform.module.scss"
import FatButton from "../../FatButton";
import { usernameExistsAtDifferentUser } from "../../../firebase/auth/userExists";
import updateData from "../../../firebase/data/updateData";
import { onlyUpdateIfSet } from "../../../helper/architecture";
import { MessageInstance } from "antd/es/message/interface";
import { User } from "../../../firebase/types/User";


const EditUserForm = (
  props: {
        singleUser: boolean,
        // eslint-disable-next-line
        form: FormInstance<any>,
        // eslint-disable-next-line
        login: any,
        user: User,
        messageApi: MessageInstance
    }
) => {
  const [ username, setUsername ] = useState(false);
  const [ firsname, setFirstname ] = useState(false);
  const [ lastname, setLastname ] = useState(false);

  const [ buttonDisabled, setButtonDisabled ] = useState(false);

  useEffect(() => {
    setButtonDisabled(!(username || firsname || lastname));
  }, [firsname, lastname, username])


  /**
   * Asynchronous function to be called after the props.user has edited their account information
   */
  async function saveAccountInfo(){
    // Get the input from the form
    const username_default = props.form.getFieldValue( "username" );
    const firstname_default = props.form.getFieldValue( "firstname" );
    const lastname_default = props.form.getFieldValue( "lastname" );

    // Update the data of the props.user if it is defined
    const { error } = await updateData( "User", props.login.uid, { 
      username: onlyUpdateIfSet( username_default, props.user.username ),
      firstname: onlyUpdateIfSet( firstname_default, props.user.firstname ),
      lastname: onlyUpdateIfSet( lastname_default, props.user.lastname )
    } );


    if( !error ){
      props.messageApi.success("Speichern erfolgreich!")
    }else{
      props.messageApi.error("Speichern fehlgeschlagen, bitte versuche es erneut!")
    }
  }

  return(
    <Form layout='vertical' form={props.form} onFinish={() => {
      saveAccountInfo();
      setButtonDisabled(true);
      setUsername(false);
      setFirstname(false);
      setLastname(false);
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
                  if( /\s/g.test(value) ){
                    return Promise.reject( new Error( "Der Benutzername darf keine Leerzeichen enthalten!" ) );
                  }else{
                    if ( await usernameExistsAtDifferentUser( value, props.login.uid ) ) {
                      return Promise.reject( new Error( "Dieser Benutzername wird bereits verwendet!" ) );               
                    }

                    return Promise.resolve();
                  }
                }else{
                  return Promise.reject( new Error( "Der Benutzername darf nicht leer sein!" ) );
                }
              }
            } )
          ]}
        >
          <Input className={styles.forminput} onChange={(event) => {
            if(event.target.value != props.user.username ){
              setUsername(true);
            }else{
              setUsername(false);
            }
          }} />
        </Form.Item>
      </div>

      <div className={styles.formrow}>
        <Form.Item className={styles.formpart} name={"email"} label="E-Mail">
          <Input className={styles.forminput} disabled/>
        </Form.Item>
      </div>

      <div className={`${styles.formrow} ${styles.multiformrow}`}>
        <Form.Item className={styles.formpart} name={"firstname"} label="Vorname">
          <Input className={styles.forminput} onChange={(event) => {
            if(event.target.value != props.user.firstname ){
              setFirstname(true);
            }else{
              setFirstname(false);
            }
          }} />
        </Form.Item>

        <Form.Item className={styles.formpart} name={"lastname"} label="Nachname">
          <Input className={styles.forminput} onChange={(event) => {
            if(event.target.value != props.user.lastname ){
              setLastname(true);
            }else{
              setLastname(true);
            }
          }} />
        </Form.Item>
      </div>

      <FatButton text="Speichern" isSubmitButton={true} disabled={
        buttonDisabled
      }/>
    </Form>
  );
}

export default EditUserForm;