import { Alert, Card, Form, FormInstance, Input, Select } from "antd";
import styles from "./translatorform.module.scss";
import { useContext, useEffect } from "react";
import FatButton from "../../FatButton";
import { AssistantContext } from "../../AssistantBase/AssistantBase";
import { isMobile } from "react-device-detect";
import { listToOptions } from "../../../helper/architecture";

const { TextArea } = Input;

const LANGUAGES = ["Deutsch", "Englisch", "Spanisch", "Französisch", "Portugiesisch", "Russisch"];


/**
 * Component implementing the form used for creating blog content.
 * @param props Object containting the current state of the AuthContext and the form component used by the AssistantContext
 * @returns Form used for creating blog content
 */
const TranslatorForm = (props: { state, form: FormInstance, refs: { profileRef, questionRef, generateRef  } }) => {
  const AssistantContextState = useContext(AssistantContext);

  useEffect(() => {
    props.form.setFieldValue("profile", "Hauptprofil");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  return(
    <>
      <div className={styles.userinputform}>
        <Card title={"Übersetzung"} className={styles.userinputcardmain}>
          <div ref={props.refs.questionRef}>
            <Form.Item
              name="profile"
              hidden
            >
            </Form.Item>
          </div>

          <div ref={props.refs.questionRef}>
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

          <div>
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
        <div ref={props.refs.generateRef} className={styles.generatebuttonrow}>
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