import { Alert, Button, Card, Divider, Form, List, Result, Skeleton, Tour, TourProps, message, Typography, Drawer } from "antd";
import axios from "axios";
import styles from "./AssistantBase.module.scss";
import { createContext, useEffect, useState } from "react";
import { History, User } from "../../firebase/types/User";
import { Company } from "../../firebase/types/Company";
import { Profile } from "../../firebase/types/Profile";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../db";
import Info from "../../public/icons/info.svg";
import Icon, { ArrowLeftOutlined, EyeOutlined, HistoryOutlined } from "@ant-design/icons";
import SidebarLayout from "../Sidebar/SidebarLayout";
import { useRouter } from "next/router";
import { handleEmptyString, handleUndefinedTour, normalizeTokens } from "../../helper/architecture";
import FatButton from "../FatButton";
import Clipboard from "../../public/icons/clipboard.svg";
import updateData from "../../firebase/data/updateData";
import { encode } from "gpt-tokenizer";
import moment from "moment";
import { isMobile } from "react-device-detect";

const { Paragraph } = Typography;


function updateField( form, field: string, value: string ){
  if( value && value != "" ){
    form.setFieldValue( field, value );
  }
}

export const AssistantContext = createContext({ 
  decryptedProfiles: [],
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  getProfiles: () => {
    return [] 
  },
  getPrompt: () => {
    return <></>
  },
  Answer: () => {
    return <></>
  },
  requestState: { 
    quotaOverused: true,
    renderAllowed: false,
    formDisabled: false
  }
})

