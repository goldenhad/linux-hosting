import React, { Dispatch, ReactComponentElement, SetStateAction, useEffect, useRef, useState } from "react";
import Assistant, { InputBlock } from "Shared/Firebase/types/Assistant";
import { MessageInstance } from "antd/es/message/interface";
import { NotificationInstance } from "antd/es/notification/interface";
import { Button, Form, Input, Result, Skeleton } from "antd";
import moment from "moment/moment";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { oneLight } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import Markdown from "react-markdown";
import { default as chatbotImage } from "../../../public/chat-bot.png";
import { API } from "../services";


const { TextArea } = Input;
const MAXCONTEXTSIZE = 3;


export enum MsgType {
  MODEL = "system",
  USER = "user",
  ASSISTANT = "assistant"
}

const QUERY_CHAT_API_KEY = "d41193ba5c6cc53063c97ea64432c7ca1437708d6facb5df613b292b9e619c99e276b143ae6c9194fd6a0da9b6ebf0ac8e801e74b5438a4d02e3165db58ba264";

interface ChatMsg {
  content: string | undefined | ReactComponentElement<any>,
  type: MsgType,
  date: Date,
}

interface MsgContext {
  role: string,
  content: string,
  date: Date,
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
  const [chatMsgs, setChatMsgs] = useState<Array<ChatMsg>>([
    {
      content: ((props.assistant.blocks[0] as InputBlock).initialMessage) ?
        (props.assistant.blocks[0] as InputBlock).initialMessage : "Wie kann ich dir heute helfen?",
      type: MsgType.MODEL,
      date: new Date()
    }]);
  const [formDisabled, setFormDisabled] = useState(props.formDisabled);
  const lastMsgRef = useRef<null | HTMLDivElement>(null);
  const [msgContext, setMsgContext] = useState<Array<MsgContext>>([]);
  const [promptError, setPromptError] = useState(false);
  const [form] = Form.useForm();


  useEffect(() => {
    const element = lastMsgRef.current;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [chatMsgs]);

  const getPrimaryColor = () => {
    if (props.assistant.primaryColor) {
      return props.assistant.primaryColor;
    } else {
      return "#0f4faa";
    }
  }

  const getTextColor = () => {
    if (props.assistant.primaryColor) {
      const c = props.assistant.primaryColor.substring(1);      // strip #
      const rgb = parseInt(c, 16);   // convert rrggbb to decimal
      const r = (rgb >> 16) & 0xff;  // extract red
      const g = (rgb >> 8) & 0xff;  // extract green
      const b = (rgb >> 0) & 0xff;  // extract blue

      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

      if (luma <= 220) {
        return "white";
      } else {
        return "black";
      }


    } else {
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
      content: props.assistant.blocks[0].personality,
      date: new Date()
    });


    localmsgs.push({ content: values.chatmsg, type: MsgType.USER, date: new Date() });
    localmsgs.push({ content: <Skeleton active />, type: MsgType.MODEL, date: new Date() });

    // We add one here to ignore the assistants personality
    if (msgContext.length >= MAXCONTEXTSIZE) {
      msgContext.shift();
    }

    msgContext.push({ content: values.chatmsg, role: "user", date: new Date() });
    setChatMsgs(localmsgs);

    setFormDisabled(true);


    try {
      await API.post("api/v1/query/chat", {
        aid: props.assistant.uid,
        query: values.chatmsg,
        messages: relevantcontext
      }, {
        headers: {
          "x-api-key": QUERY_CHAT_API_KEY
        },
        onDownloadProgress: async (progressEvent) => {
          const lmsgs = [...localmsgs];
          let dataChunk: string = progressEvent.event?.currentTarget.response;

          const parseRegEx = /(?<=<~).+?(?=~>)/g;
          const parsedval = dataChunk.match(parseRegEx);

          // part that runs after the stop flag was found...
          if (parsedval && parsedval.length == 1) {
            dataChunk = dataChunk.replace(`<~${parsedval[0]}~>`, "");
            const topMostIndex = lmsgs.length - 1;
            lmsgs[topMostIndex] = { content: dataChunk, type: MsgType.MODEL, date: new Date() };

            if (msgContext.length >= MAXCONTEXTSIZE) {
              msgContext.shift();
            }

            msgContext.push({ content: dataChunk, role: "assistant", date: new Date() });

            setChatMsgs(lmsgs);
          } else {
            const topMostIndex = lmsgs.length - 1;
            lmsgs[topMostIndex] = { content: dataChunk + "█", type: MsgType.MODEL, date: new Date() };
            setChatMsgs(lmsgs);
          }

        }
      });

      setFormDisabled(false);
    } catch (e) {
      console.log(e);
      setPromptError(true);
    }
  }

  const onEnterPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    const key = event.key;
    // If the user has pressed enter
    if (key === "Enter" && !event.shiftKey) {
      form.submit();
    }
  }

  const ChatMessages = () => {
    return chatMsgs.map((msg: ChatMsg) => {
      return (<>
        <div className="chat">
          <div
            className={`msgrow ${(msg.type == MsgType.USER) ? "message message-small" : "message"}`}
          >
            {(typeof msg.content == "string") ? <Markdown
              skipHtml={true}
              remarkPlugins={[remarkBreaks, remarkGfm]}
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
            </Markdown> : msg.content}
          </div>
          <div className={`time ${(msg.type == MsgType.USER) ? " time-left" : "time-right"}`}>{moment(msg.date).format("HH:mm")}</div>
        </div>

      </>);
    })
  }

  const Err = () => {
    return (
      <Result
        status="error"
        title="Fehler"
        subTitle="Ein Fehler ist aufgetreten. Bitte versuche es später erneut!"
      ></Result>
    );
  }

  return (
    <>
      <div className="content" ref={lastMsgRef}>
        {(promptError) ? <Err />
          : <ChatMessages />}
        <div className="main-chat" >
          <div className="chat-input">
            <img src={chatbotImage} className="chatbot-icon" />
            <Form form={form} disabled={formDisabled} layout={"horizontal"} onFinish={handleUserMsg} className="inputform">
              <Form.Item className="inputformitem" name={"chatmsg"} label={""}>
                <TextArea onKeyUp={onEnterPress} className="area" autoSize={false} placeholder={"Worum geht es?"} />
              </Form.Item>

              <div className="send-btn">
                <Button
                  className="inputformbutton"
                  type={"primary"}
                  style={{ backgroundColor: getPrimaryColor(), color: getTextColor() }}
                  onClick={() => {

                    form.submit();
                  }}
                >
                  Send
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </div>

    </>
  );
  return null;
}