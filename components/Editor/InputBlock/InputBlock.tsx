import styles from "./editorblock.module.scss"
import { useEffect, useState } from "react";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Input, Modal, Row, Select, Space, Switch, Tag } from "antd";
import { AiModel, AssistantInputType, AssistantType, InputBlock } from "../../../firebase/types/Assistant";
import { MessageInstance } from "antd/es/message/interface";

const { TextArea } = Input;

const DEFAULT_ASSISTANT = {
  name: "",
  personality: "",
  prompt: "",
  model: AiModel.GPT4,
  type: AssistantInputType.TEXT_INPUT,
  inputColumns: [],
  initialMessage: ""
}

export default function InputEditorBlock(props: { block: InputBlock, updateBlockState: any, messageApi: MessageInstance }) {
  const [ x, setX] = useState(0);
  const [ y, setY ] = useState(0);
  const [ modalOpen, setModalOpen ] = useState(false);
  const [ stepType, setStepType ] = useState<AssistantType>((props.block)? props.block.type: AssistantType.QAA);
  const [ block, setBlock ] = useState((props.block)? props.block: DEFAULT_ASSISTANT)
  const [form] = Form.useForm();

  const [ keyList, setKeyList ] = useState([])


  useEffect(() => {
    const keys = [];
    if(stepType == AssistantType.QAA) {
      if (block.inputColumns) {
        block.inputColumns.forEach((sec, secid) => {
          if (sec.inputs) {
            sec.inputs.forEach((inp, inpid) => {
              keys.push({ secid: secid, inpid: inpid, key: inp.key });
            })
          }
        })
      }

      setKeyList(keys);
    }else{
      setKeyList([{ secid: 0, iptid: 0, key: "message" }])
    }
  }, []);


  const updateKeyList = (formWatch, sec?, inp?) => {
    const localArr: Array<{ secid: number, inpid: number, key: string }> = [];
    if(formWatch){
      formWatch.forEach((sec, secid) => {
        if(sec?.inputs){
          sec.inputs.forEach((inp, inpid) => {
            if(inp?.key){
              localArr.push( { secid: secid, inpid: inpid, key: inp.key } );
            }
          })
        }
      });

      let toUpdate = localArr;

      if(sec != undefined){
        if(inp != undefined){
          toUpdate = localArr.filter((elm) => {
            return elm.secid != sec || elm.inpid != inp
          });


        }else{
          toUpdate = localArr.filter((elm) => {
            return elm.secid != sec
          });
        }
      }

      setKeyList(toUpdate);
    }
  }


  const OptionsList = ( props: { name: (string | number)[], inputId: number } ) => {
    
    return (
      <Form.List name={props.name}>
        {(options, optionsoperation) => {
          return (
            <Card className={styles.editorcard} type={"inner"} title={"Optionen"} extra={<></>}>

              {options.map((opt, optid) => {
                return (
                  <Space className={styles.optionrow} key={optid} direction={"horizontal"}>
                    <Form.Item
                      name={[opt.name, "key"]}
                      rules={[
                        {
                          required: true,
                          message: "Bitte lege einen Schlüssel für die Option fest!"
                        }
                      ]}
                    >
                      <Input placeholder={"Schlüssel"}></Input>
                    </Form.Item>

                    <Form.Item
                      name={[opt.name, "value"]}
                      rules={[
                        {
                          required: true,
                          message: "Bitte lege einen Wert für die Option fest!"
                        }
                      ]}
                    >
                      <Input placeholder={"Wert"}></Input>
                    </Form.Item>

                    <div className={styles.deleteOption}>
                      <DeleteOutlined onClick={() => {
                        optionsoperation.remove(optid);
                      }} />
                    </div>
                  </Space>
                );
              })}
              <Button
                className={styles.addbutton}
                type="dashed"
                onClick={() => {
                  optionsoperation.add()
                }}
                block
                icon={<PlusOutlined />}
              >
                    Eingabe hinzufügen
              </Button>
            </Card>

          );
        }}
      </Form.List>
    );
  }

  const InputList = (props: { name:  (string | number)[], colId: number }) => {
    const inputWatch = Form.useWatch(["sections", props.colId, "inputs"], form);
    const formWatch = Form.useWatch(["sections"], form);


    return (
      <Form.List name={props.name}>
        {(inputs, inptoperations) => {
          return (
            <>
              {inputs.map((inpt, inpid) => {
                
                return (
                  <Card 
                    key={`inpid-${inpid}`} 
                    className={styles.editorcard} 
                    type={"inner"} 
                    title={"Eingabe"} 
                    extra={<DeleteOutlined onClick={() => {
                      updateKeyList(formWatch, props.colId, inpid);

                      inptoperations.remove(inpid);
                    }}
                    />}
                  >
                    <Space direction={"horizontal"}>
                      <Form.Item
                        name={[inpt.name, "key"]}
                        rules={[
                          {
                            required: true,
                            message: "Bitte lege einen Schlüssel für die Eingabemöglichkeit fest!"
                          }
                        ]}
                      >
                        <Input placeholder={"Schlüssel"} onBlur={() => {
                          updateKeyList(formWatch);
                        }}></Input>
                      </Form.Item>

                      <Form.Item
                        name={[inpt.name, "placeholder"]}
                        rules={[
                          {
                            required: true,
                            message: "Bitte lege einen Platzhaltertext für die Eingabemöglichkeit fest!"
                          }
                        ]}
                      >
                        <Input placeholder={"Platzhaltertext"}></Input>
                      </Form.Item>

                      <Form.Item
                        name={[inpt.name, "name"]}
                        rules={[
                          {
                            required: true,
                            message: "Bitte lege einen Namen für die Eingabemöglichkeit fest!"
                          }
                        ]}
                      >
                        <Input placeholder={"Name"}></Input>
                      </Form.Item>

                      <Form.Item
                        name={[inpt.name, "type"]}
                        rules={[
                          {
                            required: true,
                            message: "Bitte lege einen Typ für die Eingabemöglichkeit fest!"
                          }
                        ]}
                      >
                        <Select placeholder={"Typ"} options={[
                          { value: AssistantInputType.PROFILE, label: "Profil" },
                          { value: AssistantInputType.TEXT_AREA, label: "Textblock" },
                          { value: AssistantInputType.TEXT_INPUT, label: "Text" },
                          { value: AssistantInputType.SELECT, label: "Select" }
                        ]}></Select>
                      </Form.Item>
                    </Space>


                    {inputWatch && inputWatch[inpid] != undefined && inputWatch[inpid].type == AssistantInputType.SELECT &&
                      <Space direction={"vertical"}>
                        <Form.Item
                          labelCol={{ span: 12 }}
                          wrapperCol={{ span: 12 }}
                          className={styles.selectoptions}
                          name={[inpt.name, "multiple"]}
                          label={"Mehrfachauswahl erlaubt?"}
                        >
                          <Switch></Switch>
                        </Form.Item>

                        <Space direction={"horizontal"}>
                          <Form.Item
                            labelCol={{ span: 12 }}
                            wrapperCol={{ span: 12 }}
                            className={styles.selectoptions}
                            name={[inpt.name, "usesMaxSelect"]}
                            label={"Mehrfachauswahl begrenzen?"}
                          >
                            <Switch disabled={inputWatch && !inputWatch[inpid].multiple}></Switch>
                          </Form.Item>

                          <Form.Item
                            labelCol={{ span: 12 }}
                            wrapperCol={{ span: 12 }}
                            className={styles.selectoptions}
                            name={[inpt.name, "maxSelected"]}
                            label={"Mehrfachauswahlgrenze?"}
                            rules={[
                              {
                                required: inputWatch && inputWatch[inpid].multiple && inputWatch[inpid].usesMaxSelect,
                                message: "Bitte definiere die maximale Anzahl an ausgewählten Begriffen!"
                              }
                            ]}
                          >
                            <Input type={"number"} disabled={inputWatch && (!inputWatch[inpid].multiple || !inputWatch[inpid].usesMaxSelect)}></Input>
                          </Form.Item>

                        </Space>

                        <OptionsList inputId={inpid} name={[inpt.name, "options"]} />

                      </Space>
                    }

                  </Card>
                );
              })}
              <Button
                className={styles.addbutton}
                type="dashed"
                onClick={() => {
                  inptoperations.add()
                }}
                block
                icon={<PlusOutlined />}
              >
                    Eingabe hinzufügen
              </Button>
            </>
          );
        }}
      </Form.List>
    );
  }

  const QI = () => {
    const formWatch = Form.useWatch(["sections"], form);
    console.log(block.inputColumns);

    return(
      <Form.List name={"sections"} initialValue={block.inputColumns.map((inpcol) => {
        return {
          secname: inpcol.title,
          inputs: inpcol.inputs?.map((inp) => {
            return {
              key: inp.key,
              name: inp.name,
              placeholder: inp.placeholder,
              multiple: inp.multiple,
              type: inp.type,
              usesMaxSelect: (inp.maxSelected != undefined),
              maxSelected: inp.maxSelected,
              options: inp.options?.map((opt) => {
                return {
                  key: opt.key,
                  value: opt.value
                }
              })
            }
          })
        }
      })}>
        {(fields, operation) => {
          return (
            <>
              {fields.map((field, fieldid) => {

                return (
                  <Card
                    key={`fieldid-${fieldid}`}
                    className={styles.editorcard} 
                    type={"inner"} title={"Section"} 
                    extra={<DeleteOutlined onClick={() => {
                      updateKeyList(formWatch, fieldid);
                      operation.remove(fieldid);
                    }} />}
                  >
                    <Form.Item
                      name={[field.name, "secname"]}
                      label={<b>Name der Section</b>}
                      rules={[
                        {
                          required: true,
                          message: "Bitte lege einen Namen für die Section fest!"
                        }
                      ]}
                    >
                      <Input></Input>
                    </Form.Item>

                    <InputList colId={fieldid} name={[field.name, "inputs"]} />
                  </Card>
                );
              })}
              <Button
                className={styles.addbutton}
                type="dashed"
                onClick={() => {
                  operation.add()
                }}
                block
                icon={<PlusOutlined />}
                disabled={fields.length >= 2}
              >
                  Section hinzufügen
              </Button>
            </>
          );
        }}
      </Form.List>
    );
  }

  const ChatInput = () => {
    return (
      <Form.Item
        name={"stepInitialMessage"}
        initialValue={block.initialMessage}
        label={<b>Erste Nachricht des Chats</b>}
      >
        <TextArea rows={10}></TextArea>
      </Form.Item>
    );
  }

  const saveBlockConfig = ( values ) => {
    let valid = true;
    console.log(values);

    if(stepType == AssistantType.QAA){
      if(values.sections == undefined || values.sections.length == 0){
        valid = false;
        props.messageApi.error("Es muss mindestens eine Section definiert sein!")
      }else{
        values.sections.forEach((sec) => {
          if(sec.inputs == undefined || sec.inputs.length == 0){
            valid = false;
            props.messageApi.error("Jede definierte Section benötigt mindestens eine valide Eingabe!");
          }else{
            sec.inputs.forEach((inp) => {
              if(inp.type == AssistantInputType.SELECT){
                if(inp.options == undefined || inp.options.length == 0){
                  valid = false;
                  props.messageApi.error("Jedes Select-Feld benötigt mindest eine Option!");
                }
              }
            })
          }
        })
      }
    }

    //[TODO] Hier könnte man noch einen Check auf invalid Tokens einbauen

    if(!valid){
      console.log("INVALID");
    }else{
      console.log("VALID");
      console.log(values);

      const localBlockCopy = { ...block };
      let cols = [];

      localBlockCopy.name = values.stepName;
      localBlockCopy.personality = values.stepPersonality;
      localBlockCopy.prompt = values.stepPrompt;
      localBlockCopy.type = values.stepType;
      localBlockCopy.initialMessage = (values.stepInitialMessage)? values.stepInitialMessage: "";

      cols = (values.sections)? values.sections?.map((sec) => {
        return {
          title: sec.secname,
          inputs: sec.inputs?.map((inp) => {
            return {
              key: inp.key,
              name: inp.name,
              type: inp.type,
              placeholder: inp.placeholder,
              multiple: (inp.multiple)? inp.multiple: false,
              maxSelected: (inp.maxSelected)? inp.maxSelected: -1,
              options: inp.options? inp.options?.map((opt) => {
                return {
                  key: opt.key,
                  value: opt.value
                }
              }): []
            }
          })
        }
      }): [];

      localBlockCopy.inputColumns = cols;
      props.updateBlockState(localBlockCopy);
      console.log(localBlockCopy);

      setModalOpen(false);
    }
  }

  const KeyList = () => {
    return keyList.map((inp, idxy) => {
      return <Tag className={styles.keytag} onClick={() => {
        const currPromptState = form.getFieldValue("stepPrompt");
        const prompt = (currPromptState)? currPromptState: "";
        form.setFieldValue("stepPrompt", `${prompt}<${inp.key}>`)
      }} key={idxy}>{inp.key}</Tag>
    });
  }

  return (
    <div className={styles.blockcontainer} style={{ top: y, left: x }}>
      {block.name}
      <span className={styles.add}></span>
      <span className={styles.edit} onClick={() => {
        setModalOpen(true)
      }}><EditOutlined/></span>

      <Modal width={"80%"} open={modalOpen} footer={<Button onClick={() => {
        //console.log(rootRef.current.getSections());
        //validateEditorConfig(rootRef.current.getSections());
        form.submit();
      }}>Speichern</Button>} onCancel={() => {
        setModalOpen(false);
      }}>
        <Form layout={"vertical"} form={form} onFinish={saveBlockConfig}>
          <Row align={"top"} className={styles.editcol}>
            <Col span={12}>
              <Form.Item
                rules={[
                  {
                    required: true
                  }
                ]}
                initialValue={block.name}
                name={"stepName"}
                label={<b>Name des Blocks</b>}
              >
                <Input></Input>
              </Form.Item>

              <Form.Item
                initialValue={stepType}
                name={"stepType"}
                label={<b>Art des Blocks</b>}
                rules={[
                  {
                    required: true,
                    message: "Bitte lege die Art des Inputblocks fest!"
                  }
                ]}
              >
                <Select options={[
                  { value: AssistantType.QAA, label: "QaA-Assistant" },
                  { value: AssistantType.CHAT, label: "Chat-Assistant" }
                ]}
                onChange={(val) => {
                  setStepType(val);
                  if(val == AssistantType.CHAT) {
                    setKeyList([{ secid: 0, iptid: 0, key: "message" }])
                  }else {
                    const keys = [];
                    if(block.inputColumns){
                      block.inputColumns.forEach((sec, secid) => {
                        if(sec.inputs){
                          sec.inputs.forEach((inp, inpid) => {
                            keys.push({ secid: secid, inpid: inpid, key: inp.key });
                          })
                        }
                      })
                    }

                    setKeyList(keys);
                  }
                }}
                >
                </Select>
              </Form.Item>

              <div className={styles.inputedit}>
                {(stepType == AssistantType.QAA)? <QI /> : <ChatInput />}
              </div>
            </Col>

            <Col span={12} className={styles.editcol}>
              <Form.Item initialValue={block.personality} name={"stepPersonality"} label={<b>Persönlichkeit des Blocks</b>}>
                <TextArea value={block.personality} rows={10}></TextArea>
              </Form.Item>

              <Form.Item
                name={"stepPrompt"}
                initialValue={block.prompt}
                label={<b>Prompt des Blocks</b>}
                rules={[
                  {
                    required: true,
                    message: "Bitte definiere den Prompt"
                  }
                ]}
              >
                <TextArea rows={10}></TextArea>
              </Form.Item>

              <div className={styles.taglist}>
                <KeyList />
              </div>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}