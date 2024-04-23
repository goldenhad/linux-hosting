import styles from "./editorblock.module.scss"
import { useEffect, useRef, useState } from "react";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Input, Modal, Row, Select, Space, Switch, Tag } from "antd";
import {
  AiModel,
  AssistantInput,
  AssistantInputColumn,
  AssistantInputType,
  AssistantType,
  InputBlock
} from "../../firebase/types/Assistant";

const { TextArea } = Input;

interface Section {
  key: number,
  label: string,
  name: string,
  children: JSX.Element,
  extra?: JSX.Element,
  openInput: Array<string>
}

interface Inputs {
  key: number,
  label: string,
  children: JSX.Element,
  extra?: JSX.Element,
  type: AssistantInputType,
}

interface Options {
  idx: number;
  key: string;
  value: string
}

interface InputSettings {
  key: string,
  name: string,
  options: Array<Options>,
  type: AssistantInputType,
  placeholder: string,
  multiple: boolean,
  maxSelected: number
}

interface InputRepresentation {
  input: Inputs,
  settings: InputSettings
}

const DEFAULT_ASSISTANT = {
  name: "",
  personality: "",
  prompt: "",
  model: AiModel.GPT4,
  type: AssistantInputType.TEXT_INPUT,
  inputColumns: []
}

