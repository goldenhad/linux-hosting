import { Button, Drawer, Form, List, message, notification, Typography } from "antd";
import React, { useEffect, useState } from "react";
import { useAuthContext } from "../../components/context/AuthContext";
import { GetServerSideProps } from "next";
import { getAllDocs } from "../../firebase/data/getData";
import Assistant, { AssistantType } from "../../firebase/types/Assistant";
import SidebarLayout from "../../components/Sidebar/SidebarLayout";
import styles from "../../components/AssistantBase/AssistantBase.module.scss";
import { useRouter } from "next/router";
import axios from "axios";
import { TokenCalculator } from "../../helper/price";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../db";
import QaAAssistant from "../../components/Assistants/QaAAssistant/QaAAssistant";
import ChatAssistant, { MsgType } from "../../components/Assistants/ChatAssistant/ChatAssistant";
import { CloseOutlined, EyeOutlined } from "@ant-design/icons";

// Defines how long antd messages will be visible
const MSGDURATION = 3;

// Defines the max amount of history states saved per user
const MAXHISTITEMS = 10;

const { Paragraph } = Typography;


/**
 * Update a field of a given form with the provided value
 * @param form Form containing the fields
 * @param field Field to be updated
 * @param value Value the field will be updated to
 */
function updateField( form, field: string, value: string ){
  if( value && value != "" ){
    form.setFieldValue( field, value );
  }
}


export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const assistantId = ctx.query.aid;

  if(assistantId){
    const assistantDocsQuery = await getAllDocs("Assistants");

    if(assistantDocsQuery.result){
      const assistantDocs: Array<Assistant> = assistantDocsQuery.result;

      const assistantIndex = assistantDocs.findIndex((value) => {
        return value.uid == assistantId;
      })

      if(assistantIndex != -1){
        const assistant = assistantDocs[assistantIndex];

        return {
          props: {
            assistant: assistant
          }
        }
      }else{
        return { props: {}, redirect: { destination: "/" } };
      }
    }else{
      return { props: {}, redirect: { destination: "/" } };
    }
  }else{
    return { props: {}, redirect: { destination: "/" } };
  }
}


