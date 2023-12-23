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
import { handleEmptyString, handleUndefinedTour, listToOptions, normalizeTokens } from "../../helper/architecture";
import Info from "../../public/icons/info.svg";
import Clipboard from "../../public/icons/clipboard.svg";
import updateData from "../../firebase/data/updateData";
import axiosTime from "axios-time";
import { useRouter } from "next/router";
import { encode } from "gpt-tokenizer";
import { isMobile } from "react-device-detect";
import FatButton from "../../components/FatButton";

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

const monologBasicState = {
  profile: "",
  content: "",
  address: "",
  order: "",
  length: ""
}

export default function Monologue( props: InitialProps ) {
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
  const [open, setOpen] = useState<boolean>( !handleUndefinedTour( user.tour ).monolog );
  const router = useRouter();
  const [ cancleController, setCancleController ] = useState(new AbortController());

  const profileRef = useRef( null );
  const continueRef = useRef( null );
  const addressRef = useRef( null );
  const classificationRef = useRef( null );
  const lengthRef = useRef( null );
  const generateRef = useRef( null );


  const steps: TourProps["steps"] = [
    {
      title: "E-Mail schreiben",
      description: "Das \"E-Mail schreiben\"-Feature von Siteware.Mail ermöglicht es dir, aus einem kurz skizzierten Inhalt eine E-Mail zu generieren, "+
      "indem du verschiedene Parameter eingibst, um den Inhalt genauer zu definieren. Ich werde dir gleich die wichtigsten Parameter"+
      " genauer erklären, damit du das Tool optimal nutzen kannst.",
      nextButtonProps: {
        children: (
          "Weiter"
        )
      },
      prevButtonProps: {
        children: (
          "Zurück"
        )
      }
    },
    {
      title: "Wer schreibt die E-Mails?",
      description: "Hier hast du die Möglichkeit, ein Profil auszuwählen, das die Persönlichkeit widerspiegelt, "+
      "für die die E-Mail generiert wird. Bei deinem ersten Login habe ich bereits ein Hauptprofil für dich angelegt. "+
      "Falls du weitere Profile anlegen oder dein Hauptprofil bearbeiten möchtest, kannst du dies direkt in der Seitenleiste unter dem Punkt \"Profil\" tun.",
      target: () => profileRef.current,
      nextButtonProps: {
        children: (
          "Weiter"
        )
      },
      prevButtonProps: {
        children: (
          "Zurück"
        )
      }
    },
    {
      title: "Worum geht es?",
      description: "In diesem Eingabefeld musst du kurz beschreiben, worum es in der Mail geht, die generiert werden soll. "+
      "Stichpunkte reichen oft aus. Beachte: Je präziser deine Formulierungen sind, desto genauer wird die Antwort, "+
      "aber unser Algorithmus hat dann weniger Freiraum für Formulierung und Tonalität. Experimentiere mit verschiedenen "+
      "Eingabestilen, um herauszufinden, was für dich am besten funktioniert und die passendsten Antworten generiert!",
      target: () => continueRef.current,
      nextButtonProps: {
        children: (
          "Weiter"
        )
      },
      prevButtonProps: {
        children: (
          "Zurück"
        )
      }
    },
    {
      title: "Wie sollen wir adressieren?",
      description: "Bitte wähle aus, in welcher Adressform du deine E-Mail gerne verfassen würdest.",
      target: () => addressRef.current,
      nextButtonProps: {
        children: (
          "Weiter"
        )
      },
      prevButtonProps: {
        children: (
          "Zurück"
        )
      }
    },
    {
      title: "Wie schätzt du den Schreibstil zwischen dir und deinem Gegenüber ein?",
      description: "In diesem Eingabefeld solltest du dich auf bis zu drei Aspekte festlegen, die den Schreibstil zwischen dir und "+
      "deinem Empfänger oder deiner Empfängerin konkret beschreiben. Deine Angaben bestimmen den allgemeinen Unterton deiner Nachricht. "+
      "Überlege dir, ob der Ton formell oder informell sein soll, ob du eine professionelle oder freundliche Atmosphäre schaffen möchtest, "+
      "und ob du Sachlichkeit oder eine persönliche Note bevorzugst. Diese Entscheidungen beeinflussen maßgeblich, wie deine Antwort wahrgenommen wird.",
      target: () => classificationRef.current,
      nextButtonProps: {
        children: (
          "Weiter"
        )
      },
      prevButtonProps: {
        children: (
          "Zurück"
        )
      }
    },
    {
      title: "Kurze Mitteilung oder eine ausführliche Erläuterung?",
      description: "Zum Abschluss musst du nur noch die Länge deiner Antwort festlegen.",
      target: () => lengthRef.current,
      nextButtonProps: {
        children: (
          "Weiter"
        )
      },
      prevButtonProps: {
        children: (
          "Zurück"
        )
      }
    },
    {
      title: "Alles bereit",
      description: "Durch Klicken auf den \"Antwort Generieren\"-Button wird nach einer kurzen Wartezeit eine E-Mail erzeugt. "+
      "Bitte bedenke, dass die wir deine Eingaben noch verarbeiten müssen, wodurch es gegebenenfalls zu kurzen Wartezeiten kommen kann.",
      target: () => generateRef.current,
      nextButtonProps: {
        children: (
          "Alles klar"
        ),
        onClick: async () => {
          const currstate = user.tour;
          currstate.monolog = true;
          updateData( "User", login.uid, { tour: currstate } )
        }
      },
      prevButtonProps: {
        children: (
          "Zurück"
        )
      }
    }
  ];

  const updateField = ( field: string, value: string ) => {
    if( value && value != "" ){
      form.setFieldValue( field, value );
    }
  }
  
  const decryptAndParse = async (profiles) => {
    let parsed = monologBasicState;
    try{
      const decRequest = await axios.post( "/api/prompt/decrypt", {
        ciphertext: user.lastState.monolog,
        salt: user.salt
      } )

      const decryptedText = decRequest.data.message;
      parsed = JSON.parse( decryptedText );

      // Check if the last profile was deleted
      const profile = profiles.find( ( singleProfile: Profile ) => {
        return singleProfile.name == parsed.profile;
      });

      console.log(profile);
      let profilename = "Hauptprofil";

      // If the last used profile is gone just use the first profile ("Hauptprofil")
      if(profile){
        profilename = profile.name;
      }

      updateField( "content", parsed.content );
      updateField( "profile", profilename );
      updateField( "address", parsed.address );
      updateField( "order", parsed.order );
      updateField( "length", parsed.length );

    }catch( e ){
      //console.log(e);
    }
  }

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

      await decryptAndParse(profilearr);
    }

    if( user.profiles ){
      decryptProfiles();
    }
    // eslint-disable-next-line
  }, [] );


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
    let profile = decryptedProfiles.find( ( singleProfile: Profile ) => {
      return singleProfile.name == values.profile;
    } );

    if(!profile){
      profile = decryptedProfiles[0];
    }

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
          address: values.address,
          order: values.order,
          length: values.length
        }

        let monologObj = "";
        
        try{
          monologObj = JSON.stringify( cookieobject );
        }catch( e ){
          monologObj = JSON.stringify( monologBasicState );
        }

        let encContent = "";
        try{
          const encData = await axios.post( "/api/prompt/encrypt", {
            content: monologObj,
            salt: user.salt
          } );

          encContent = encData.data.message;
        }catch{
          encContent = "";
        }

        const newUser = user;
        newUser.lastState.monolog = encContent;
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
          address: values.address,
          style: profile.settings.stil,
          order: values.order,
          emotions: profile.settings.emotions,
          length: values.length
        }

        //Calculate the cost of the input
        const costbeforereq = await axios.post("/api/prompt/monolog/count", promptdata);
        
        if(costbeforereq){
          const costbefore = costbeforereq.data.tokens;

          if(costbefore){
            let localtext = "";

            try{
              await axios.post( "/api/prompt/monolog/generate", promptdata,
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
              <Card title={"Eine neue E-Mail"} className={styles.userinputcardmain}>
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
                    label={<b>Worum soll es in der E-Mail gehen?</b>}
                    name="content"
                    rules={[
                      {
                        required: true,
                        message: "Bitte lege den Inhalt deiner Nachricht fest!"
                      }
                    ]}
                  >
                    <TextArea
                      className={styles.forminput}
                      rows={(isMobile)? 5: 10}
                      placeholder="Formuliere kurz den Inhalt der E-Mail?"
                      disabled={formDisabled || quotaOverused}
                    />
                  </Form.Item>
                </div>
              </Card>
              <Card title={"Einstellungen"} className={styles.userinputcardsub}>
                <div ref={addressRef}>
                  <Form.Item
                    className={styles.formpart}
                    label={<b>Ansprache</b>}
                    name="address"
                    rules={[
                      {
                        required: true,
                        message: "Bitte lege die Anrede deiner Nachricht fest!"
                      }
                    ]}
                  >
                    <Select placeholder="Bitte wähle die Form der Ansprache aus..." options={listToOptions( parameters.address )}
                      className={styles.formselect}
                      disabled={formDisabled || quotaOverused}
                      size='large'
                    />
                  </Form.Item>
                </div>

                <div ref={classificationRef}>
                  <Form.Item className={styles.formpart} label={<b>Einordnung des Gesprächspartners (maximal 3)</b>} name="order"
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
                        message: "Bitte schätze deinen Gesprächspartner ein!"
                      }
                    ]}
                  >
                    <Select
                      placeholder="Wie ordnest du deinen Gesprächpartner ein?"
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
                    label={<b>Länge der Antwort</b>}
                    name="length"
                    rules={[
                      {
                        required: true,
                        message: "Bitte lege die Länge deiner Nachricht fest!"
                      }
                    ]}
                  >
                    <Select
                      placeholder="Wie lang soll die erzeugte Antwort sein?"
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
                <FatButton isSubmitButton={true} disabled={formDisabled || quotaOverused} text="E-Mail generieren"/>
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
            Die Anfrage hat {normalizeTokens(parseFloat( tokens ))} Credits verbraucht
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
              <div className={styles.msg}>Willkommen zurück, {handleEmptyString( user.firstname )}</div>
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
            const currstate = user.tour;
            currstate.monolog = true;
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