const AssistantBase = (props: { 
    children,
    context: {user: User, company: Company,  login, role, profile}
    name,
    laststate,
    basicState: Record<string, string>,
    Tour: TourProps["steps"],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    promptFunction: (values: Record<string, any>, profile: Profile) => void,
    routes: { count: string, generate: string }
    form
}) => {
  const [ decryptedProfiles, setDecryptedProfiles ] = useState( [] );
  const [ quotaOverused, setQuotaOverused ] =  useState( true );
  const [ renderAllowed, setRenderAllowed ] = useState( false );
  const [ tokenCountVisible, setTokenCountVisible ] = useState( false );
  const [ isAnswerVisible, setIsAnswerVisible ] = useState( false );
  const [ isLoaderVisible, setIsLoaderVisible ] = useState( false );
  const [ isAnswerCardVisible, setIsAnswerCardvisible ] = useState( false );
  const [ tokens, setTokens ] = useState( "" );
  const [ answer, setAnswer ] = useState( "" );
  const [ formDisabled, setFormDisabled ] = useState( false );
  const [messageApi, contextHolder] = message.useMessage();
  const [ promptError, setPromptError ] = useState( false );
  const [ showAnswer, setShowAnswer ] = useState( false );
  const [ historyState, setHistoryState ] = useState([]);
  const [ cancleController, setCancleController ] = useState(new AbortController());
  const [ histOpen, setHistOpen ] = useState(false);
  const [open, setOpen] = useState<boolean>( !handleUndefinedTour( props.context.user.tour ).blog );
  const router = useRouter();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;


  useEffect( () => {
        
    const decryptAndParse = async () => {
      let parsed = props.basicState;
      try{
        const decRequest = await axios.post( "/api/prompt/decrypt", {
          ciphertext: props.context.user.lastState[props.laststate],
          salt: props.context.user.salt
        } )
    
        const decryptedText = decRequest.data.message;
        parsed = JSON.parse( decryptedText );
      }catch( e ){
        //console.log(e);
      }

      Object.keys(props.basicState).forEach((field) => {
        updateField(props.form, field, parsed[field] );
      })
    }
    
    decryptAndParse();
    // eslint-disable-next-line
}, [] );

  useEffect( () => {
        
    const decryptHistoy = async () => {
      let parsed = [];
      try{
        const decRequest = await axios.post( "/api/prompt/decrypt", {
          ciphertext: props.context.user.history[props.laststate],
          salt: props.context.user.salt
        } )
  
        const decryptedText = decRequest.data.message;
        parsed = JSON.parse( decryptedText ) as Array<string>;
      }catch( e ){
      //console.log(e);
      }

      setHistoryState(parsed);
    }
  
    decryptHistoy();
  // eslint-disable-next-line
}, [] );

  useEffect( () => {
    const decryptProfiles = async () => {
      const profilearr: Array<Profile> = [];
    
      for( let i = 0; i < props.context.user.profiles.length; i++ ){
        let profilejson = "";
        try{
          const decoded = await axios.post( "/api/prompt/decrypt", { 
            ciphertext: props.context.user.profiles[i],
            salt: props.context.user.salt
          } );
          profilejson = decoded.data.message;
        }catch( e ){
          profilejson = "";
        }
            
        try{
          const singleProfile: Profile = JSON.parse( profilejson );
          profilearr.push( singleProfile );
        }catch(e){
          console.log("Could not decode profile...");
        }
      }
    
      setDecryptedProfiles( profilearr );
    }
    
    if( props.context.user.profiles ){
      decryptProfiles();
    }
  }, [props.context.user.profiles, props.context.user.salt] );

  useEffect( () => {

    const createData = async () => {
      setQuotaOverused( false );
      //console.log("Creating new Quota...");
      await updateDoc( doc( db, "Company", props.context.user.Company ), { tokens: 0 } );
    }

    if( props.context.company.tokens != undefined ){
      if( props.context.company.tokens > 0 || props.context.company.unlimited ){
        setQuotaOverused( false );
      }else{
        setQuotaOverused( true );
      }
    }else{
      createData();
    }
      
  }, [props.context.company, props.context.user.Company, quotaOverused] );

  useEffect( () => {
    if( props.context.user ){
      setRenderAllowed( true );
    }
  }, [props.context.user] )


  const getPrompt = () => {
    if( props.context.user && props.context.user.profiles != undefined ){
      if( !( props.context.user.profiles.length > 0 ) ){
        return (
          <Result
            title="Bitte definiere zuerst ein Profil"
            extra={
              <Button href='/profiles' type="primary" key="console">
                Profil erstellen
              </Button>
            }
          />
        );
      }else{
        return props.children;
      }
    }
  }

  const getProfiles = () => {
    const profileOptions =  decryptedProfiles.map( ( singleProfile: Profile, idx: number ) => {
      return {
        key: idx,
        value: singleProfile.name
      }
    } );
  
    return profileOptions;
  }

  const Answer = () => {

    const TokenInfo = () => {
      if(tokenCountVisible){
        return(
          <div className={styles.tokeninfo}>
            <Icon component={Info} className={styles.infoicon} viewBox='0 0 22 22' />
            Die Anfrage hat {normalizeTokens(parseFloat(tokens))} Credits verbraucht
          </div>
        );
      }
    }

    if(isAnswerVisible){
      return (
        <>
          <div className={styles.answer} style={{ transition: "all 0.5s ease" }} >{answer}</div>
          <TokenInfo />
        </>
      );
    }else if(isLoaderVisible){
      return(<Skeleton active/>);
    }else if(promptError){
      return(
        <Alert type='error' message="Bei der Generierung der Anfrage ist etwas schiefgelaufen. Bitte versuche es später erneut!" />
      );
    }else{
      return (<></>);
    }
  }

  const generateAnswer = async ( values ) => {
    const profile = decryptedProfiles.find( ( singleProfile: Profile ) => {
      return singleProfile.name == values.profile;
    } );

    if( profile ) {
      try{
        setFormDisabled( true );
        setIsAnswerCardvisible( true );
        setIsLoaderVisible( true );
        setShowAnswer( true );
        setIsAnswerVisible( false );
        setPromptError( false );
        setTokens( "" );

        const cookieobject = props.basicState;

        Object.keys(props.basicState).forEach((field) => {
          cookieobject[field] = values[field];
        })

        let blogObj = "";
        
        try{
          blogObj = JSON.stringify( cookieobject );
        }catch( e ){
          blogObj = JSON.stringify( props.basicState );
        }

        let encContent = "";
        try{
          const encData = await axios.post( "/api/prompt/encrypt", {
            content: blogObj,
            salt: props.context.user.salt
          } );

          encContent = encData.data.message;
        }catch{
          encContent = "";
        }

        const newUser = props.context.user;
        newUser.lastState[props.laststate] = encContent;
        await updateData( "User", props.context.login.uid, newUser );

        let isFreed = false;
        let usedTokens = 0;

        const promptdata = props.promptFunction( values, profile )

        //Calculate the cost of the input
        const costbeforereq = await axios.post(props.routes.count, promptdata);
        
        if(costbeforereq){
          const costbefore = costbeforereq.data.tokens;

          if(costbefore){
            let localtext = "";
            let localAnswer = "";

            try{
              await axios.post( props.routes.generate, promptdata,
                { onDownloadProgress: (progressEvent) => {
                  if(!isFreed){
                    setIsLoaderVisible( false );
                    setIsAnswerVisible( true );
                    isFreed = true;
                  }
                  let dataChunk: string = progressEvent.event?.currentTarget.response;
                  localtext = dataChunk;

                  const parseRegEx = /(?<=<~).+?(?=~>)/g;
                  const parsedval = dataChunk.match(parseRegEx);
                  
                  if(parsedval && parsedval.length == 1){
                    dataChunk = dataChunk.replace(`<~${parsedval[0]}~>`, "");
                    localAnswer = dataChunk;
                  
                    setTokens(usedTokens.toString());
                    setTokenCountVisible(true);
                  
                    setAnswer(dataChunk);
                  }else{
                    const tokensused = encode(localtext).length;
                    usedTokens = costbefore + tokensused;
                    setAnswer(dataChunk + "█");
                    localAnswer = dataChunk;
                  }
                  
                }, signal: cancleController.signal
                });

              
            }catch(e){
              if(axios.isCancel(e)){
                setTokens(usedTokens.toString());
                setCancleController(new AbortController);
              }
            }


            if(localAnswer != ""){
              if(historyState.length >= 10){
              // Remove last Element from array
                historyState.pop();
              }
  
              historyState.unshift({ content: localAnswer, time: moment(Date.now()).format("DD.MM.YYYY"), tokens: usedTokens });
  
              const encHistObj = await axios.post( "/api/prompt/encrypt", {
                content: JSON.stringify(historyState),
                salt: props.context.user.salt
              } );
    
              const encHist = encHistObj.data.message;
    
              if(props.context.user.history){
                const userhist = props.context.user.history;
                userhist[props.laststate] = encHist;
                await updateDoc( doc( db, "User", props.context.login.uid ), { history: userhist } );
              }else{
                const hist: History = {
                  monolog: "",
                  dialog: "",
                  blog: ""
                };
                const encHist = encHistObj.data.message;
                hist[props.laststate] = encHist;
                await updateDoc( doc( db, "User", props.context.login.uid ), { history: hist } );
              }
            }


            try{
              await axios.post( "/api/stats", { tokens: usedTokens, time: usedTokens, type: props.name } );
            }catch( e ){
              //console.log(e);
              //console.log("Timing logging failed!");
            }

            if( props.context.company.tokens - usedTokens <= 0 ){
              props.context.company.tokens = 0;
            }else{
              props.context.company.tokens -= usedTokens
            }

            await updateDoc( doc( db, "Company", props.context.user.Company ), { tokens: props.context.company.tokens } );

            const userusageidx = props.context.user.usedCredits.findIndex( ( val ) => {
              return val.month == currentMonth && val.year == currentYear
            } );

            if( userusageidx != -1 ){
              const usageupdates = props.context.user.usedCredits;
              usageupdates[userusageidx].amount += usedTokens;
              await updateDoc( doc( db, "User", props.context.login.uid ), { usedCredits: usageupdates } );
            }else{
              const usageupdates = props.context.user.usedCredits;
              usageupdates.push( { month: currentMonth, year: currentYear, amount: usedTokens } );
              await updateDoc( doc( db, "User", props.context.login.uid ), { usedCredits: usageupdates } );
            }
          }else{
            throw("Costbefore undefined");
          }
        }else{
          throw("Costbreforereq undefined");
        }

        
  
      }catch( e ){
        console.log(e);
        setTokens( "" );
        setIsLoaderVisible( false );
        setPromptError( true );
      }
  
      setFormDisabled( false );
    }
  }

  const HistoryCard = () => {
    if(historyState.length > 0){
      return(
        <List
          bordered
          dataSource={historyState}
          locale={{ emptyText: "Noch keine Anfragen" }}
          renderItem={(item: { content: string, time: string, tokens: string }) => (
            <List.Item>
              <div className={styles.singlehistitem}>
                <Paragraph className={styles.histitem}>{item.content.slice(0, 100)}...</Paragraph>
                <div className={styles.subcontent}>
                  <span>{item.time}</span>
                  <span>Credits: {normalizeTokens(parseFloat(item.tokens))}</span>
                  <Button icon={<EyeOutlined />} onClick={() => {
                    setHistOpen(false);
                    setIsAnswerCardvisible( true );
                    setShowAnswer( true );
                    setIsAnswerVisible( true );
                    setPromptError( false );
                    setTokens( "" );
                    setAnswer(item.content);
                  }}></Button>
                </div>
              </div>
            </List.Item>
          )}
        />
      );
    }else{
      return <></>;
    }
  }


  const histButton = () => {
    return (
      <div className={styles.histbutton}>
        <Icon component={HistoryOutlined} onClick={() => {
          setHistOpen(true)
        }} />
      </div>
    );
  }

  return (
    <AssistantContext.Provider value={{
      decryptedProfiles: decryptedProfiles,
      getProfiles: getProfiles,
      getPrompt: getPrompt,
      Answer: Answer,
      requestState: { quotaOverused: quotaOverused, formDisabled: formDisabled, renderAllowed: renderAllowed }
    }}
    >
      {contextHolder}
      <SidebarLayout context={props.context} hist={setHistOpen}>
        <div className={styles.main}>
          <div className={styles.welcomemessage}>
            <div className={styles.messagcnt}>
              <Button onClick={() => {
                router.push( "/" ) 
              }} icon={<ArrowLeftOutlined />}></Button>
              <div className={styles.msg}>Willkommen zurück, {handleEmptyString( props.context.user.firstname )}</div>
              {(!isMobile && window.innerWidth >= 992)? 
                <Button className={styles.histbutton} onClick={() => {
                  setHistOpen(true)
                }} icon={<HistoryOutlined />}>Bisherige Anfragen</Button>: <></>  
              }
            </div>
            <Divider className={styles.welcomeseperator} />
          </div>

          <div className={( !showAnswer )? styles.userinputformcontainer: styles.hiddencontainer} >
            <Form layout='vertical' onFinish={generateAnswer} onChange={() => {
              setIsAnswerCardvisible( false ); setIsAnswerVisible( false ); setIsLoaderVisible( false )
            }} form={props.form}>
              {getPrompt()}
            </Form>
          </div>
          <div className={( showAnswer )? styles.userinputformcontainer: styles.hiddencontainer} >
            <Card
              className={styles.answercard}
              title={"Antwort"}
              style={{ display: ( isAnswerCardVisible )? "block": "none" }}
              extra={
                <div className={styles.clipboardextra} onClick={() => {
                  navigator.clipboard.writeText( answer ); messageApi.success( "Antwort in die Zwischenablage kopiert." );
                }}
                >
                  <Icon component={Clipboard} className={styles.clipboardicon} viewBox='0 0 22 22' />
                  In die Zwischenablage
                </div>
              }
            >
              <Answer />
            </Card>
            <div className={styles.formfootercontainer}>
              <div className={styles.generatebuttonrow}>
                <FatButton onClick={() => {
                  cancleController.abort();
                  setShowAnswer( false );
                  setTokenCountVisible(false);
                  setCancleController(new AbortController);
                }} text="Zurück" />
              </div>
            </div>
          </div>
          <Tour open={open} onClose={async () => {
            const currstate = props.context.user.tour;
            currstate.blog = true;
            updateData( "User", props.context.login.uid, { tour: currstate } );
            setOpen( false );
          }} steps={props.Tour} />
          <style>
            {"span.ant-select-selection-placeholder{font-size: 14px !important; font-weight: normal !important}"}
          </style>
        </div>
        <Drawer
          title="Bisherige Anfragen"
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
    </AssistantContext.Provider>
  )
}

export default AssistantBase;