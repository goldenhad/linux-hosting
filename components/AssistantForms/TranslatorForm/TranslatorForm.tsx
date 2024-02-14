/* eslint-disable @typescript-eslint/no-explicit-any */
import { Alert, Card, Form, FormInstance, Input, Select } from "antd";
import styles from "./translatorform.module.scss";
import { MutableRefObject, useContext, useEffect } from "react";
import FatButton from "../../FatButton";
import { AssistantContext } from "../../AssistantBase/AssistantBase";
import { isMobile } from "react-device-detect";
import { listToOptions } from "../../../helper/architecture";
import { ctx } from "../../context/AuthContext";

const { TextArea } = Input;

const LANGUAGES = ["Deutsch", "Englisch", "Spanisch", "Französisch", "Portugiesisch", "Russisch"];


/**
 * Component implementing the form used for creating translated content.
 * @param props.state Context state of the application
 * @param props.form FormInstance used to interact with the surrounding assistant form
 * @param props.refs Defined refs that will be used by the tutorial to highlight elements
 * @returns Form used for creating translated content
 */
const TranslatorForm = (props: {
  state: ctx,
  form: FormInstance<any>,
  refs: { 
    textRef: MutableRefObject<any>,
    languageRef: MutableRefObject<any>,
    translateRef: MutableRefObject<any>
  } }) => {
  const AssistantContextState = useContext(AssistantContext);

  useEffect(() => {
    props.form.setFieldValue("profile", "Hauptprofil");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  return(
    <>
      <div className={styles.userinputform}>
        <Card title={"Übersetzung"} className={styles.userinputcardmain}>
          <div>
            <Form.Item
              name="profile"
              hidden
            >
            </Form.Item>
          </div>

          <div ref={props.refs.textRef}>
            <Form.Item
              className={styles.formpart}
              label={<b>Zu übersetzender Text</b>}
              name="text"
              rules={[
                {
                  required: true,
                  message: "Bitte gib einen Text ein"
                }
              ]}
            >
              <TextArea
                className={styles.forminput}
                rows={(isMobile)? 5: 10}
                placeholder="Welchen Text soll ich übersetzen?"
                disabled={AssistantContextState.requestState.formDisabled || AssistantContextState.requestState.quotaOverused}
              />
            </Form.Item>
          </div>

          <div ref={props.refs.languageRef}>
            <Form.Item
              className={styles.formpart}
              label={<b>Zielsprache</b>}
              name="language"
              rules={[
                {
                  required: true,
                  message: "Bitte lege eine Sprache fest!"
                }
              ]}
            >
              <Select placeholder="Zielsprache" options={listToOptions( LANGUAGES )}
                className={styles.formselect}
                size='large'
                disabled={AssistantContextState.requestState.formDisabled || AssistantContextState.requestState.quotaOverused}
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
        <div ref={props.refs.translateRef} className={styles.generatebuttonrow}>
          <FatButton
            isSubmitButton={true}
            disabled={AssistantContextState.requestState.formDisabled || AssistantContextState.requestState.quotaOverused}
            text="Übersetzen"
          />
        </div>
            
      </div>
    </>
  );
}

export default TranslatorForm;