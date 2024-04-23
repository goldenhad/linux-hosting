import styles from "./editorblock.module.scss"
import {ForwardedRef, forwardRef, useEffect, useImperativeHandle, useRef, useState} from "react";
import {DeleteOutlined, EditOutlined} from "@ant-design/icons";
import {Button, Card, Col, Form, Input, Modal, Row, Select, Space, Switch, Tag} from "antd";
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

export default function InputEditorBlock(props: { block: InputBlock, updateBlockState: any }) {
  const [ x, setX] = useState(0);
  const [ y, setY ] = useState(0);
  const [ modalOpen, setModalOpen ] = useState(false);
  const [ stepType, setStepType ] = useState<AssistantType>(AssistantType.QAA);
  const [ name, setName ] = useState("");
  const [ personality, setPersonality ] = useState("");
  const [ block, setBlock ] = useState((props.block)? props.block: { name: "", personality: "", prompt: "", model: AiModel.GPT4, type: AssistantInputType.TEXT_INPUT, inputColumns: [] })
  const [form] = Form.useForm();
  const rootRef = useRef<any>(null);
  const [ inputKeys, setInputKeys ] = useState<Array<string>>([]);

  //let nameContainer = props.blocks[props.blockid].name;
  //let personalityContainer = props.blocks[props.blockid].personality;

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

  const InputAdd = forwardRef((props: { idx: number, inputs }, ref: ForwardedRef<any>) => {
    const optionsRef = useRef<any>([])
    const [ inputs, setInputs ] = useState<Array<Inputs>>([]);

    useEffect(() => {
      const defaultInputs = [
        {
          key: 0,
          label: "Input",
          type: AssistantInputType.TEXT_INPUT,
          children: <></>
        }
      ];

      let localinputs = [];

      if(props.inputs?.length > 0){
        props.inputs.forEach((inp, idx) => {
          localinputs.push({
            key: idx,
            label: "Input",
            type: inp.type,
            children: <></>
          });
        });
      }else{
        localinputs = defaultInputs;
      }

      setInputs(localinputs);
    }, []);

    useImperativeHandle(ref, () => ({
      getInputs: () => {

        const inputData = [];
        inputs.forEach((inp, idx) => {
          inputData.push({ input: inp, settings: optionsRef.current[idx].getSettings() });
        });

        return inputData;
      }
    }));
    
    const InputDelete = ({ idx }) => {
      if(idx != 0){
        return (
          <DeleteOutlined onClick={() => {
            setInputs(inputs.filter((intp) => {
              return intp.key !== idx
            }))
          }} />
        );
      }else{
        return null;
      }
    }

    return (
      <div ref={ref}>
        {inputs.map((inp, idx) => {
          return <Card className={styles.editorcard} key={idx} type={"inner"} title={"Eingabe"} extra={<InputDelete idx={idx} />}>
            <InputOptions idx={idx} inputRepresentation={(props.inputs)? props.inputs[idx]: {}} ref={(el) => optionsRef.current[idx] = el} />
          </Card>
        })}
        <div className={styles.inputaddrow}>
          <div className={styles.inputadd} onClick={() => {
            const localinputs = [...inputs];
            const lastkey = localinputs.length;
            const thiskey = lastkey as number;

            localinputs.push({
              key: thiskey,
              label: "Input",
              children: <></>,
              type: AssistantInputType.PROFILE,
              extra: <DeleteOutlined onClick={() => {
                setInputs(inputs.filter((inp) => {
                  return inp.key !== thiskey
                }))
              }} />
            });
            setInputs(localinputs);
          }}>+</div>
        </div>
      </div>
    );
  })

  InputAdd.displayName = "InputAdd";


  const InputOptions = forwardRef((props: any, ref) => {
    const [ inputType, setInputType ] = useState<AssistantInputType>(AssistantInputType.TEXT_INPUT);
    const [ options, setOptions ] = useState<Array<Options>>([]);
    const [ inputKey, setInputKey ] = useState("");
    const [ inputLabel, setInputLabel ] = useState("");
    const [ inputPlaceholder, setInputPlaceholder ] = useState("");
    const [ inputMultipleOptions, setInputMultipleOptions ] = useState(false);
    const [ inputMaxSelect, setInputMaxSelect ] = useState(-1);
    const [ usesMaxSelect, setUsesMaxSelect ] = useState(false);

    useEffect(() => {
      if(props.inputRepresentation){
        setInputKey(props.inputRepresentation.key);
        setInputLabel(props.inputRepresentation.name);
        setInputPlaceholder(props.inputRepresentation.placeholder);
        setInputType(props.inputRepresentation.type);
        setInputMultipleOptions(props.inputRepresentation.multiple);
        setInputMaxSelect(props.inputRepresentation.maxSelected);
        if(props.inputRepresentation.maxSelected != undefined){
          setUsesMaxSelect(props.inputRepresentation.maxSelected != -1);
        }
        setOptions(props.inputRepresentation.options);
      }
    }, []);

    useImperativeHandle(ref, () => ({
      getSettings: () => {
        return {
          key: inputKey,
          name: inputLabel,
          placeholder: inputPlaceholder,
          type: inputType,
          multiple: inputMultipleOptions,
          maxSelected: (usesMaxSelect)? inputMaxSelect: -1,
          options: options
        }
      }
    }));

    return (
      <>
        <Space className={styles.optionsinput} direction={"vertical"}>
          <Space direction={"horizontal"}>
            <Input value={inputKey} placeholder={"Key"} onChange={(val) => {
              const linpkeys = [...inputKeys];
              console.log(linpkeys);
              linpkeys[props.idx] = val.target.value;
              setInputKeys(linpkeys);
              setInputKey(val.target.value);
            }}></Input>
            <Input value={inputLabel} placeholder={"Label"} onChange={(val) => setInputLabel(val.target.value)}></Input>
          </Space>
          <Input value={inputPlaceholder} placeholder={"Platzhaltertext"} onChange={(val) => setInputPlaceholder(val.target.value)}></Input>

          <Select value={inputType} placeholder={"Typ"} defaultValue={inputType} options={[
            { value: AssistantInputType.PROFILE, label: "Profil" },
            { value: AssistantInputType.TEXT_AREA, label: "Textblock" },
            { value: AssistantInputType.TEXT_INPUT, label: "Text" },
            { value: AssistantInputType.SELECT, label: "Select" }
          ]} onSelect={(val: AssistantInputType) => {
            setInputType(val);
          }}></Select>
        </Space>
        <div className={styles.optioncontainer}>
          {inputType == AssistantInputType.SELECT ? <>
            <div className={styles.selectadditionaloptions}>
              <div className={styles.optionswitch}>
                <span className={styles.optionswitchlabel}>Mehrfachauswahl erlaubt?</span>
                <Switch defaultChecked={inputMultipleOptions} defaultValue={inputMultipleOptions} onChange={(val) => setInputMultipleOptions(val)}></Switch>
              </div>
              <div className={styles.optionswitch}>
                <span className={styles.optionswitchlabel}>Mehrfachauswahl begrenzen?</span>
                <Switch 
                  defaultChecked={(inputMaxSelect != -1 && inputMaxSelect != undefined)}
                  disabled={!inputMultipleOptions}
                  defaultValue={usesMaxSelect}
                  onChange={(val) => setUsesMaxSelect(val)} />
                <Input
                  value={inputMaxSelect}
                  type={"number"}
                  disabled={!usesMaxSelect}
                  placeholder={"Begrenzt auf?"}
                  onChange={(val) => setInputMaxSelect(val.target.value as unknown as number)}
                ></Input>
              </div>
            </div>
            <b>Optionen</b>
            <div className={styles.options}>{options?.map((option, idx) => {
              return (
                <div key={idx} className={styles.optionrow}>
                  <Space dir={"horizontal"}>
                    <Input value={option.key} placeholder={"Key"} onChange={(val) => {
                      const localOptions = options;
                      localOptions[idx].key = val.target.value;
                      setOptions(localOptions);
                    }}></Input>
                    <Input value={option.value} placeholder={"Wert"} onChange={(val) => {
                      const localOptions = options;
                      localOptions[idx].value = val.target.value;
                      setOptions(localOptions);
                    }}></Input>
                    { idx != 0 && (
                      <DeleteOutlined onClick={() => {
                        setOptions(options.filter((opt) => {
                          return opt.idx !== idx
                        }))
                      }} />
                    )}
                  </Space>
                </div>
              );
            })}</div>
            <div className={styles.optionaddrow}>
              <span className={styles.optionadd} onClick={() => {
                const localinp = [...options];
                localinp.push({
                  idx: localinp.length,
                  key: "",
                  value: ""
                });
                setOptions(localinp)
              }}>+</span>
            </div>
          </> : <>

          </>}
        </div>
      </>
    )
  });

  InputOptions.displayName = "Input";


  const SectionCont = forwardRef((props: any, ref: ForwardedRef<any>) => {
    const inputAddRef = useRef<any>(null);
    const [ inputCol ] = useState(props.inputColumn);
    const [ sectionName, setSectionName ] = useState(props.inputColumn?.title);

    useImperativeHandle(ref, () => ({
      getInputContainer: () => {
        return inputAddRef.current.getInputs();
      },
      getName: () => {
        return sectionName;
      }
    }));

    return(
      <Card ref={ref} className={styles.editorcard} type={"inner"} title={"Section"} extra={props.extra}>
        <Form.Item label={<b>Name der Section</b>}>
          <Input defaultValue={sectionName} onChange={(val) => {
            setSectionName(val.target.value) 
          }}></Input>
        </Form.Item>
        <InputAdd inputs={inputCol?.inputs} ref={inputAddRef} idx={0}/>
      </Card>
    );
  });

  SectionCont.displayName = "Section";

  const QaAInput = forwardRef((props, ref: ForwardedRef<any>) => {
    const sectionRefs = useRef([]);
    const [sections, setSections] = useState<Array<Section>>([
      {
        key: 0,
        label: "Section",
        name: "",
        children: <></>,
        openInput: ["0"]
      }
    ]);

    useImperativeHandle(ref, () => ({
      getSections: () => {
        const sectionInformation = [];
        sections.forEach((sec, idx) => {
          const specificSectionReference = sectionRefs.current[idx];
          sectionInformation.push({ name: specificSectionReference.getName(), inputs: specificSectionReference.getInputContainer() })
        });

        return sectionInformation;
      }
    }));


    return (
      <div ref={ref}>
        <Form.Item className={styles.setioninput} label={<b>Eingabe</b>}>
          {sections.map((sec, idx) => {
            console.log(block.inputColumns[idx])
            return <SectionCont section={sec} inputColumn={block.inputColumns[idx]} key={idx} ref={(el) => sectionRefs.current[idx] = el} extra={sec.extra}>
              {sec.children}
            </SectionCont>;
          })}
          {sections.length < 2 && (
            <div className={styles.sectionaddrow}>
              <div className={styles.sectionadd} onClick={() => {
                const lastkey = sections.length;
                setSections([...sections, {
                  key: lastkey,
                  label: "Section",
                  name: "",
                  children: <></>,
                  openInput: ["0"],
                  extra: <DeleteOutlined onClick={() => {
                    const sects = [...sections];
                    sects.splice(lastkey as number + 1, 1);
                    setSections(sects);
                  }}
                  />
                }])
              }}>+
              </div>
            </div>
          )}
        </Form.Item>
      </div>
    );
  });

  QaAInput.displayName = "QaAInput";

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
      //localBlockCopy.personality = personalityContainer;
      //localBlockCopy.name = nameContainer;

      //setName(nameContainer);
      //setPersonality(personalityContainer);
      
      //console.log(localBlocksCopy);
      //props.setBlocks(localBlocksCopy);

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
          console.log(rootRef.current.getSections());
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
                {(stepType == AssistantType.QAA)? <QaAInput ref={rootRef} /> : <ChatInput />}
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