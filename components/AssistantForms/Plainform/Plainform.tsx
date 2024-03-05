/* eslint-disable @typescript-eslint/no-explicit-any */
import { Alert, Card, Form, FormInstance, Input } from "antd";
import styles from "./plainform.module.scss";
import { MutableRefObject, useContext } from "react";
import FatButton from "../../FatButton";
import { AssistantContext } from "../../AssistantBase/AssistantBase";
import { isMobile } from "react-device-detect";
import { ctx } from "../../context/AuthContext";

const { TextArea } = Input;


/**
 * Component implementing the form used for creating email content.
 * @param props.state Context state of the application
 * @param props.form FormInstance used to interact with the surrounding assistant form
 * @param props.refs Defined refs that will be used by the tutorial to highlight elements
 * @returns Form used for creating email content
 */
const PlainForm = (props: {
  state: ctx,
  form: FormInstance<any>,
  refs: { 
    queryRef: MutableRefObject<any>,
    generateRef: MutableRefObject<any>,
  } }) => {
  const AssistantContextState = useContext(AssistantContext);

  return(
    <>
      <div className={styles.userinputform}>
        <Card title={"Eine neue Anfrage"} className={styles.userinputcardmain}>

          <div ref={props.refs.queryRef}>
            <Form.Item
              className={styles.formpart}
              label={<b>Worum geht es?</b>}
              name="content"
              rules={[
                {
                  required: true,
                  message: "Bitte definiere deine Anfrage!"
                }
              ]}
            >
              <TextArea
                className={styles.forminput}
                rows={(isMobile)? 5: 10}
                placeholder="Anfrage"
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
              <Alert message={"Das Budget ist ausgeschöpft. In der Kontoübersicht kannst du weiteres Budget dazubuchen."} type="error" />
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

export default PlainForm;