export default function Assistant(props: { assistant: Assistant }) {
  const context = useAuthContext();
  const { login, user } = context;

  const [ decryptedProfiles, setDecryptedProfiles ] = useState( [] );
  const [ quotaOverused, setQuotaOverused ] =  useState( true );
  const [ renderAllowed, setRenderAllowed ] = useState( false );
  const [ tokenCountVisible, setTokenCountVisible ] = useState( false );
  const [ isAnswerVisible, setIsAnswerVisible ] = useState( false );
  const [ isLoaderVisible, setIsLoaderVisible ] = useState( false );
  const [ isAnswerCardVisible, setIsAnswerCardvisible ] = useState( false );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [ answer, setAnswer ] = useState( "" );
  const [ formDisabled, setFormDisabled ] = useState( false );
  const [messageApi, contextHolder] = message.useMessage();
  const [ promptError, setPromptError ] = useState( false );
  const [ showAnswer, setShowAnswer ] = useState( false );
  const [ historyState, setHistoryState ] = useState([]);
  const [ cancleController, setCancleController ] = useState(new AbortController());
  const [ histOpen, setHistOpen ] = useState(false);
  const [ histloading, setHistloading ] = useState(false);
  //const [open, setOpen] = useState<boolean>( tourState  );
  const [notificationAPI, notificationContextHolder] = notification.useNotification();
  const [ calculator ] = useState(new TokenCalculator(context.calculations))
  const router = useRouter();
  const [ form ] = Form.useForm();
  const [ prefState, setPrefState ] = useState([]);
  const [ prefStateIdx, setPrefStateIdx ] = useState(-1);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;


  useEffect( () => {
    // Async function to init the usage of the company
    const createData = async () => {
      // Reset the overused state
      setQuotaOverused( false );
      // Call firebase to update the company with the initial token count
      await updateDoc( doc( db, "Company", user.Company ), { tokens: 0 } );
    }

    // If the company tokens are defined
    if( context.company.tokens != undefined ){
      // If the company tokens are greater as 0 or the company has unlimited token access
      if( context.company.tokens > 0 || context.company.unlimited ){
        // Reset the overused state
        setQuotaOverused( false );
      }else{
        // Otherwise the token are less than or equal than zero and we can show the user that they overused their quota
        setQuotaOverused( true );
      }
    }else{
      // If no quota is defined, create it.
      createData();
    }

  }, [context.company, context.user.Company, quotaOverused] );


  /**
   * Effect for decrypting the assistant history
   */
  useEffect( () => {
    // Async function to ask the api for decryption
    const decryptHistoy = async () => {
      // Init the history array
      let parsed = [];

      try{
        // Call the decryption api endpoint
        const decRequest = await axios.post( "/api/prompt/decrypt", {
          ciphertext: context.user.history[props.assistant.uid],
          salt: user.salt
        } )

        // Get the decrypted text from the api call
        const decryptedText = decRequest.data.message;
        // Parse the decrypted text as string array using the JSON parser
        parsed = JSON.parse( decryptedText ) as Array<string>;
      }catch( e ){
        console.log(e);
      }

      setHistoryState(parsed);
    }

    decryptHistoy();
    // eslint-disable-next-line
  }, [] );


  const updateHist = async () => {
    try{
      const encHistObj = await axios.post( "/api/prompt/encrypt", {
        content: JSON.stringify(historyState),
        salt: context.user.salt
      } );

      const encHist = encHistObj.data.message;

      // Check if the user previously had a history
      if(context.user.history){
        // If so get the history
        const userhist = context.user.history;
        // Set the history to the encoded string and update the user
        userhist[props.assistant.uid] = encHist;
        await updateDoc( doc( db, "User", context.login.uid ), { history: userhist } );
      }else{
        // If the user previously didn't have a history
        // Init the history
        const hist = {};
        // Update the history state of the assistant and update the user
        const encHist = encHistObj.data.message;
        hist[props.assistant.uid] = encHist;
        await updateDoc( doc( db, "User", context.login.uid ), { history: hist } );
      }
    }catch(e){
      console.log(e);
    }
  }

  const HistoryCard = () => {
    if(historyState.length > 0){
      if(props.assistant.type == AssistantType.QAA){
        return(
          <List
            bordered
            loading={histloading}
            dataSource={historyState}
            locale={{ emptyText: "Noch keine Anfragen" }}
            renderItem={(item: { content: string, time: string, tokens: string }, id) => {
              return(<List.Item>
                <div className={styles.singlehistitem}>
                  <Paragraph className={styles.histitem}>{item.content.slice(0, 100)}...</Paragraph>
                  <div className={styles.subcontent}>
                    <span>{item.time}</span>
                    <span>{(typeof item.tokens == "string")? item.tokens: 0}</span>
                    <Button icon={<EyeOutlined />} onClick={() => {
                      setHistOpen(false);
                      setIsAnswerCardvisible( true );
                      setShowAnswer( true );
                      setIsAnswerVisible( true );
                      setPromptError( false );
                      setAnswer(item.content);
                    }}></Button>
                    <Button icon={<CloseOutlined />} onClick={async () => {
                      setHistloading(true);
                      const locHistState= historyState;
                      locHistState.splice(id, 1);
                      setHistoryState(locHistState);

                      await updateHist();

                      setHistloading(false);
                    }}></Button>
                  </div>
                </div>
              </List.Item>
              );
            }}
          />
        );
      }else if(props.assistant.type == AssistantType.CHAT){
        console.log(historyState);
        return(
          <List
            bordered
            loading={histloading}
            dataSource={historyState}
            locale={{ emptyText: "Noch keine Anfragen" }}
            renderItem={(item: { content: Array<{content: string, type: MsgType}>, time: string }, id) => {
              return(<List.Item>
                <div className={styles.singlehistitem}>
                  <Paragraph className={styles.histitem}>
                    {(item.content.length > 1)? item.content[1].content.slice(0, 100): item.content[0].content.slice(0, 100)}...
                  </Paragraph>
                  <div className={styles.subcontent}>
                    <span>{item.time}</span>
                    <Button icon={<EyeOutlined />} onClick={() => {
                      setHistOpen(false);
                      setPrefState(item.content);
                      setPrefStateIdx(id);
                    }}></Button>
                    <Button icon={<CloseOutlined />} onClick={async () => {
                      setHistloading(true);
                      const locHistState= historyState;
                      locHistState.splice(id, 1);
                      setHistoryState(locHistState);

                      await updateHist();

                      setHistloading(false);
                    }}></Button>
                  </div>
                </div>
              </List.Item>
              );
            }}
          />
        );
      }else{
        console.log(props.assistant.type);
      }
    }else{
      return (<div className={styles.emptyhistory}>
        <h3>Noch keine Anfragen</h3>
      </div>);
    }
  }
  
  
  const getAssistantForm = () => {
    console.log(props.assistant.type);

    switch (props.assistant.type){
    case AssistantType.QAA:
      return <QaAAssistant
        assistant={props.assistant} 
        context={context} 
        quotaOverused={quotaOverused} 
        formDisabled={formDisabled} 
        setHistoryOpen={setHistOpen} 
        messageApi={messageApi}
        notificationApi={notificationAPI}
        history={{ state: historyState, set: setHistoryState }}
        predefinedState={{ state: prefState, idx: prefStateIdx }}
      />;
    case AssistantType.CHAT:
      return <ChatAssistant
        assistant={props.assistant}
        context={context}
        quotaOverused={quotaOverused}
        formDisabled={formDisabled}
        setHistoryOpen={setHistOpen}
        messageApi={messageApi}
        notificationApi={notificationAPI}
        history={{ state: historyState, set: setHistoryState }}
        predefinedState={{ state: prefState, idx: prefStateIdx }}
      />;
    }
  }


  return(
    <SidebarLayout context={context} hist={setHistOpen}>
      {contextHolder}
      {notificationContextHolder}
      <div className={styles.main}>
        {getAssistantForm()}
      </div>
      <Drawer
        title={`Bisherige Anfragen ${historyState.length}/${MAXHISTITEMS}`}
        placement={"right"}
        closable={true}
        onClose={() => {
          setHistOpen(false)
        }}
        open={histOpen}
      >
        <HistoryCard />
      </Drawer>
    </SidebarLayout>
  );
}
