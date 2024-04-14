import Assistant from "../../../firebase/types/Assistant";
import React, { Dispatch, ReactComponentElement, SetStateAction, useEffect, useRef, useState } from "react";
import { MessageInstance } from "antd/es/message/interface";
import { NotificationInstance } from "antd/es/notification/interface";
import { Button, Card, Divider, Form, Input, Skeleton } from "antd";
import { ArrowLeftOutlined, HistoryOutlined } from "@ant-design/icons";
import { handleEmptyString } from "../../../helper/architecture";
import { isMobile } from "react-device-detect";
import { useRouter } from "next/router";
import styles from "./chatassistant.module.scss"
import axios from "axios";

const { TextArea } = Input;

const MAXHISTITEMS = 10;


enum MsgType {
    MODEL,
    USER
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
    context,
    quotaOverused: boolean,
    formDisabled: boolean,
    setHistoryOpen: Dispatch<SetStateAction<boolean>>,
    messageApi: MessageInstance,
    notificationApi: NotificationInstance
}) {
  const router = useRouter();
  const [ historyState, setHistoryState ] = useState([]);
  const [ chatMsgs, setChatMsgs ] = useState<Array<ChatMsg>>([]);
  const [ formDisabled, setFormDisabled ] = useState(props.formDisabled);
  const lastMsgRef = useRef<null | HTMLDivElement>(null);
  const [msgContext, setMsgContext ] = useState<Array<MsgContext>>([
    {
      role: "system",
      content: props.assistant.personality
    }
  ])

  const { user } = props.context;


  useEffect(() => {
    const element = lastMsgRef.current;
    if(element){
      element.scrollTop = element.scrollHeight;
    }
  }, [chatMsgs]);


  const handleUserMsg = async (values: { chatmsg: string }) => {
    const localmsgs = [...chatMsgs];

    //lastMsgRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    localmsgs.push({ content: values.chatmsg, type: MsgType.USER });
    localmsgs.push({ content: <Skeleton active/>, type: MsgType.MODEL });

    msgContext.push({ content: values.chatmsg, role: "user" });
    setChatMsgs(localmsgs);

    setFormDisabled(true);


    try{
      await axios.post("/api/chat/generate", { msgContext: msgContext }, { onDownloadProgress: async (progressEvent) => {
        const lmsgs = [...localmsgs]
        const dataChunk: string = progressEvent.event?.currentTarget.response;
        const topMostIndex = lmsgs.length-1;
        lmsgs[topMostIndex] = { content: dataChunk, type: MsgType.MODEL };
        console.log(localmsgs);
        setChatMsgs(lmsgs);

        setFormDisabled(false);
      }
      });
    }catch (e){
      console.log(e);
    }

  }


  return (
    <div className={styles.welcomemessage}>
      <div className={styles.messagcnt}>
        <Button onClick={() => {
          router.push("/")
        }} icon={<ArrowLeftOutlined/>}></Button>
        <div className={styles.msg}>Willkommen zurück, {handleEmptyString(user.firstname)}</div>
        {(!isMobile && window.innerWidth >= 992) ?
          <Button className={styles.histbutton} onClick={() => {
            props.setHistoryOpen(true)
          }} icon={
            <HistoryOutlined/>}>{`Bisherige Anfragen ${historyState.length}/${MAXHISTITEMS}`}</Button> : <></>
        }
      </div>
      <Divider className={styles.welcomeseperator}/>

      <div className={styles.chatwindow} ref={lastMsgRef}>
        {chatMsgs.map((msg: ChatMsg, idx) => {
          return (
            <div
              key={idx}
              className={`${styles.msgrow} ${(msg.type == MsgType.USER) ? styles.usermsg : styles.systemmsg}`}
            >
              <div className={styles.msgcontainer}>
                <span
                  className={styles.msgsender}>{(msg.type == MsgType.MODEL) ? "KI" : `${user.firstname} ${user.lastname}`}</span>
                <div className={`${styles.chatmsg}`}>
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className={styles.inputwindow}>
        <Form disabled={formDisabled} layout={"horizontal"} onFinish={handleUserMsg} className={styles.inputform}>
          <Form.Item className={styles.inputformitem} name={"chatmsg"} label={""}>
            <TextArea placeholder={"..."}></TextArea>
          </Form.Item>
          <Form.Item className={styles.inputformbuttonitem}>
            <Button type={"primary"} htmlType={"submit"}>Absenden</Button>
          </Form.Item>
        </Form>
      </div>

    </div>

  );
}