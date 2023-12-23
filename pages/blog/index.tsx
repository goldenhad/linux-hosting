import { Card, Button, Form, Input, Select, Result, Skeleton, Alert, Divider, message, TourProps, Tour } from "antd";
import Icon, { ArrowLeftOutlined } from "@ant-design/icons";
import styles from "./index.module.scss"
import { db } from "../../db";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { GetServerSideProps } from "next";
import SidebarLayout from "../../components/Sidebar/SidebarLayout";
import { useAuthContext } from "../../components/context/AuthContext";
import { Profile } from "../../firebase/types/Profile";
import { doc, updateDoc } from "firebase/firestore";
import { handleEmptyString, handleUndefinedTour, listToOptions } from "../../helper/architecture";
import Info from "../../public/icons/info.svg";
import Clipboard from "../../public/icons/clipboard.svg";
import updateData from "../../firebase/data/updateData";
import axiosTime from "axios-time";
import { useRouter } from "next/router";
import { encode } from "gpt-tokenizer";

const { TextArea } = Input;
axiosTime( axios );


export interface InitialProps {
  Data: {
    currentMonth: number,
    currentYear: number,
  };
}

export const getServerSideProps: GetServerSideProps = async () => {
  const datum = new Date();

  return {
    props: {
      Data: {
        currentMonth: datum.getMonth() + 1,
        currentYear: datum.getFullYear()
      }
    }
  };

  
};

const blogBasicState = {
  profile: "",
  content: "",
  order: "",
  length: ""
}

