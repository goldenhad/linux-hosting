/* eslint-disable @typescript-eslint/no-explicit-any */
import { Alert, Card, Form, FormInstance, Input } from "antd";
import styles from "./excelform.module.scss";
import { MutableRefObject, useContext, useEffect } from "react";
import FatButton from "../../FatButton";
import { AssistantContext } from "../../AssistantBase/AssistantBase";
import { isMobile } from "react-device-detect";
import { ctx } from "../../context/AuthContext";

const { TextArea } = Input;


/**
 * Form used for excel questions
 * @param props.state Context state of the application
 * @param props.form FormInstance used to interact with the surrounding assistant form
 * @param props.refs Defined refs that will be used by the tutorial to highlight elements
 * @returns Form used for creating reponses to excel questions
 */
const ExcelForm = (props: { 
  state: ctx, 
  form: FormInstance<any>, 
  refs: { 
    profileRef: MutableRefObject<any>, 
    questionRef: MutableRefObject<any>, 
    generateRef: MutableRefObject<any>  
  } }) => {
  const AssistantContextState = useContext(AssistantContext);
  
  useEffect(() => {
    props.form.setFieldValue("profile", "Hauptprofil");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return(
    <>
      <div className={styles.userinputform}>
        <Card title={"Frage zu Excel"} className={styles.userinputcardmain}>
          <div>
            <Form.Item
              name="profile"
              hidden
            >
            </Form.Item>
          </div>

          <div ref={props.refs.questionRef}>
            <Form.Item
              className={styles.formpart}
              label={<b>Wie lautet deine Frage?</b>}
              name="question"
              rules={[
                {
                  required: true,
                  message: "Wie kann ich dir bei Excel helfen?"
                }
              ]}
            >
              <TextArea
                className={styles.forminput}
                rows={(isMobile)? 5: 10}
                placeholder="Formuliere kurz deine Frage?"
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
            text="Antwort generieren"
          />
        </div>
            
      </div>
    </>
  );
}

export default ExcelForm;