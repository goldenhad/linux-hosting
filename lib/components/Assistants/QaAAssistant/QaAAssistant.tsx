import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Alert, Button, Card, Divider, Form, Result, Skeleton } from "antd";
import { toGermanCurrencyString } from "../../../../lib/helper/price";
import { useRouter } from "next/router";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../../db";
import { Profile } from "../../../../lib/firebase/types/Profile";
import axios from "axios";
import Assistant, {
  AssistantInputColumn,
  AssistantInputType,
  AssistantType,
  InputBlock
} from "../../../../lib/firebase/types/Assistant";
import updateData from "../../../../lib/firebase/data/updateData";
import getDocument from "../../../../lib/firebase/data/getData";
import moment from "moment";
import styles from "./qaaassistant.module.scss";
import Icon, { ArrowLeftOutlined, HistoryOutlined } from "@ant-design/icons";
import Info from "../../../../public/icons/info.svg";
import Markdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { oneLight } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { handleEmptyString } from "../../../helper/architecture";
import { isMobile } from "react-device-detect";
import AssistantForm from "../../AssistantForm/AssistantForm";
import FatButton from "../../FatButton";
import Clipboard from "../../../../public/icons/clipboard.svg";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { MessageInstance } from "antd/es/message/interface";
import { NotificationInstance } from "antd/es/notification/interface";
import { MAXHISTITEMS, MSGDURATION } from "../../../../pages/assistant";
import { MsgType } from "../ChatAssistant/ChatAssistant";



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