export default function Blog( props: InitialProps ) {
  const context = useAuthContext();
  const { role, login, user, company, parameters } = context;
  const [ form ] = Form.useForm();
  const [ showAnswer, setShowAnswer ] = useState( false );
  const [ isAnswerVisible, setIsAnswerVisible ] = useState( false );
  const [ isLoaderVisible, setIsLoaderVisible ] = useState( false );
  const [ isAnswerCardVisible, setIsAnswerCardvisible ] = useState( false );
  const [ answer, setAnswer ] = useState( "" );
  const [ formDisabled, setFormDisabled ] = useState( false );
  const [ quotaOverused, setQuotaOverused ] =  useState( !false );
  const [messageApi, contextHolder] = message.useMessage();
  const [ tokens, setTokens ] = useState( "" );
  const [ promptError, setPromptError ] = useState( false );
  const [ decryptedProfiles, setDecryptedProfiles ] = useState( [] );
  const [ tokenCountVisible, setTokenCountVisible ] = useState( false );
  // eslint-disable-next-line
  const [ renderAllowed, setRenderAllowed ] = useState( false );
  const [open, setOpen] = useState<boolean>( !handleUndefinedTour( user.tour ).blog );
  const router = useRouter();
  const [ cancleController, setCancleController ] = useState(new AbortController());

  const profileRef = useRef( null );
  const continueRef = useRef( null );
  const classificationRef = useRef( null );
  const lengthRef = useRef( null );
  const generateRef = useRef( null );


  const steps: TourProps["steps"] = [
    {
      title: "Ein neuer Blogbeitrag",
      description: "Mit dem \"Blogbeitrag schreiben\"-Feature von Siteware.Mail kannst du mithilfe verschiedener Parameter einen Blogbeitrag erstellen. "+
      "Ich werde dir nun die wichtigsten Parameter vorstellen, damit du das Tool optimal nutzen kannst.",
      nextButtonProps: {
        children: "Weiter"
      },
      prevButtonProps: {
        children: "Zurück"
      }
    },
    {
      title: "Wer ist der Autor?",
      description: "Wähle das Autorenprofil aus, das den Schreibstil und die Persönlichkeit für deinen Blogbeitrag repräsentiert. "+
      "Du kannst Profile erstellen oder bearbeiten, indem du zur Seitenleiste gehst und den Punkt \"Profil\" auswählst.",
      target: () => profileRef.current,
      nextButtonProps: {
        children: "Weiter"
      },
      prevButtonProps: {
        children: "Zurück"
      }
    },
    {
      title: "Thema des Blogbeitrags",
      description: "Beschreibe kurz das Thema deines Blogbeitrags. Stichpunkte reichen oft aus. Bedenke, dass präzise Formulierungen "+
      "zu genauen Antworten führen, während mehr Freiraum dem Algorithmus für Tonalität und Formulierung gibt. Experimentiere mit verschiedenen "+
      "Eingabestilen, um den besten Ansatz für dich zu finden.",
      target: () => continueRef.current,
      nextButtonProps: {
        children: "Weiter"
      },
      prevButtonProps: {
        children: "Zurück"
      }
    },
    {
      title: "Schreibstil definieren",
      description: "Gib bis zu drei Aspekte an, die die Einordnung des Lesers und damit den Schreibstil des Beitrags konkret beschreiben. Entscheide über Formalität, "+
      "Freundlichkeit, Professionalität und persönliche Note. Diese Entscheidungen beeinflussen maßgeblich die Wahrnehmung deiner Leser.",
      target: () => classificationRef.current,
      nextButtonProps: {
        children: "Weiter"
      },
      prevButtonProps: {
        children: "Zurück"
      }
    },
    {
      title: "Länge des Blogbeitrags",
      description: "Wähle die gewünschte Länge deines Blogbeitrags aus.",
      target: () => lengthRef.current,
      nextButtonProps: {
        children: "Weiter"
      },
      prevButtonProps: {
        children: "Zurück"
      }
    },
    {
      title: "Alles bereit",
      description: "Nach einem Klick auf den \"Blogbeitrag generieren\"-Button wird nach kurzer Wartezeit ein fertiger Blogbeitrag erstellt. "+
      "Beachte, dass deine Eingaben verarbeitet werden müssen, was zu kurzen Wartezeiten führen kann.",
      target: () => generateRef.current,
      nextButtonProps: {
        children: "Alles klar",
        onClick: async () => {
          const currState = user.tour;
          currState.blog = true;
          updateData("User", login.uid, { tour: currState });
        }
      },
      prevButtonProps: {
        children: "Zurück"
      }
    }
  ];

  useEffect( () => {
    const updateField = ( field: string, value: string ) => {
      if( value && value != "" ){
        form.setFieldValue( field, value );
      }
    }
    
    const decryptAndParse = async () => {
      let parsed = blogBasicState;
      try{
        const decRequest = await axios.post( "/api/prompt/decrypt", {
          ciphertext: user.lastState.blog,
          salt: user.salt
        } )

        const decryptedText = decRequest.data.message;
        parsed = JSON.parse( decryptedText );
        //console.log(parsed);
      }catch( e ){
        //console.log(e);
      }

      updateField( "content", parsed.content );
      updateField( "profile", parsed.profile );
      updateField( "order", parsed.order );
      updateField( "length", parsed.length );
    }

    decryptAndParse();
    // eslint-disable-next-line
  }, [] );

  

  useEffect( () => {
    const decryptProfiles = async () => {
      const profilearr: Array<Profile> = [];

      for( let i = 0; i < user.profiles.length; i++ ){
        let profilejson = "";
        try{
          const decoded = await axios.post( "/api/prompt/decrypt", { 
            ciphertext: user.profiles[i],
            salt: user.salt
          } );
          profilejson = decoded.data.message;
        }catch( e ){
          profilejson = "";
        }
        
        const singleProfile: Profile = JSON.parse( profilejson );
        profilearr.push( singleProfile );
      }

      setDecryptedProfiles( profilearr );
    }

    if( user.profiles ){
      decryptProfiles();
    }
  }, [user.profiles, user.salt] );


  useEffect( () => {

    const createData = async () => {
      setQuotaOverused( false );
      //console.log("Creating new Quota...");
      await updateDoc( doc( db, "Company", user.Company ), { tokens: 0 } );
    }

    if( company.tokens != undefined ){
      if( company.tokens > 0 || company.unlimited ){
        setQuotaOverused( false );
      }else{
        setQuotaOverused( true );
      }
    }else{
      createData();
    }
      
  }, [company, user.Company] );


  useEffect( () => {
    if( user ){
      setRenderAllowed( true );
    }
  }, [user] )


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

        const cookieobject = {
          profile: values.profile,
          content: values.content,
          order: values.order,
          length: values.length
        }

        let blogObj = "";
        
        try{
            blogObj = JSON.stringify( cookieobject );
        }catch( e ){
            blogObj = JSON.stringify( blogBasicState );
        }

        let encContent = "";
        try{
          const encData = await axios.post( "/api/prompt/encrypt", {
            content: blogObj,
            salt: user.salt
          } );

          encContent = encData.data.message;
        }catch{
          encContent = "";
        }

        const newUser = user;
        newUser.lastState.blog = encContent;
        await updateData( "User", login.uid, newUser );

        let companyinfo = "";
        if( role.isCompany ){
          companyinfo = `Ich arbeite für ${company.name}. Wir beschäftigen uns mit: ${company.settings.background}`;
        }

        let isFreed = false;
        let usedTokens = 0;

        // Remove any resemblance of our token parse chars from the user input
        const cleanedContet = values.content.replace(/(<~).+?(~>)/gm, "");

        // Create an object containing the promptdata
        const promptdata = {
          name: user.firstname + " " + user.lastname,
          personal: profile.settings.personal,
          company: companyinfo,
          content: cleanedContet,
          style: profile.settings.stil,
          order: values.order,
          emotions: profile.settings.emotions,
          length: values.length
        }

        //Calculate the cost of the input
        const costbeforereq = await axios.post("/api/prompt/blog/count", promptdata);
        
        if(costbeforereq){
          const costbefore = costbeforereq.data.tokens;

          if(costbefore){
            let localtext = "";

            try{
              await axios.post( "/api/prompt/blog/generate", promptdata,
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
                  
                    setTokens(usedTokens.toString());
                    setTokenCountVisible(true);
                  
                    setAnswer(dataChunk);
                  }else{
                    const tokensused = encode(localtext).length;
                    usedTokens = costbefore + tokensused;
                    setAnswer(dataChunk + "█");
                  }
                }, signal: cancleController.signal
                });
            }catch(e){
              if(axios.isCancel(e)){
                setTokens(usedTokens.toString());
                setCancleController(new AbortController);
              }
            }

            try{
              await axios.post( "/api/stats", { tokens: usedTokens, time: usedTokens, type: "MONOLOG" } );
            }catch( e ){
              //console.log(e);
              //console.log("Timing logging failed!");
            }

            if( company.tokens - usedTokens <= 0 ){
              company.tokens = 0;
            }else{
              company.tokens -= usedTokens
            }

            await updateDoc( doc( db, "Company", user.Company ), { tokens: company.tokens } );

            const userusageidx = user.usedCredits.findIndex( ( val ) => {
              return val.month == props.Data.currentMonth && val.year == props.Data.currentYear
            } );

            if( userusageidx != -1 ){
              const usageupdates = user.usedCredits;
              usageupdates[userusageidx].amount += usedTokens;
              await updateDoc( doc( db, "User", login.uid ), { usedCredits: usageupdates } );
            }else{
              const usageupdates = user.usedCredits;
              usageupdates.push( { month: props.Data.currentMonth, year: props.Data.currentYear, amount: usedTokens } );
              await updateDoc( doc( db, "User", login.uid ), { usedCredits: usageupdates } );
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

  const getProfiles = () => {
    const profileOptions =  decryptedProfiles.map( ( singleProfile: Profile, idx: number ) => {
      return {
        key: idx,
        value: singleProfile.name
      }
    } );

    return profileOptions;
  }

  const getPrompt = () => {
    if( user && user.profiles != undefined ){
      if( !( user.profiles.length > 0 ) ){
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
        return(
          <>
            <div className={styles.userinputform}>
              <Card title={"Eine neuer Blogbeitrag"} className={styles.userinputcardmain}>
                <div ref={profileRef}>
                  <Form.Item
                    className={styles.formpart}
                    label={<b>Profil</b>}
                    name="profile"
                    rules={[
                      {
                        required: true,
                        message: "Bitte wähle ein Profil aus!"
                      }
                    ]}
                  >
                    <Select
                      showSearch
                      placeholder="Wähle ein Profil aus"
                      optionFilterProp="children"
                      onSearch={undefined}
                      options={getProfiles()}
                      disabled={formDisabled || quotaOverused}
                      className={styles.formselect}
                      size='large'
                    />
                  </Form.Item>
                </div>

                <div ref={continueRef}>
                  <Form.Item
                    className={styles.formpart}
                    label={<b>Worum soll es in dem Blogbeitrag gehen?</b>}
                    name="content"
                    rules={[
                      {
                        required: true,
                        message: "Formuliere kurz den Inhalt des Blogbeitrags!"
                      }
                    ]}
                  >
                    <TextArea className={styles.forminput} rows={10} placeholder="Formuliere kurz den Inhalt der E-Mail?" disabled={formDisabled || quotaOverused}/>
                  </Form.Item>
                </div>
              </Card>
              <Card title={"Einstellungen"} className={styles.userinputcardsub}>
                <div ref={classificationRef}>
                  <Form.Item className={styles.formpart} label={<b>Einordnung des Lesers (maximal 3)</b>} name="order"
                    rules={[
                      () => ( {
                        validator( _, value ) {
                          if(value){
                            if( value.length > 3 ){
                              form.setFieldValue( "order", value.slice( 0, 3 ) )
                            }
                          }
                          return Promise.resolve();
                        }
                      } ),
                      {
                        required: true,
                        message: "Bitte lege die Einordnung des Lesers fest!"
                      }
                    ]}
                  >
                    <Select
                      placeholder="Wie ordnest du den Leser des Beitrags ein?"
                      options={listToOptions( parameters.motives )}
                      mode="multiple"
                      allowClear
                      className={styles.formselect}
                      size='large'
                      disabled={formDisabled || quotaOverused}
                    />
                  </Form.Item>
                </div>

                <div ref={lengthRef}>
                  <Form.Item
                    className={styles.formpart}
                    label={<b>Länge des Blogbeitrags</b>}
                    name="length"
                    rules={[
                      {
                        required: true,
                        message: "Bitte lege die Länge des Beitrags fest!"
                      }
                    ]}
                  >
                    <Select
                      placeholder="Wie lang soll der erzeugte Beitrag sein?"
                      options={listToOptions( parameters.lengths )}
                      disabled={formDisabled || quotaOverused}
                      className={styles.formselect}
                      size='large'
                    />
                  </Form.Item>
                </div>
              </Card>
            </div>
            <div className={styles.formfootercontainer}>
              <div className={styles.tokenalert}>
                {
                  ( quotaOverused )?
                    <Alert message={"Das Creditbudget ist ausgeschöpft. Weitere Credits, kannst du in der Kontoübersicht dazubuchen."} type="error" />
                    : <></>
                }
              </div>
              <div ref={generateRef} className={styles.generatebuttonrow}>
                <Button className={styles.submitbutton} htmlType='submit' type='primary' disabled={formDisabled || quotaOverused}>E-Mail generieren</Button>
              </div>
            
            </div>
          </>
        );
      }
    }
  }

  const Answer = () => {

    const TokenInfo = () => {
      if(tokenCountVisible){
        return(
          <div className={styles.tokeninfo}>
            <Icon component={Info} className={styles.infoicon} viewBox='0 0 22 22' />
            Die Anfrage hat {parseFloat( tokens )/1000} Credits verbraucht
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

  return (
    <>
      {contextHolder}
      <SidebarLayout context={context}>
        <div className={styles.main}>
          <div className={styles.welcomemessage}>
            <div className={styles.messagcnt}>
              <Button onClick={() => {
                router.push( "/" ) 
              }} icon={<ArrowLeftOutlined />}></Button>
              <h1>Willkommen zurück, {handleEmptyString( user.firstname )}</h1>
            </div>
            <Divider className={styles.welcomeseperator} />
          </div>

          <div className={( !showAnswer )? styles.userinputformcontainer: styles.hiddencontainer} >
            <Form layout='vertical' onFinish={generateAnswer} onChange={() => {
              setIsAnswerCardvisible( false ); setIsAnswerVisible( false ); setIsLoaderVisible( false )
            }} form={form}>
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
                  In die Zwischenlage
                </div>
              }
            >
              <Answer />
            </Card>
            <div className={styles.formfootercontainer}>
              <div className={styles.generatebuttonrow}>
                <Button className={styles.backbutton} onClick={() => {
                  cancleController.abort();
                  setShowAnswer( false );
                  setTokenCountVisible(false);
                  setCancleController(new AbortController);
                }} type='primary'>Zurück</Button>
              </div>
            </div>
          </div>
          <Tour open={open} onClose={async () => {
            const currstate = user.tour;
            currstate.blog = true;
            updateData( "User", login.uid, { tour: currstate } );
            setOpen( false );
          }} steps={steps} />
          <style>
            {"span.ant-select-selection-placeholder{font-size: 14px !important; font-weight: normal !important}"}
          </style>
        </div>
      </SidebarLayout>
    </>
  )
}
