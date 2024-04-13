import {
  AssistantInput,
  AssistantInputColumn,
  AssistantInputType,
  AssistantOption
} from "../../firebase/types/Assistant";
import styles from "./assistantform.module.scss";
import { Card, Form, Input, Select } from "antd";
import { isMobile } from "react-device-detect";
import { listToOptions } from "../../helper/architecture";
import {useState} from "react";
const { TextArea } = Input;

function optionsToAntdObjects (options: Array<AssistantOption>) {
  const arr = options.map( ( element ) => {
    return {
      value: element.key,
      label: element.value
    };
  } );

  return arr;
}

function filterOption (input: string, option?: { label: string; value: string }) {
  return (option?.label ?? "").toLowerCase().includes(input.toLowerCase());
}


export default function AssistantForm(props: { title: string, inputColumns: Array<AssistantInputColumn>, formDisabled: boolean, quotaOverused: boolean, profiles }){

  return(
    <div className={styles.userinputform}>
      {props.inputColumns.map((column: AssistantInputColumn, colidx) => {
        return(
          <Card key={colidx} title={column.title} className={(colidx == 0)?styles.userinputcardmain:styles.userinputcardsub}>
            <div className={styles.inputlist}>
              {column.inputs.map((inputobj: AssistantInput, idx: number) => {
                switch (inputobj.type) {
                case AssistantInputType.TEXT_AREA:
                  return (
                    <div key={idx}>
                      <Form.Item
                        className={styles.formpart}
                        label={<b>{inputobj.name}</b>}
                        name={inputobj.key}
                        rules={[
                          {
                            required: true,
                            message: "Bitte gib einen Text ein"
                          }
                        ]}
                      >
                        <TextArea
                          className={styles.forminput}
                          rows={(isMobile) ? 5 : 10}
                          placeholder={inputobj.placeholder}
                          disabled={props.formDisabled || props.quotaOverused}
                        />
                      </Form.Item>
                    </div>
                  );
                case AssistantInputType.SELECT:
                  return (
                    <div key={idx}>
                      <Form.Item
                        className={styles.formpart}
                        label={<b>{inputobj.name}</b>}
                        name={inputobj.key}
                        rules={[
                          {
                            required: true,
                            message: "Bitte lege eine Option fest!"
                          }
                        ]}
                      >
                        <Select
                          placeholder="Zielsprache"
                          showSearch
                          optionFilterProp="children"
                          filterOption={filterOption}
                          options={optionsToAntdObjects(inputobj.options)}
                          className={styles.formselect}
                          size='large'
                          disabled={props.formDisabled || props.quotaOverused}
                        />
                      </Form.Item>
                    </div>
                  );
                case AssistantInputType.PROFILE:
                  return (
                    <div key={idx}>
                      <Form.Item
                        className={styles.formpart}
                        label={<b>{inputobj.name}</b>}
                        name={inputobj.key}
                        rules={[
                          {
                            required: true,
                            message: "Bitte lege eine Option fest!"
                          }
                        ]}
                      >
                        <Select
                          placeholder={inputobj.placeholder}
                          showSearch
                          optionFilterProp="children"
                          filterOption={filterOption}
                          options={props.profiles.map((profile, idx) => {
                            return {
                              key: idx,
                              value: profile.name
                            }
                          })}
                          className={styles.formselect}
                          size='large'
                          disabled={props.formDisabled || props.quotaOverused}
                        />
                      </Form.Item>
                    </div>
                  );
                }
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}