export default function InputEditorBlock(props: { block: InputBlock, updateBlockState: any }) {
  const [ x, setX] = useState(0);
  const [ y, setY ] = useState(0);
  const [ modalOpen, setModalOpen ] = useState(false);
  const [ stepType, setStepType ] = useState<AssistantType>(AssistantType.QAA);
  const [ name, setName ] = useState("");
  const [ personality, setPersonality ] = useState("");
  const [ block, setBlock ] = useState((props.block)? props.block: DEFAULT_ASSISTANT)
  const [form] = Form.useForm();

  const [ assFormState, setAssFormState ] = useState([]);

  const [ inputKeys, setInputKeys ] = useState<Array<string>>([]);


  useEffect(() => {
    if(props.block != undefined){
      //const blockref = props.blocks[props.blockid];
      /*if(blockref){
        setName(blockref.name);
        setPersonality(blockref.personality);

        const localKeys = [];
        console.log(blockref.inputColumns);
        blockref.inputColumns.inputs?.forEach((inp) => {
          localKeys.push(inp.key);
        })
        setInputKeys(inputKeys);
      }*/
    }
  }, []);

  useEffect(() => {
    console.log(assFormState);
  }, [assFormState]);


  const OptionsList = ( props: { name: (string | number)[], inputId: number } ) => {
    
    return (
      <Form.List name={props.name}>
        {(options, optionsoperation) => {
          return (
            <Card className={styles.editorcard} type={"inner"} title={"Optionen"} extra={<></>}>

              {options.map((opt, optid) => {
                return (
                  <Space key={optid} direction={"horizontal"}>
                    <Form.Item name={[opt.name, "key"]}>
                      <Input placeholder={"Schlüssel"}></Input>
                    </Form.Item>

                    <Form.Item name={[opt.name, "value"]}>
                      <Input placeholder={"Wert"}></Input>
                    </Form.Item>

                    { optid > 0 && <DeleteOutlined onClick={() => optionsoperation.remove(optid)} /> }
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

    useEffect(() => {
      console.log(inputWatch);
    }, [inputWatch]);

    const SelectSettings = (props: { prefix: number, inputId: number }) => {
      if(inputWatch){
        if(inputWatch[props.inputId] != undefined && inputWatch[props.inputId].type == AssistantInputType.SELECT){
          return (
            <Space direction={"vertical"}>
              <Form.Item
                labelCol={{ span: 12 }}
                wrapperCol={{ span: 12 }}
                className={styles.selectoptions}
                name={[props.prefix, "multiple"]}
                label={"Mehrfachauswahl erlaubt?"}
              >
                <Switch></Switch>
              </Form.Item>

              <Space direction={"horizontal"}>
                <Form.Item
                  labelCol={{ span: 12 }}
                  wrapperCol={{ span: 12 }}
                  className={styles.selectoptions}
                  name={[props.prefix, "usesMaxSelect"]}
                  label={"Mehrfachauswahl begrenzen?"}
                >
                  <Switch disabled={!inputWatch[props.inputId].multiple}></Switch>
                </Form.Item>

                <Form.Item
                  labelCol={{ span: 12 }}
                  wrapperCol={{ span: 12 }}
                  className={styles.selectoptions}
                  name={[props.prefix, "maxSelect"]}
                  label={"Mehrfachauswahlgrenze?"}
                >
                  <Input disabled={!inputWatch[props.inputId].multiple || !inputWatch[props.inputId].usesMaxSelect}></Input>
                </Form.Item>

              </Space>

              <OptionsList inputId={props.inputId} name={[props.prefix, "options"]} />

            </Space>
          );
        }
      }
    }

    return (
      <Form.List name={props.name}>
        {(inputs, inptoperations) => {
          console.log(inputs);
          return (
            <>
              {inputs.map((inpt, inpid) => {
                
                return (
                  <Card 
                    key={`inpid-${inpid}`} 
                    className={styles.editorcard} 
                    type={"inner"} 
                    title={"Eingabe"} 
                    extra={<DeleteOutlined onClick={() => inptoperations.remove(inpid)} />}
                  >
                    <Space direction={"horizontal"}>
                      <Form.Item name={[inpt.name, "key"]}>
                        <Input placeholder={"Schlüssel"}></Input>
                      </Form.Item>

                      <Form.Item name={[inpt.name, "name"]}>
                        <Input placeholder={"Name"}></Input>
                      </Form.Item>

                      <Form.Item name={[inpt.name, "type"]}>
                        <Select placeholder={"Typ"} options={[
                          { value: AssistantInputType.PROFILE, label: "Profil" },
                          { value: AssistantInputType.TEXT_AREA, label: "Textblock" },
                          { value: AssistantInputType.TEXT_INPUT, label: "Text" },
                          { value: AssistantInputType.SELECT, label: "Select" }
                        ]}></Select>
                      </Form.Item>
                    </Space>

                    <SelectSettings prefix={inpt.name} inputId={inpid} />

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

    return(
      <Form.List name={"sections"} initialValue={block.inputColumns.map((inpcol) => {
        return { secname: inpcol.title, inputs: [
          { key: "test" }
        ] }
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
                    extra={<DeleteOutlined onClick={() => operation.remove(fieldid)} />}
                  >
                    <Form.Item name={[field.name, "secname"]} label={<b>Name der Section</b>}>
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

    return (<></>);
  }

  const validateEditorConfig = ( sections: Array<{ inputs: Array<InputRepresentation>, name: string, section: Section }> ) => {
    let valid = true;
    //console.log(sections);

    sections.forEach((singleSec) => {
      if(singleSec.name == ""){
        valid = valid && false;
      }

      singleSec.inputs.forEach((singleInput) => {
        if(singleInput.settings.name == ""){
          valid = valid && false;
        }

        if(singleInput.settings.type == AssistantInputType.SELECT){
          if(singleInput.settings.options.length != 0){
            singleInput.settings.options.forEach((opt) => {
              if(opt.key == "" || opt.value == ""){
                valid = valid && false;
              }
            })
          }
        }

      })
    })

    if(!valid){
      console.log("INVALID");
    }else{
      console.log("VALID");
      const localBlockCopy = { ...block };
      const cols = [];

      sections.forEach((sec) => {
        const secRepresentation: AssistantInputColumn = {
          title: "",
          inputs: []
        };
        secRepresentation.title = sec.name;

        sec.inputs.forEach((inp) => {
          const inputRepresentation: AssistantInput = {
            type: AssistantInputType.TEXT_INPUT,
            key: "",
            name: ""
          }

          inputRepresentation.name = inp.settings.name;
          inputRepresentation.key = inp.settings.key;
          inputRepresentation.placeholder = inp.settings.placeholder;
          inputRepresentation.type = inp.settings.type;

          if(inp.settings.type == AssistantInputType.SELECT){
            inputRepresentation.multiple = inp.settings.multiple;
            inputRepresentation.maxSelected = inp.settings.maxSelected;
            inputRepresentation.options = inp.settings.options;
          }

          secRepresentation.inputs.push(inputRepresentation);
        });


        cols.push(secRepresentation);
      });

      localBlockCopy.inputColumns = cols;

      setModalOpen(false);
    }
  }

  return (
    <div className={styles.blockcontainer} style={{ top: y, left: x }}>
      {name}
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
        <Form layout={"vertical"} form={form} onFinish={(values) => {
          console.log(values)

        }}>
          <Row align={"top"} className={styles.editcol}>
            <Col span={12}>
              <Form.Item initialValue={block.name} name={"stepName"} label={<b>Name des Blocks</b>}>
                <Input></Input>
              </Form.Item>

              <Form.Item initialValue={stepType} name={"stepType"} label={<b>Art des Blocks</b>}>
                <Select options={[
                  { value: AssistantType.QAA, label: "QaA-Assistant" },
                  { value: AssistantType.CHAT, label: "Chat-Assistant" }
                ]}
                defaultValue={AssistantType.QAA}
                onChange={(val) => setStepType(val)}
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

              <Form.Item name={"stepPrompt"} label={<b>Prompt des Blocks</b>}>
                <TextArea rows={10}></TextArea>
              </Form.Item>

              <div className={styles.taglist}>
                {inputKeys.map((key, idx) => {
                  return <Tag key={idx}>{key}</Tag>
                })}
              </div>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}