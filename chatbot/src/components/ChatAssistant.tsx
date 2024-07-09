import React, { Dispatch, ReactComponentElement, SetStateAction, useEffect, useRef, useState } from "react";
import Assistant, { AssistantType, InputBlock } from "Shared/Firebase/types/Assistant";
import { MessageInstance } from "antd/es/message/interface";
import { NotificationInstance } from "antd/es/notification/interface";
import { Button, Divider, Form, Input, Result, Skeleton } from "antd";
import { ArrowLeftOutlined, HistoryOutlined, RightOutlined } from "@ant-design/icons";
import { isMobile } from "react-device-detect";
import styles from "./chatassistant.module.scss"
import axios from "axios";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { oneLight } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import Markdown from "react-markdown";
import { getAssistantImageUrl } from "Shared/Firebase/drive/upload_file";
import { useExtractColor } from "react-extract-colors";

const { TextArea } = Input;

const MAXHISTITEMS = 10;
const MSGDURATION = 3;
const MAXCONTEXTSIZE = 3;


export enum MsgType {
    MODEL = "system",
    USER = "user",
    ASSISTANT = "assistant"
}

interface ChatMsg {
    content: string | ReactComponentElement<any>,
    type: MsgType
}

interface MsgContext {
    role: string,
    content: string
}