export default function QaAAssistant(props: {
    assistant: Assistant,
    context,
    quotaOverused: boolean,
    formDisabled: boolean,
    setHistoryOpen: Dispatch<SetStateAction<boolean>>,
    messageApi: MessageInstance,
    notificationApi: NotificationInstance
    history: { state: any[], set: React.Dispatch<React.SetStateAction<any[]>> }
    predefinedState: { state: Array<any>, idx: number };
}) {
  const context = props.context;
  const { user } = context;

  const [ decryptedProfiles, setDecryptedProfiles ] = useState( [] );
  const [ quotaOverused, setQuotaOverused ] =  useState( props.quotaOverused );
  const [ tokenCountVisible, setTokenCountVisible ] = useState( false );
  const [ isAnswerVisible, setIsAnswerVisible ] = useState( false );
  const [ isLoaderVisible, setIsLoaderVisible ] = useState( false );
  const [ isAnswerCardVisible, setIsAnswerCardvisible ] = useState( false );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [ answer, setAnswer ] = useState( "" );
  const [ formDisabled, setFormDisabled ] = useState( props.formDisabled );
  const [ promptError, setPromptError ] = useState( false );
  const [ showAnswer, setShowAnswer ] = useState( false );
  const [ cancleController, setCancleController ] = useState(new AbortController());
  const router = useRouter();
  const [ form ] = Form.useForm();

  const mainblock = props.assistant.blocks[0] as InputBlock;


  useEffect(() => {
    console.log(props.predefinedState.state);
    if(props.predefinedState.state && props.predefinedState.state.length > 0){
      setIsAnswerCardvisible( true );
      setShowAnswer( true );
      setIsAnswerVisible( true );
      setPromptError( false );
      setAnswer(props.predefinedState.state[0]);
    }
  }, [props.predefinedState]);

  useEffect(() => {
    setQuotaOverused(props.context.company.tokens < 0);
  }, [props.context.company]);

  /**
     * Effect to encrypt the user profiles
     */
  useEffect( () => {
    console.log(context.user.profiles);

    // Async decryption function
    const decryptProfiles = async () => {
      // Initialize the array used for saving the decrypted profiles
      const profilearr: Array<Profile> = [];

      // Iterate over the encrypted profiles of the user
      for( let i = 0; i < context.user.profiles.length; i++ ){
        // Init the json string
        let profilejson = "";
        try{
          // Call the API for encryption
          const decoded = await axios.post( "/api/prompt/decrypt", {
            ciphertext: context.user.profiles[i],
            salt: context.user.salt
          } );
          // Get the json string from the api call
          profilejson = decoded.data.message;
        }catch( e ){
          profilejson = "";
        }

        // Parse the decrypted profiles as json and push them to the array
        try{
          const singleProfile: Profile = JSON.parse( profilejson );
          profilearr.push( singleProfile );
        }catch(e){
          console.log("Could not decode profile...");
        }
      }

      // Update the state with the decrypted profiles
      setDecryptedProfiles( profilearr );
    }

    // If the user has profiles, call the decryption routine
    if( context.user.profiles ){
      decryptProfiles();
    }
  }, [context.user.profiles, context.user.salt] );

  /**
     * Effect for decrypting the last state of the assistant.
     * If the decryption is successfull, the fields of the assistant form
     * will be updates
     */
  useEffect( () => {
    /**
         * Async function for decrypting and parsing
         * of profiles
         */
    const decryptAndParse = async () => {
      // Get the basic state from the given props
      let parsed = getBasicState();
      try{
        // Request the decryption of the laststate from the api
        const decRequest = await axios.post( "/api/prompt/decrypt", {
          ciphertext: context.user.lastState[props.assistant.uid],
          salt: context.user.salt
        })

        // Get the decrypted string from the api call
        const decryptedText = decRequest.data.message;
        // Parse decrypted string as JSON
        parsed = JSON.parse( decryptedText );
      }catch( e ){
        console.log(e);
      }

      // Update the form with the parsed JSON object
      // Make it dynamicly to support the abstraction of the assistants
      Object.keys(getBasicState()).forEach((field) => {
        let fieldvalue = parsed[field];

        if(decryptedProfiles.length){
          if(field == "profile"){
            // Test if the saved profile exists in the list of the profiles
            const profIndex = decryptedProfiles.findIndex((profile: Profile) => {
              return profile.name == parsed["field"];
            });

            // If the profile can't be found set the profile to the first profile in the list
            if(profIndex == -1){
              fieldvalue = decryptedProfiles[0].name
            }
          }
        }
        updateField(form, field, fieldvalue );
      })
    }

    // Call the async function
    decryptAndParse();
    // eslint-disable-next-line
    }, [] );
  

  const promptFunction = (values, prompt: string) => {
    let replaced = prompt;

    console.log(prompt)
    mainblock.inputColumns.forEach((column: AssistantInputColumn) => {
      column.inputs.forEach((inputobj) => {
        console.log(values);
        console.log(inputobj.key);
        //const cleanedValued = values[inputobj.key].replace(/(<~).+?(~>)/gm, "");
        const cleanedValued = values[inputobj.key];
        if(inputobj.type == AssistantInputType.PROFILE){
          const profile: Profile = decryptedProfiles.find( ( singleProfile: Profile ) => {
            return singleProfile.name == values.profile;
          });

          if(profile){
            let profileInformation = `Mein Name ist ${user.firstname} ${user.lastname}. Ich bin ${profile.settings.personal}`;
            if(context.role.isCompany){
              const companyinfo = `Ich arbeite für ${context.company.name}. Wir beschäftigen uns mit: ${context.company.settings.background}`;
              profileInformation = `Mein Name ist ${user.firstname} ${user.lastname}. Ich bin ${profile.settings.personal}. ${companyinfo}`
            }

            replaced = replaced.replace(`<${inputobj.key}>`, profileInformation);
          }
        }else{
          if(inputobj.multiple){
            replaced = replaced.replace(`<${inputobj.key}>`, cleanedValued);
          }else{
            replaced = replaced.replace(`<${inputobj.key}>`, cleanedValued.toString());
          }
        }
      })
    })

    console.log(replaced);
    return { prompt: replaced };
  }

  const getBasicState = () => {
    const obj = {};
    mainblock.inputColumns.forEach((column: AssistantInputColumn) => {
      column.inputs.forEach((inputobj) => {
        if(inputobj.type ==  AssistantInputType.PROFILE){
          if (decryptedProfiles.length > 0){
            obj[inputobj.key] = decryptedProfiles[0];
          }else{
            obj[inputobj.key] = "";
          }
        }else if(inputobj.type == AssistantInputType.SELECT){
          if(inputobj.options.length > 0){
            obj[inputobj.key] = inputobj.options[0].value;
          }else{
            obj[inputobj.key] = "";
          }
        }else{
          obj[inputobj.key] = "";
        }
      });
    })

    return obj;
  }


  const generateAnswer = async ( values ) => {
    // Serach the decrypted profiles for the given profile in the values object


    try{
      // Initialize the state of the form and answer
      setFormDisabled( true );
      setIsAnswerCardvisible( true );
      setIsLoaderVisible( true );
      setShowAnswer( true );
      setIsAnswerVisible( false );
      setPromptError( false );

      // Set the state of the prompt with the input value
      const basicState = getBasicState();

      // Set the state of the prompt with the input value
      const cookieobject = getBasicState();

      Object.keys(basicState).forEach((field) => {
        cookieobject[field] = values[field];
      })


      // Stringify the prompt state
      const jsonState = JSON.stringify(cookieobject);

      // Encode the prompt for saving
      let encContent = "";
      try{
        // Query the api for encryption
        const encData = await axios.post( "/api/prompt/encrypt", {
          content: jsonState,
          salt: context.user.salt
        } );

        encContent = encData.data.message;
      }catch{
        encContent = "";
      }

      // Get the object of the current user
      const newUser = context.user;
      // Set the prompt state to the laststate of the user
      newUser.lastState[props.assistant.uid] = encContent;

      await updateData( "User", context.login.uid, newUser );


      let isFreed = false;
      let cost = 0;
      const usedTokens = { in: 0, out: 0 };

      // Retrieve the template for prompts from the database
      const templatereq = await getDocument("Settings", "Prompts");

      // Check if the template request was successful
      if (!templatereq.result) {
        throw Error("Settings not found...");
      }

      // Format the given values to fit to the prompt api
      const { prompt } = promptFunction( values, mainblock.prompt )

      //Calculate the used tokens of the input
      let localAnswer = "";

      try{
        // Query the api for an answer to the input
        await axios.post("/api/llama/query", {
          aid: props.assistant.uid,
          assistantType: AssistantType.QAA,
          query: prompt,
          messages: [ { content: mainblock.personality, role: MsgType.ASSISTANT } ],
          companyId: props.context.user.Company
        },
        { onDownloadProgress: async (progressEvent) => {
          // Disable the loading of the answer if we have recieved a chunk of data
          if(!isFreed){
            setIsLoaderVisible( false );
            setIsAnswerVisible( true );
            isFreed = true;
          }
          // Get the generated words from the response
          let dataChunk: string = progressEvent.event?.currentTarget.response;

          // Remove possible contained control sequences
          const parseRegEx = /(?<=<~).+?(?=~>)/g;
          const parsedval = dataChunk.match(parseRegEx);

          // Check if we encounterd a control char.
          if(parsedval && parsedval.length == 1){
            // If we found the control sequence, we reached the end of the response
            // Remove the control sequence
            dataChunk = dataChunk.replace(`<~${parsedval[0]}~>`, "");

            usedTokens.in = 0;
            usedTokens.out = 0;

            try{
              const costReturned = JSON.parse(parsedval[0]);
              cost = costReturned.cost;
            }catch (e){
              cost = 0;
            }


            // Add the generated answer to the history state
            // Validate that the answer is not empty
            if(localAnswer != ""){
              // We need to check if the user already has 10 saved states
              if(props.history.state.length >= MAXHISTITEMS){
                // If so remove last Element from array
                props.history.state.pop();
              }

              // Add the answer with the current time and the used tokens to the front of the history array
              props.history.state.unshift({ content: localAnswer, time: moment(Date.now()).format("DD.MM.YYYY"), tokens: toGermanCurrencyString(cost) });

              // Encrypt the history array
              const encHistObj = await axios.post( "/api/prompt/encrypt", {
                content: JSON.stringify(props.history.state),
                salt: context.user.salt
              } );

              const encHist = encHistObj.data.message;

              let userhist = user.history;
              // Set the history to the encoded string and update the user
              if(userhist === undefined){
                userhist = [];
              }
              userhist[props.assistant.uid] = encHist;
              await updateDoc( doc( db, "User", context.login.uid ), { history: userhist } );
            }

            //reduceCost(props.context.company.tokens, cost);
            //await updateCompanyTokens(props.context, calculator, props.notificationApi, cost);

            props.notificationApi.info({
              message: "Creditverbrauch",
              description: `Die Anfrage hat ${toGermanCurrencyString(cost)} verbraucht`,
              duration: MSGDURATION
            });

            // Set the answer to the recieved data without the control sequence
            setAnswer(dataChunk);

            localAnswer = dataChunk;

            setTokenCountVisible(true);


          }else{
            // Update the answer and show the cursor char
            setAnswer(dataChunk + "█");
            localAnswer = dataChunk;

          }
        }
        });
      }catch(e){
        setAnswer("");
        setPromptError(true);
      }


      // Check if the user activated automatic recharge. If charge them and add tokens
      console.log(context.company);
    }catch( e ){
      console.log(e);
      setIsLoaderVisible( false );
      setPromptError( true );
    }

    setFormDisabled( false );
  }


  const Answer = () => {
    /**
         * Subcomoponent containing information about the used tokens of the assistant request
         * @returns Information box with normalized use of token
         */
    const Disclaimer = () => {
      if(tokenCountVisible){
        return(
          <div className={styles.tokeninfo}>
            <Icon component={Info} className={styles.infoicon} viewBox='0 0 22 22' />
              Dieses Ergebnis wurde von einer KI generiert. Trotz der hohen Text- und Analysequalität können wir die Richtigkeit der Ergebnisse nicht garantieren.
          </div>
        );
      }
    }

    // Check if the answer should be displayed
    if(isAnswerVisible){
      // Return the answer state and the information about the used tokens
      return (
        <>
          <div className={styles.answer} style={{ transition: "all 0.5s ease" }} >
            <Markdown
              skipHtml={true}
              remarkPlugins={[ remarkBreaks, remarkGfm ]}
              components={{
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                code({ node, className, children, ...props }) {
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
              {answer}
            </Markdown>
          </div>
          <Disclaimer />
        </>
      );
    }else if(isLoaderVisible){
      // If the answer is currently loading, show an loading skeleton to indicate loading
      return(<Skeleton active/>);
    }else if(promptError){
      // If the prompt caused an error display an error message to the user
      return(
        <Alert type='error' message="Bei der Generierung der Anfrage ist etwas schiefgelaufen. Bitte versuche es später erneut!" />
      );
    }else{
      // In any other case display an empty component
      return (<></>);
    }
  }


  return(
    <>
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
      </div>

      <div className={(!showAnswer) ? styles.userinputformcontainer : styles.hiddencontainer}>
        <Form layout='vertical' onFinish={generateAnswer} onChange={() => {
          setIsAnswerCardvisible(false);
          setIsAnswerVisible(false);
          setIsLoaderVisible(false)
        }} form={form}>
          <AssistantForm title={props.assistant.name} inputColumns={mainblock.inputColumns}
            quotaOverused={quotaOverused}
            formDisabled={formDisabled} profiles={decryptedProfiles}/>
          <div className={styles.formfootercontainer}>
            <div className={styles.generatebuttonrow}>
              <FatButton
                disabled={formDisabled}
                type={(quotaOverused)? "default": "primary"}
                text="Agenten ausführen"
                onClick={() => {
                  if(quotaOverused){
                    props.messageApi.error("Dein Budget ist ausgeschöpft. In der Kontoübersicht kannst du neues Guthaben dazubuchen!")
                  }else{
                    form.submit();
                  }
                }}
              />
            </div>
          </div>
        </Form>
      </div>
      <div className={(showAnswer) ? styles.userinputformcontainer : styles.hiddencontainer}>
        <Card
          className={styles.answercard}
          title={"Antwort"}
          style={{ display: (isAnswerCardVisible) ? "block" : "none" }}
          extra={
            <div className={styles.clipboardextra} onClick={() => {
              navigator.clipboard.writeText(answer);
              props.messageApi.success("Antwort in die Zwischenablage kopiert.");
            }}
            >
              <Icon component={Clipboard} className={styles.clipboardicon} viewBox='0 0 22 22'/>
                          In die Zwischenablage
            </div>
          }
        >
          {promptError ?
            <Result
              status="error"
              title="Bei der Erzeugung der Antwort ist ein Fehler aufgetreten!"
            />
            : <Answer/>}
        </Card>
        <div className={styles.formfootercontainer}>
          <div className={styles.generatebuttonrow}>
            <FatButton onClick={() => {
              cancleController.abort();
              setShowAnswer(false);
              setTokenCountVisible(false);
              setCancleController(new AbortController);
            }} text="Zurück"/>
            <FatButton type={"default"} onClick={() => {
              if(quotaOverused){
                props.messageApi.error("Dein Budget ist ausgeschöpft. In der Kontoübersicht kannst du neues Guthaben dazubuchen!")
              }else{
                form.submit();
              }
            }} text="Neu generieren"/>
          </div>
        </div>
      </div>
      <style>{"span.ant-select-selection-placeholder{font-size: 14px !important; font-weight: normal !important}"}</style>
    </>
  );
}
