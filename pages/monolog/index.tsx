import { Card, Button, Form, Input, Select, Result, Skeleton, Alert, Divider, message, TourProps, Tour } from "antd";
import Icon from "@ant-design/icons";
import styles from "./index.module.scss"
import { db } from "../../db";
import axios, { AxiosResponse } from "axios";
import { useEffect, useRef, useState } from "react";
import { GetServerSideProps } from "next";
import SidebarLayout from "../../components/Sidebar/SidebarLayout";
import { useAuthContext } from "../../components/context/AuthContext";
import { Profile } from "../../firebase/types/Profile";
import { doc, updateDoc } from "firebase/firestore";
import { handleEmptyString, listToOptions } from "../../helper/architecture";
import Info from "../../public/icons/info.svg";
import Clipboard from "../../public/icons/clipboard.svg";
import updateData from "../../firebase/data/updateData";
import axiosTime from "axios-time";
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
  const { login, user, company, role, parameters } = useAuthContext();
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
  const [ renderAllowed, setRenderAllowed ] = useState( false );
  const [open, setOpen] = useState<boolean>( !user.tour.monolog );

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

  useEffect( () => {
    const updateField = ( field: string, value: string ) => {
      if( value && value != "" ){
        form.setFieldValue( field, value );
      }
    }
    
    const decryptAndParse = async () => {
      let parsed = monologBasicState;
      try{
        const decRequest = await axios.post( "/api/prompt/decrypt", {
          ciphertext: user.lastState.monolog,
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
      updateField( "address", parsed.address );
      updateField( "order", parsed.order );
      updateField( "length", parsed.length );
    }

    decryptAndParse();
  }, [form, user.lastState.monolog, user.salt] );

  

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
  
        const answer: AxiosResponse & {
          timings: {
            elapsedTime: number,
            timingEnd: number,
            timingStart: number
          }
        } = await axios.post( "/api/prompt/monolog/generate", {
          name: user.firstname + " " + user.lastname,
          personal: profile.settings.personal,
          content: values.content,
          address: values.address,
          style: profile.settings.stil,
          order: values.order,
          emotions: profile.settings.emotions,
          length: values.length
        } );

        if( answer.data ){
          setIsLoaderVisible( false );
          setIsAnswerVisible( true );
          setAnswer( answer.data.message );
          setTokens( answer.data.tokens );

          try{
            await axios.post( "/api/stats", { tokens: answer.data.tokens, time: answer.timings.elapsedTime, type: "MONOLOG" } );
          }catch( e ){
            //console.log(e);
            //console.log("Timing logging failed!");
          }
  
          if( company.tokens - answer.data.tokens <= 0 ){
            company.tokens = 0;
          }else{
            company.tokens -= answer.data.tokens
          }

          await updateDoc( doc( db, "Company", user.Company ), { tokens: company.tokens } );

          const userusageidx = user.usedCredits.findIndex( ( val ) => {
            return val.month == props.Data.currentMonth && val.year == props.Data.currentYear
          } );
          if( userusageidx != -1 ){
            const usageupdates = user.usedCredits;
            usageupdates[userusageidx].amount += answer.data.tokens;
            await updateDoc( doc( db, "User", login.uid ), { usedCredits: usageupdates } );
          }else{
            const usageupdates = [];
            usageupdates.push( { month: props.Data.currentMonth, year: props.Data.currentYear, amount: answer.data.tokens } );
            await updateDoc( doc( db, "User", login.uid ), { usedCredits: usageupdates } );
          }
        }
  
      }catch( e ){
        //console.log(e);
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
              <Card title={"Eine neue E-Mail"} headStyle={{ backgroundColor: "#F9FAFB" }} className={styles.userinputcardmain}>
                <div ref={profileRef}>
                  <Form.Item className={styles.formpart} label={<b>Profil</b>} name="profile">
                    <Select
                      showSearch
                      placeholder="Wähle ein Profil aus"
                      optionFilterProp="children"
                      onChange={( values ) => {
                        console.log( values )
                      }}
                      onSearch={undefined}
                      options={getProfiles()}
                      disabled={formDisabled || quotaOverused}
                      className={styles.formselect}
                      size='large'
                    />
                  </Form.Item>
                </div>

                <div ref={continueRef}>
                  <Form.Item className={styles.formpart} label={<b>Worum soll es in der E-Mail gehen?</b>} name="content">
                    <TextArea className={styles.forminput} rows={10} placeholder="Formuliere kurz den Inhalt der E-Mail?" disabled={formDisabled || quotaOverused}/>
                  </Form.Item>
                </div>
              </Card>
              <Card title={"Einstellungen"} headStyle={{ backgroundColor: "#F9FAFB" }} className={styles.userinputcardsub}>
                <div ref={addressRef}>
                  <Form.Item className={styles.formpart} label={<b>Ansprache</b>} name="address">
                    <Select placeholder="Bitte wähle die Form der Ansprache aus..." options={listToOptions( parameters.address )}
                      className={styles.formselect}
                      disabled={formDisabled || quotaOverused}
                      size='large'
                    />
                  </Form.Item>
                </div>

                <div ref={classificationRef}>
                  <Form.Item className={styles.formpart} label={<b>Einordnung des Gesprächpartners (maximal 3)</b>} name="order"
                    rules={[
                      () => ( {
                        validator( _, value ) {
                          if( value.length > 3 ){
                            form.setFieldValue( "order", value.slice( 0, 3 ) )
                          }
                          return Promise.resolve();
                        }
                      } )
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
                  <Form.Item className={styles.formpart} label={<b>Länge der Antwort</b>} name="length">
                    <Select
                      placeholder="Wie lang soll die erzeuge Antwort sein?"
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
                    <Alert message={"Das Tokenbudget ist ausgeschöpft. Weitere Tokens, kannst du in der Kontoübersicht dazubuchen."} type="error" />
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


  return (
    <>
      {contextHolder}
      <SidebarLayout role={role} user={user} login={login}>
        <div className={styles.main}>
          <div className={styles.welcomemessage}>
            <h1>Willkommen zurück, {handleEmptyString( user.firstname )}</h1>
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
              headStyle={{ backgroundColor: "#F9FAFB" }}
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
              {( isAnswerVisible )?
                <>
                  <div className={styles.answer}>{answer}</div>
                  <div className={styles.tokeninfo}>
                    <Icon component={Info} className={styles.infoicon} viewBox='0 0 22 22' />
                  Die Anfrage hat {tokens} Tokens verbraucht</div></>
                : <></>}
              {( isLoaderVisible )? <Skeleton active/>: <></>}
              {( promptError )? <Alert type='error' message="Bei der Generierung der Anfrage ist etwas schiefgelaufen. Bitte versuche es später erneut!" />: <></>}
            </Card>
            <div className={styles.formfootercontainer}>
              <div className={styles.generatebuttonrow}>
                <Button className={styles.backbutton} onClick={() => {
                  setShowAnswer( false );
                }} type='primary'>Zurück</Button>
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
