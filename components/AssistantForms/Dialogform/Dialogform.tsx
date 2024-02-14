/* eslint-disable @typescript-eslint/no-explicit-any */
import { Alert, Card, Form, FormInstance, Input, Select } from "antd";
import { listToOptions } from "../../../helper/architecture";
import styles from "./dialogform.module.scss";
import { MutableRefObject, useContext } from "react";
import FatButton from "../../FatButton";
import { AssistantContext } from "../../AssistantBase/AssistantBase";
import { isMobile } from "react-device-detect";
import { ctx } from "../../context/AuthContext";

const { TextArea } = Input;


/**
 * Form used for email dialogs
 * @param props.state Context state of the application
 * @param props.form FormInstance used to interact with the surrounding assistant form
 * @param props.refs Defined refs that will be used by the tutorial to highlight elements
 * @returns Form used for creating reponses to email dialogs
 */
const DialogForm = (props: { 
  state: ctx,
  form: FormInstance<any>,
  refs: { 
    profileRef: MutableRefObject<any>,
    continueRef: MutableRefObject<any>,
    classificationRef: MutableRefObject<any>,
    lengthRef: MutableRefObject<any>,
    generateRef: MutableRefObject<any>,
    addressRef: MutableRefObject<any>,
    dialogRef: MutableRefObject<any>,
    styleref: MutableRefObject<any>,
    emotionsref: MutableRefObject<any>  
  } 
}) => {
  const AssistantContextState = useContext(AssistantContext);
  const form = props.form;


  return(
    <>
      <div className={styles.userinputform}>
        <Card title={"Verlauf"} className={styles.userinputcardmain}>
          <div ref={props.refs.profileRef}>
            <Form.Item
              className={styles.formpart}
              label={<b>Profil</b>}
              name="profile"
              rules={[
                {
                  required: true,
                  message: "Bitte wähle ein Profil aus!"
                }
              ]}
            >
              <Select
                showSearch
                placeholder="Wähle ein Profil aus"
                optionFilterProp="children"
                onSearch={undefined}
                options={AssistantContextState.getProfiles()}
                disabled={AssistantContextState.requestState.formDisabled || AssistantContextState.requestState.quotaOverused}
                className={styles.formselect}
                size='large'
              />
            </Form.Item>
          </div>
                  
          <div ref={props.refs.dialogRef}>
            <Form.Item
              className={styles.formpart}
              label={<b>Bisheriger Dialog</b>}
              name="dialog"
              rules={[
                {
                  required: true,
                  message: "Bitte gib eine erhaltene E-Mail ein!"
                }
              ]}
            >
              <TextArea
                className={styles.forminput}
                rows={(isMobile)? 5: 10}
                placeholder="Bisheriger Dialog..."
                disabled={AssistantContextState.requestState.formDisabled || AssistantContextState.requestState.quotaOverused}
              />
            </Form.Item>
          </div>

          <div ref={props.refs.continueRef}>
            <Form.Item
              className={styles.formpart}
              label={<b>Wie soll der Dialog fortgesetzt werden?</b>}
              name="continue"
              rules={[
                {
                  required: true,
                  message: "Bitte lege fest wie der Dialog fortgesetzt werden soll!"
                }
              ]}
            >
              <TextArea
                className={styles.forminput}
                rows={(isMobile)? 5: 2}
                placeholder="Formuliere kurz, wie der Dialog fortgesetzt werden soll und was du damit erreichen willst?"
                disabled={AssistantContextState.requestState.formDisabled || AssistantContextState.requestState.quotaOverused}/>
            </Form.Item>
          </div>
        </Card>
        <Card title={"Einstellungen"} className={styles.userinputcardsub}>
          <div ref={props.refs.addressRef}>
            <Form.Item
              className={styles.formpart}
              label={<b>Ansprache</b>}
              name="address"
              rules={[
                {
                  required: true,
                  message: "Bitte lege die Ansprache deiner Nachricht fest!"
                }
              ]}
            >
              <Select placeholder="Bitte wähle die Form der Ansprache aus..." options={listToOptions( props.state.parameters.address )}
                className={styles.formselect}
                size='large'
                disabled={AssistantContextState.requestState.formDisabled || AssistantContextState.requestState.quotaOverused}
              />
            </Form.Item>
          </div>

          <div ref={props.refs.classificationRef}>
            <Form.Item className={styles.formpart} label={<b>Einordnung des Gesprächspartners (maximal 3)</b>} name="order"
              rules={[
                () => ( {
                  validator( _, value ) {
                    if(value){
                      if( value.length > 3 ){
                        form.setFieldValue( "order", value.slice( 0, 3 ) )
                      }
                    }
                    return Promise.resolve();
                  }
                } ),
                {
                  required: true,
                  message: "Bitte schätze deinen Gesprächspartner ein!"
                }
              ]}
            >
              <Select
                placeholder="Wie ordnest du deinen Gesprächpartner ein?"
                options={listToOptions( props.state.parameters.motives )}
                mode="multiple"
                allowClear
                className={styles.formselect}
                size='large'
                disabled={AssistantContextState.requestState.formDisabled || AssistantContextState.requestState.quotaOverused}
              />
            </Form.Item>
          </div>

          <div ref={props.refs.styleref}>
            <Form.Item className={styles.formpart} label={<b>Stil (maximal 3)</b>} name="style"
              rules={[
                () => ( {
                  validator( _, value ) {
                    if(value){
                      if( value.length > 3 ){
                        form.setFieldValue( "style", value.slice( 0, 3 ) )
                      }
                    }
                    return Promise.resolve();
                  }
                } ),
                {
                  required: true,
                  message: "Bitte lege den Stil der Antwort fest!"
                }
              ]}
            >
              <Select
                placeholder="Welchen Stil soll die Antwort haben?"
                options={listToOptions( props.state.parameters.style )}
                mode="multiple"
                allowClear
                className={styles.formselect}
                size='large'
                disabled={AssistantContextState.requestState.formDisabled || AssistantContextState.requestState.quotaOverused}
              />
            </Form.Item>
          </div>

          <div ref={props.refs.emotionsref}>
            <Form.Item className={styles.formpart} label={<b>Emotionen (maximal 3)</b>} name="emotions"
              rules={[
                () => ( {
                  validator( _, value ) {
                    if(value){
                      if( value.length > 3 ){
                        form.setFieldValue( "emotions", value.slice( 0, 3 ) )
                      }
                    }
                    return Promise.resolve();
                  }
                } ),
                {
                  required: true,
                  message: "Bitte lege die Emotionen der Antwort fest!"
                }
              ]}
            >
              <Select
                placeholder="Welche Emotionen soll die Antwort wiederspiegeln?"
                options={listToOptions( props.state.parameters.emotions )}
                mode="multiple"
                allowClear
                className={styles.formselect}
                size='large'
                disabled={AssistantContextState.requestState.formDisabled || AssistantContextState.requestState.quotaOverused}
              />
            </Form.Item>
          </div>

          <div ref={props.refs.lengthRef}>
            <Form.Item
              className={styles.formpart}
              label={<b>Länge der Antwort</b>}
              name="length"
              rules={[
                {
                  required: true,
                  message: "Bitte lege die Länge deiner Nachricht fest!"
                }
              ]}
            >
              <Select
                placeholder="Wie lang soll die erzeugte Antwort sein?"
                options={listToOptions( props.state.parameters.lengths )}
                disabled={AssistantContextState.requestState.formDisabled || AssistantContextState.requestState.quotaOverused}
                className={styles.formselect}
                size='large'
              />
            </Form.Item>
          </div>
        </Card>
      </div>
      <div className={styles.formfootercontainer}>
        <div className={styles.tokenalert}>
          {
            ( AssistantContextState.requestState.quotaOverused )?
              <Alert message={"Das Creditbudget ist ausgeschöpft. Weitere Credits, kannst du in der Kontoübersicht dazubuchen."} type="error" />
              : <></>
          }
        </div>
        <div ref={props.refs.generateRef} className={styles.generatebuttonrow}>
          <FatButton
            isSubmitButton={true}
            disabled={AssistantContextState.requestState.formDisabled || AssistantContextState.requestState.quotaOverused}
            text="Antwort generieren" />
        </div>
      </div>
    </>
  );
}

export default DialogForm;