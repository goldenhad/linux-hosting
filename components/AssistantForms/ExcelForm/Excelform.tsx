import { Alert, Card, Form, Input, Select } from "antd";
import styles from "./excelform.module.scss";
import { useContext } from "react";
import FatButton from "../../FatButton";
import { AssistantContext } from "../../AssistantBase/AssistantBase";
import { isMobile } from "react-device-detect";

const { TextArea } = Input;


/**
 * Component implementing the form used for creating blog content.
 * @param props Object containting the current state of the AuthContext and the form component used by the AssistantContext
 * @returns Form used for creating blog content
 */
const ExcelForm = (props: { state, form, refs: { profileRef, questionRef, generateRef  } }) => {
  const AssistantContextState = useContext(AssistantContext);


  return(
    <>
      <div className={styles.userinputform}>
        <Card title={"Frage zu Excel"} className={styles.userinputcardmain}>
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