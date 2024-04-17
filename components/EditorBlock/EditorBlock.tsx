import styles from "./editorblock.module.scss"
import { ForwardedRef, forwardRef, useImperativeHandle, useRef, useState } from "react";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Modal, Select, Space } from "antd";
import { AssistantInputType, AssistantType } from "../../firebase/types/Assistant";

const { TextArea } = Input;

interface Section {
  key: number, label: string, children: JSX.Element, extra?: JSX.Element, openInput: Array<string>
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

export default function EditorBlock(props: { name: string }) {
  const [x, setX] = useState(0);
  const [ y, setY ] = useState(0);
  const [ modalOpen, setModalOpen ] = useState(false);
  const [ stepType, setStepType ] = useState<AssistantType>(AssistantType.QAA);
  const [form] = Form.useForm();
  const rootRef = useRef<any>(null);

  const InputAdd = forwardRef((props: { idx: number }, ref: ForwardedRef<any>) => {
    const optionsRef = useRef<any>([])
    const [ inputs, setInputs ] = useState<Array<Inputs>>([
      {
        key: 0,
        label: "Input",
        type: AssistantInputType.TEXT_INPUT,
        children: <></>
      }
    ]);

    useImperativeHandle(ref, () => ({
      getInputs: () => {

        const inputData = [];
        inputs.forEach((inp, idx) => {
          inputData.push({ input: inp, options: optionsRef.current[idx].getOptions() });
        });

        return inputData;
      }
    }));

    return (
      <div ref={ref}>
        {inputs.map((inp, idx) => {
          return <Card className={styles.editorcard} key={idx} type={"inner"} title={"Eingabe"}>
            <InputOptions ref={(el) => optionsRef.current[idx] = el} />
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

  
  const InputOptions = forwardRef((props, ref) => {
    const [ inputType, setInputType ] = useState<AssistantInputType>(AssistantInputType.TEXT_INPUT);
    const [ options, setOptions ] = useState<Array<Options>>([]);

    useImperativeHandle(ref, () => ({
      getOptions: () => {
        return options;
      }
    }));

    return (
      <>
        <Space dir={"horizontal"}>
          <Input placeholder={"Key"}></Input>
          <Select placeholder={"Typ"} defaultValue={inputType} options={[
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
            <b>Optionen</b>
            <div className={styles.options}>{options.map((option, idx) => {
              return (
                <div key={idx} className={styles.optionrow}>
                  <Space dir={"horizontal"}>
                    <Input placeholder={"Key"}></Input>
                    <Input placeholder={"Wert"}></Input>
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
          </> : <></>}
        </div>
      </>
    )
  });

  InputOptions.displayName = "Input";


  const SectionCont = forwardRef((props: any, ref: ForwardedRef<any>) => {
    const inputAddRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      getInputContainer: () => {
        return inputAddRef.current.getInputs();
      }
    }));

    return(
      <Card ref={ref} className={styles.editorcard} type={"inner"} title={"Section"} extra={props.extra}>
        <Form.Item label={<b>Name der Section</b>}>
          <Input></Input>
        </Form.Item>
        <InputAdd ref={inputAddRef} idx={0}/>
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
        children: <></>,
        openInput: ["0"]
      }
    ]);

    useImperativeHandle(ref, () => ({
      getSections: () => {
        const sectionInformation = [];
        sections.forEach((sec, idx) => {
          sectionInformation.push({ section: sec, inputs: sectionRefs.current[idx].getInputContainer() })
        });

        return sectionInformation;
      }
    }));


    return (
      <div ref={ref}>
        <Form.Item className={styles.setioninput} label={<b>Eingabe</b>}>
          {sections.map((sec, idx) => {
            return <SectionCont key={idx} ref={(el) => sectionRefs.current[idx] = el} extra={sec.extra}>
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

  return (
    <div className={styles.blockcontainer} style={{ top: y, left: x }}>
      {props.name}
      <span className={styles.add}>+</span>
      <span className={styles.edit} onClick={() => {
        setModalOpen(true)
      }}><EditOutlined/></span>

      <Modal open={modalOpen} footer={<Button onClick={() => {
        console.log(rootRef.current.getSections());
      }}>Speichern</Button>} onCancel={() => {
        setModalOpen(false);
      }}>
        <Form layout={"vertical"} form={form} onFinish={(values) => console.log(values)}>
          <Form.Item name={"stepName"} label={<b>Name des Blocks</b>}>
            <Input></Input>
          </Form.Item>

          <Form.Item name={"stepType"} label={<b>Art des Blocks</b>}>
            <Select options={[
              { value: AssistantType.QAA, label: "QaA-Assistant" },
              { value: AssistantType.CHAT, label: "Chat-Assistant" }
            ]}
            defaultValue={AssistantType.QAA}
            onChange={(val) => setStepType(val)}
            >
            </Select>
          </Form.Item>

          <Form.Item name={"stepPersonality"} label={<b>Persönlichkeit des Blocks</b>}>
            <TextArea></TextArea>
          </Form.Item>

          {(stepType == AssistantType.QAA)? <QaAInput ref={rootRef} /> : <ChatInput />}
        </Form>
      </Modal>
    </div>
  );
}