export default function ChatAssistant(props: {
    assistant: Assistant,
    formDisabled: boolean,
    setHistoryOpen: Dispatch<SetStateAction<boolean>>,
    messageApi: MessageInstance,
    notificationApi: NotificationInstance,
    history: { state: any[], set: React.Dispatch<React.SetStateAction<any[]>> }
    predefinedState: { state: Array<any>, idx: number };
}) {
  const [ chatMsgs, setChatMsgs ] = useState<Array<ChatMsg>>([
    {
      content: ((props.assistant.blocks[0] as InputBlock).initialMessage)?
        (props.assistant.blocks[0] as InputBlock).initialMessage: "Wie kann ich dir heute helfen?", type: MsgType.MODEL
    }]);
  const [ formDisabled, setFormDisabled ] = useState(props.formDisabled);
  const lastMsgRef = useRef<null | HTMLDivElement>(null);
  const [msgContext, setMsgContext ] = useState<Array<MsgContext>>([]);
  const [ promptError, setPromptError ] = useState(false);
  const [form] = Form.useForm();
  const [image, setImage] = useState("");


  useEffect(() => {
    const element = lastMsgRef.current;
    if(element){
      element.scrollTop = element.scrollHeight;
    }
  }, [chatMsgs]);

  /**
   * Effect to load the provided assistant image.
   * If no image was provided use the base svg image
   */
  useEffect(() => {
    const loadImage = async () => {
      const url = await getAssistantImageUrl(props.assistant.uid);
      //const url = `/api/assistant/image?aid=${props.assistant.uid}`;
      if(url){
        setImage(url);
      }else{
        setImage("/base.svg")
      }
    }

    loadImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const getPrimaryColor = () => {
    if(props.assistant.primaryColor){
      return props.assistant.primaryColor;
    }else{
      return "#0f4faa";
    }
  }

  const { dominantColor } = useExtractColor(image);
  useEffect(() => {
    console.log(dominantColor)
  }, [image]);

  const getTextColor = () => {
    if(props.assistant.primaryColor){
      const c = props.assistant.primaryColor.substring(1);      // strip #
      const rgb = parseInt(c, 16);   // convert rrggbb to decimal
      const r = (rgb >> 16) & 0xff;  // extract red
      const g = (rgb >>  8) & 0xff;  // extract green
      const b = (rgb >>  0) & 0xff;  // extract blue

      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

      if (luma <= 220) {
        return "white";
      }else{
        return "black";
      }


    }else{
      return "white";
    }
  }

  const handleUserMsg = async (values: { chatmsg: string }) => {
    const localmsgs = [...chatMsgs];
    form.setFieldValue("chatmsg", "");

    const relevantcontext = [...msgContext];
    // Add the personality to the front of the msg context;
    relevantcontext.unshift({
      role: "system",
      content: props.assistant.blocks[0].personality
    });


    //lastMsgRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    localmsgs.push({ content: values.chatmsg, type: MsgType.USER });
    localmsgs.push({ content: <Skeleton active/>, type: MsgType.MODEL });

    console.log(msgContext.length);
    // We add one here to ignore the assistants personality
    if(msgContext.length >= MAXCONTEXTSIZE){
      msgContext.shift();
    }

    msgContext.push({ content: values.chatmsg, role: "user" });
    setChatMsgs(localmsgs);

    setFormDisabled(true);

    const usedTokens = { in: 0, out: 0 };
    let cost = 0;

    try{
      await axios.post("/api/v1/query/chat", {
        aid: props.assistant.uid,
        query: values.chatmsg,
        messages: relevantcontext,
      }, {
        onDownloadProgress: async (progressEvent) => {
          const lmsgs = [...localmsgs];
          let dataChunk: string = progressEvent.event?.currentTarget.response;

          const parseRegEx = /(?<=<~).+?(?=~>)/g;
          const parsedval = dataChunk.match(parseRegEx);

          // part that runs after the stop flag was found...
          if(parsedval && parsedval.length == 1){
            dataChunk = dataChunk.replace(`<~${parsedval[0]}~>`, "");
            const topMostIndex = lmsgs.length-1;
            lmsgs[topMostIndex] = { content: dataChunk, type: MsgType.MODEL };

            if(msgContext.length >= MAXCONTEXTSIZE){
              msgContext.shift();
            }

            msgContext.push({ content: dataChunk, role: "assistant" });

            setChatMsgs(lmsgs);
          }else{
            const topMostIndex = lmsgs.length-1;
            lmsgs[topMostIndex] = { content: dataChunk + "█", type: MsgType.MODEL };
            setChatMsgs(lmsgs);
          }

        }
      });

      setFormDisabled(false);
    }catch (e){
      console.log(e);
      setPromptError(true);
    }
  }
  
  const ChatMessages = () => {
    return chatMsgs.map((msg: ChatMsg, idx) => {
      return (
        <div
          key={idx}
          className={`${styles.msgrow} ${(msg.type == MsgType.USER) ? styles.usermsg : styles.systemmsg}`}
        >
          <div className={styles.msgcontainer}>
            <span
              className={styles.msgsender}>{(msg.type == MsgType.MODEL) ? `${props.assistant.name}` : `Anonymous`}</span>
            <div className={`${styles.chatmsg}`} style={{ backgroundColor: getPrimaryColor(), color: getTextColor() }}>
              { (typeof msg.content == "string")? <Markdown
                skipHtml={true}
                remarkPlugins={[ remarkBreaks, remarkGfm ]}
                components={{
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  code: function ({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "")
                    return match ? (
                      <SyntaxHighlighter
                        language={match[1]}
                        style={oneLight}
                        {...props}
                      >{String(children).replace(/\n$/, "")}</SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {msg.content as string}
              </Markdown>: msg.content}

            </div>
          </div>
        </div>
      );
    })
  }

  const Err = () => {
    return(
      <Result
        status="error"
        title="Fehler"
        subTitle="Ein Fehler ist aufgetreten. Bitte versuche es später erneut!"
      ></Result>
    );
  }

  return (
    <div className={styles.welcomemessage}>
      <div className={styles.messagcnt}>
        <div className={styles.backbutton}>
          <Button onClick={() => {
          }} icon={<ArrowLeftOutlined/>}></Button>
          <div className={styles.msg}>Zur Übersicht</div>
        </div>

        <div className={styles.headerimagecontainer}>
          <img width={50} height={50} className={styles.headerimage} src={image} />
          <div>
            Willkommen beim {props.assistant.name}
          </div>
        </div>

        {(!isMobile && window.innerWidth >= 992) ?
          <Button className={styles.histbutton} onClick={() => {
            props.setHistoryOpen(true)
          }} icon={
            <HistoryOutlined/>}>{`Bisherige Anfragen ${props.history.state.length}/${MAXHISTITEMS}`}</Button> : <></>
        }
      </div>
      <Divider className={styles.welcomeseperator}/>

      <div className={styles.chatwindow} ref={lastMsgRef}>
        {(promptError)? <Err />
          : <ChatMessages />}
      </div>
      <div className={styles.inputwindow}>
        <Form form={form} disabled={formDisabled} layout={"horizontal"} onFinish={handleUserMsg} className={styles.inputform}>
          <Form.Item className={styles.inputformitem} name={"chatmsg"} label={""}>
            <TextArea className={styles.area} autoSize={true} placeholder={"Worum geht es?"}></TextArea>
          </Form.Item>

          <Button
            className={styles.inputformbutton}
            type={"primary"}
            style={{ backgroundColor: getPrimaryColor(), color: getTextColor() }}
            onClick={() => {
              
                form.submit();
            }}
          >
            <RightOutlined />
          </Button>
        </Form>
      </div>
    </div>

  );
}