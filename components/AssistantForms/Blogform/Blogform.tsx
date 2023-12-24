import { Alert, Card, Form, Input, Select } from "antd";
import { listToOptions } from "../../../helper/architecture";
import styles from "./blogform.module.scss";
import { useContext } from "react";
import FatButton from "../../FatButton";
import { AssistantContext } from "../../AssistantBase/AssistantBase";

const { TextArea } = Input;


/**
 * Component implementing the form used for creating blog content.
 * @param props Object containting the current state of the AuthContext and the form component used by the AssistantContext
 * @returns Form used for creating blog content
 */
const BlogForm = (props: { state, form, refs: { profileRef, continueRef, classificationRef, lengthRef, generateRef  } }) => {
  const AssistantContextState = useContext(AssistantContext);
  const form = props.form;


  return(
    <>
      <div className={styles.userinputform}>
        <Card title={"Ein neuer Blogbeitrag"} className={styles.userinputcardmain}>
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
                size='large' />
            </Form.Item>
          </div>

          <div ref={props.refs.continueRef}>
            <Form.Item
              className={styles.formpart}
              label={<b>Worum soll es in dem Blogbeitrag gehen?</b>}
              name="content"
              rules={[
                {
                  required: true,
                  message: "Formuliere kurz den Inhalt des Blogbeitrags!"
                }
              ]}
            >
              <TextArea
                className={styles.forminput}
                rows={10}
                placeholder="Formuliere kurz den Inhalt des Blogbeitrags!"
                disabled={AssistantContextState.requestState.formDisabled || AssistantContextState.requestState.quotaOverused} />
            </Form.Item>
          </div>
        </Card>
        <Card title={"Einstellungen"} className={styles.userinputcardsub}>
          <div ref={props.refs.classificationRef}>
            <Form.Item className={styles.formpart} label={<b>Einordnung des Lesers (maximal 3)</b>} name="order"
              rules={[
                () => ({
                  validator(_, value) {
                    if (value) {
                      if (value.length > 3) {
                        form.setFieldValue("order", value.slice(0, 3));
                      }
                    }
                    return Promise.resolve();
                  }
                }),
                {
                  required: true,
                  message: "Bitte lege die Einordnung des Lesers fest!"
                }
              ]}
            >
              <Select
                placeholder="Wie ordnest du den Leser des Beitrags ein?"
                options={listToOptions(props.state.parameters.motives)}
                mode="multiple"
                allowClear
                className={styles.formselect}
                size='large'
                disabled={AssistantContextState.requestState.formDisabled || AssistantContextState.requestState.quotaOverused} />
            </Form.Item>
          </div>

          <div ref={props.refs.lengthRef}>
            <Form.Item
              className={styles.formpart}
              label={<b>Länge des Blogbeitrags</b>}
              name="length"
              rules={[
                {
                  required: true,
                  message: "Bitte lege die Länge des Beitrags fest!"
                }
              ]}
            >
              <Select
                placeholder="Wie lang soll der erzeugte Beitrag sein?"
                options={listToOptions(props.state.parameters.lengths)}
                disabled={AssistantContextState.requestState.formDisabled || AssistantContextState.requestState.quotaOverused}
                className={styles.formselect}
                size='large' />
            </Form.Item>
          </div>
        </Card>
      </div><div className={styles.formfootercontainer}>
        <div className={styles.tokenalert}>
          {(AssistantContextState.requestState.quotaOverused) ?
            <Alert message={"Das Creditbudget ist ausgeschöpft. Weitere Credits, kannst du in der Kontoübersicht dazubuchen."} type="error" />
            : <></>}
        </div>
        <div ref={props.refs.generateRef} className={styles.generatebuttonrow}>
          <FatButton
            isSubmitButton={true}
            disabled={AssistantContextState.requestState.formDisabled || AssistantContextState.requestState.quotaOverused}
            text="Blogbeitrag generieren" />
        </div>

      </div>
    </>
  );
}

export default BlogForm;