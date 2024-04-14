import Assistant from "../../../firebase/types/Assistant";
import React, { Dispatch, ReactComponentElement, SetStateAction, useEffect, useRef, useState } from "react";
import { MessageInstance } from "antd/es/message/interface";
import { NotificationInstance } from "antd/es/notification/interface";
import { Alert, Button, Card, Divider, Form, Input, Result, Skeleton } from "antd";
import { ArrowLeftOutlined, ArrowRightOutlined, HistoryOutlined } from "@ant-design/icons";
import { handleEmptyString, reduceCost, updateCompanyTokens } from "../../../helper/architecture";
import { isMobile } from "react-device-detect";
import { useRouter } from "next/router";
import styles from "./chatassistant.module.scss"
import axios from "axios";
import { toGermanCurrencyString, TokenCalculator } from "../../../helper/price";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { oneLight } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import Markdown from "react-markdown";
import moment from "moment/moment";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../db";

const { TextArea } = Input;

const MAXHISTITEMS = 10;
const MSGDURATION = 3;
const MAXCONTEXTSIZE = 32;


export enum MsgType {
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
    notificationApi: NotificationInstance,
    history: { state: any[], set: React.Dispatch<React.SetStateAction<any[]>> }
    predefinedState: { state: Array<any>, idx: number };
}) {
  const router = useRouter();
  const [ chatMsgs, setChatMsgs ] = useState<Array<ChatMsg>>([{ content: "Wie kann ich dir heute helfen?", type: MsgType.MODEL }]);
  const [ formDisabled, setFormDisabled ] = useState(props.formDisabled);
  const lastMsgRef = useRef<null | HTMLDivElement>(null);
  const [msgContext, setMsgContext ] = useState<Array<MsgContext>>([
    {
      role: "system",
      content: props.assistant.personality
    }
  ]);
  const [ calculator ] = useState(new TokenCalculator(props.context.calculations))
  const [ promptError, setPromptError ] = useState(false);

  const { user } = props.context;


  useEffect(() => {
    const element = lastMsgRef.current;
    if(element){
      element.scrollTop = element.scrollHeight;
    }
  }, [chatMsgs]);

  useEffect(() => {
    if(props.predefinedState.state && props.predefinedState.state.length > 0){
      setChatMsgs(props.predefinedState.state);
      const ctxt = [];
      props.predefinedState.state.forEach((pres) => {
        ctxt.push({ content: pres.content, role: "system" });
      });
      setMsgContext(ctxt);
    }
  }, [props.predefinedState]);


  const handleUserMsg = async (values: { chatmsg: string }) => {
    const localmsgs = [...chatMsgs];
    const localHist = [...props.history.state];

    if(localmsgs.length == 1){
      if(localHist.length >= MAXHISTITEMS){
        // If so remove last Element from array
        localHist.pop();
      }

      localHist.unshift({ content: localmsgs, time: moment(Date.now()).format("DD.MM.YYYY") });
    }

    //lastMsgRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    localmsgs.push({ content: values.chatmsg, type: MsgType.USER });
    localmsgs.push({ content: <Skeleton active/>, type: MsgType.MODEL });


    if(msgContext.length >= MAXCONTEXTSIZE){
      msgContext.shift();
    }

    msgContext.push({ content: values.chatmsg, role: "user" });

    setChatMsgs(localmsgs);

    setFormDisabled(true);


    const usedTokens = { in: 0, out: 0 };
    let cost = 0;

    const costbeforereq = await axios.post("/api/chat/count", { msgs: msgContext, content: values.chatmsg });

    try{
      if(costbeforereq) {
        const costbefore = costbeforereq.data.tokens;

        if(costbefore){
          try{
            await axios.post("/api/chat/generate", { msgContext: msgContext }, { onDownloadProgress: async (progressEvent) => {
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


                const costafterreq = await axios.post("/api/chat/count", { msgs: [], content: dataChunk });

                if(costafterreq){
                  const answerUsedTokens = costafterreq.data.tokens;

                  usedTokens.in = costbefore;
                  usedTokens.out = answerUsedTokens;

                  cost = calculator.cost(usedTokens);

                  // Hier muss noch die History geschrieben werden
                  // We need to check if the user already has 10 saved states
                  let histIndex = 0;
                  if(props.predefinedState.idx && props.predefinedState.idx != -1){
                    histIndex = props.predefinedState.idx;
                  }

                  localHist[histIndex] = { content: lmsgs, time: moment(Date.now()).format("DD.MM.YYYY") }

                  const encHistObj = await axios.post( "/api/prompt/encrypt", {
                    content: JSON.stringify(localHist),
                    salt: user.salt
                  } );
                  const encHist = encHistObj.data.message;

                  props.history.set(localHist);
                  const userhist = user.history;
                  // Set the history to the encoded string and update the user
                  userhist[props.assistant.uid] = encHist;
                  await updateDoc( doc( db, "User", props.context.login.uid ), { history: userhist } );
                    
                  reduceCost(props.context.company.tokens, cost);
                  await updateCompanyTokens(props.context, calculator, props.notificationApi, cost);

                  props.notificationApi.info({
                    message: "Creditverbrauch",
                    description: `Die Anfrage hat ${toGermanCurrencyString(cost)} verbraucht`,
                    duration: MSGDURATION
                  });
                }

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
        }else{
          throw("Costbefore undefined");
        }
      }else{
        throw("Costbreforereq undefined");
      }
    }catch (oe){
      console.log(oe);
      setPromptError( true );
      setFormDisabled(false);
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
              className={styles.msgsender}>{(msg.type == MsgType.MODEL) ? "KI" : `${user.firstname} ${user.lastname}`}</span>
            <div className={`${styles.chatmsg}`}>
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
        <Button onClick={() => {
          router.push("/")
        }} icon={<ArrowLeftOutlined/>}></Button>
        <div className={styles.msg}>Willkommen zurück, {handleEmptyString(user.firstname)}</div>
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
        <Form disabled={formDisabled} layout={"horizontal"} onFinish={handleUserMsg} className={styles.inputform}>
          <Form.Item className={styles.inputformitem} name={"chatmsg"} label={""}>
            <TextArea placeholder={"Worum geht es?"}></TextArea>
          </Form.Item>
            
          <Button className={styles.inputformbutton} type={"primary"} htmlType={"submit"}><ArrowRightOutlined /></Button>
        </Form>
      </div>
    </div>

  );
}