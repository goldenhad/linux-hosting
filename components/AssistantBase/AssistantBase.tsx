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

/**
 * Context used for Ai Assistants.
 * Provides statefull variables in a context
 * to enable assistant abstraction
 */
export const AssistantContext = createContext({ 
  decryptedProfiles: [],
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
    name: string,
    laststate: string,
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
      let parsed = props.basicState;
      try{
        // Request the decryption of the laststate from the api
        const decRequest = await axios.post( "/api/prompt/decrypt", {
          ciphertext: props.context.user.lastState[props.laststate],
          salt: props.context.user.salt
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
      Object.keys(props.basicState).forEach((field) => {
        updateField(props.form, field, parsed[field] );
      })
    }
    
    // Call the async function
    decryptAndParse();
    // eslint-disable-next-line
}, [] );

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
          ciphertext: props.context.user.history[props.laststate],
          salt: props.context.user.salt
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

  /**
   * Effect to encrypt the user profiles
   */
  useEffect( () => {
    // Async decryption function
    const decryptProfiles = async () => {
      // Initialize the array used for saving the decrypted profiles
      const profilearr: Array<Profile> = [];
    
      // Iterate over the encrypted profiles of the user
      for( let i = 0; i < props.context.user.profiles.length; i++ ){
        // Init the json string
        let profilejson = "";
        try{
          // Call the API for encryption
          const decoded = await axios.post( "/api/prompt/decrypt", { 
            ciphertext: props.context.user.profiles[i],
            salt: props.context.user.salt
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
    if( props.context.user.profiles ){
      decryptProfiles();
    }
  }, [props.context.user.profiles, props.context.user.salt] );


  /**
   * Effect for initializing the company usage 
   */
  useEffect( () => {
    // Async function to init the usage of the company
    const createData = async () => {
      // Reset the overused state
      setQuotaOverused( false );
      // Call firebase to update the company with the initial token count
      await updateDoc( doc( db, "Company", props.context.user.Company ), { tokens: 0 } );
    }

    // If the company tokens are defined
    if( props.context.company.tokens != undefined ){
      // If the company tokens are greater as 0 or the company has unlimited token access
      if( props.context.company.tokens > 0 || props.context.company.unlimited ){
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
      
  }, [props.context.company, props.context.user.Company, quotaOverused] );

  /**
   * Effect to check if the user was reset through firebase reloading
   * Set the render allowed state to true if the user is reloading to
   * prevent flickering
   */
  useEffect( () => {
    if( props.context.user ){
      setRenderAllowed( true );
    }
  }, [props.context.user] )


  /**
   * Check if the user has any profile. Return the Prompt-Window if so. Otherwise supply
   * additional content
   * @returns Either the prompt window or a hint regardint the creation of profiles
   */
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

  /**
   * Convert the decrypted profiles and return them as select options array
   * @returns Array of antd select options
   */
  const getProfiles = () => {
    const profileOptions =  decryptedProfiles.map( ( singleProfile: Profile, idx: number ) => {
      return {
        key: idx,
        value: singleProfile.name
      }
    } );
  
    return profileOptions;
  }


  /**
   * Component containing the generated answer of the assistant
   * @returns React component containing the answer
   */
  const Answer = () => {
    /**
     * Subcomoponent containing information about the used tokens of the assistant request
     * @returns Information box with normalized use of token
     */
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

    // Check if the answer should be displayed
    if(isAnswerVisible){
      // Return the answer state and the information about the used tokens
      return (
        <>
          <div className={styles.answer} style={{ transition: "all 0.5s ease" }} >{answer}</div>
          <TokenInfo />
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

  /**
   * Generate the answer for the assistant
   * @param values prompt input form values
   * @note values should have the same name as the members of the @basicState object
   */
  const generateAnswer = async ( values ) => {
    // Serach the decrypted profiles for the given profile in the values object
    const profile = decryptedProfiles.find( ( singleProfile: Profile ) => {
      return singleProfile.name == values.profile;
    } );

    // If the given profile was found...
    if( profile ) {
      try{
        // Initialize the state of the form and answer
        setFormDisabled( true );
        setIsAnswerCardvisible( true );
        setIsLoaderVisible( true );
        setShowAnswer( true );
        setIsAnswerVisible( false );
        setPromptError( false );
        setTokens( "" );

        // Set the state of the prompt with the input value
        const cookieobject = props.basicState;

        Object.keys(props.basicState).forEach((field) => {
          cookieobject[field] = values[field];
        })


        // Stringify the prompt state 
        let blogObj = "";
        try{
          blogObj = JSON.stringify( cookieobject );
        }catch( e ){
          blogObj = JSON.stringify( props.basicState );
        }

        // Encode the prompt for saving
        let encContent = "";
        try{
          // Query the api for encryption
          const encData = await axios.post( "/api/prompt/encrypt", {
            content: blogObj,
            salt: props.context.user.salt
          } );

          encContent = encData.data.message;
        }catch{
          encContent = "";
        }

        // Get the object of the current user
        const newUser = props.context.user;
        // Set the prompt state to the laststate of the user
        newUser.lastState[props.laststate] = encContent;
        await updateData( "User", props.context.login.uid, newUser );


        let isFreed = false;
        let usedTokens = 0;
        
        // Format the given values to fit to the prompt api
        const promptdata = props.promptFunction( values, profile )

        //Calculate the used tokens of the input
        const costbeforereq = await axios.post(props.routes.count, promptdata);
        
        if(costbeforereq){
          const costbefore = costbeforereq.data.tokens;

          if(costbefore){
            let localtext = "";
            let localAnswer = "";

            try{
              // Query the api for a answer to the input
              await axios.post( props.routes.generate, promptdata,
                { onDownloadProgress: (progressEvent) => {
                  // Disable the loading of the answer if we have recieved a chunk of data
                  if(!isFreed){
                    setIsLoaderVisible( false );
                    setIsAnswerVisible( true );
                    isFreed = true;
                  }
                  // Get the generated words from the response
                  let dataChunk: string = progressEvent.event?.currentTarget.response;
                  localtext = dataChunk;

                  // Remove possible contained control sequences
                  const parseRegEx = /(?<=<~).+?(?=~>)/g;
                  const parsedval = dataChunk.match(parseRegEx);
                  
                  // Check if we encounterd an control char.
                  if(parsedval && parsedval.length == 1){
                    // If we found the control sequence, we reached the end of the response
                    // Remove the control sequence
                    dataChunk = dataChunk.replace(`<~${parsedval[0]}~>`, "");
                    localAnswer = dataChunk;
                    
                    // Update the used tokens and display them
                    setTokens(usedTokens.toString());
                    setTokenCountVisible(true);
                    
                    // Set the answer to the recieved data without the control sequence
                    setAnswer(dataChunk);
                  }else{
                    // Calculate the tokens of the answer
                    const tokensused = encode(localtext).length;
                    // Set the tokens to the sum of the input and the received answer
                    usedTokens = costbefore + tokensused;
                    // Update the answer and show the cursor char
                    setAnswer(dataChunk + "█");
                    localAnswer = dataChunk;
                  }
                  
                }, signal: cancleController.signal
                });

              // Add the generated answer to the history state
              // Validate that the answer is not empty
              if(localAnswer != ""){
              // We need to check if the user already has 10 saved states
                if(historyState.length >= 10){
                  // If so remove last Element from array
                  historyState.pop();
                }
  
                // Add the answer with the current time and the used tokens to the front of the history array
                historyState.unshift({ content: localAnswer, time: moment(Date.now()).format("DD.MM.YYYY"), tokens: usedTokens });
  
                // Encrypt the history array
                const encHistObj = await axios.post( "/api/prompt/encrypt", {
                  content: JSON.stringify(historyState),
                  salt: props.context.user.salt
                } );
    
                const encHist = encHistObj.data.message;

                // Check if the user previously had a history
                if(props.context.user.history){
                // If so get the history
                  const userhist = props.context.user.history;
                  // Set the history to the encoded string and update the user
                  userhist[props.laststate] = encHist;
                  await updateDoc( doc( db, "User", props.context.login.uid ), { history: userhist } );
                }else{
                // If the user previously didn't have a history
                // Init the history
                  const hist: History = {
                    monolog: "",
                    dialog: "",
                    blog: ""
                  };
                  // Update the history state of the assistant and update the user
                  const encHist = encHistObj.data.message;
                  hist[props.laststate] = encHist;
                  await updateDoc( doc( db, "User", props.context.login.uid ), { history: hist } );
                }
              }
            }catch(e){
              // If we encounter an error
              if(axios.isCancel(e)){
                // Check if we encounterd a cancle signal. E.g if the user aborted the request
                // Show the used tokens
                setTokens(usedTokens.toString());
                // Abort the request
                setCancleController(new AbortController);
              }else{
                setAnswer("");
                setPromptError(true);
                setTokens( "" );
              }
            }


            try{
              await axios.post( "/api/stats", { tokens: usedTokens, time: usedTokens, type: props.name } );
            }catch( e ){
              //console.log(e);
              //console.log("Timing logging failed!");
            }
            
            // Reduce the token balance by the used token
            if( props.context.company.tokens - usedTokens <= 0 ){
              props.context.company.tokens = 0;
            }else{
              props.context.company.tokens -= usedTokens
            }

            // Update the balance of the company
            await updateDoc( doc( db, "Company", props.context.user.Company ), { tokens: props.context.company.tokens } );

            // Get the usage of the current month and year from the user
            const userusageidx = props.context.user.usedCredits.findIndex( ( val ) => {
              return val.month == currentMonth && val.year == currentYear
            } );

            // Check if the user used the tool in the current month and year
            if( userusageidx != -1 ){
              // If so just update the usage with the used tokens
              const usageupdates = props.context.user.usedCredits;
              usageupdates[userusageidx].amount += usedTokens;
              await updateDoc( doc( db, "User", props.context.login.uid ), { usedCredits: usageupdates } );
            }else{
              // Otherwise create a new usage object and write it to the user
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

  /**
   * Component for displaying the history
   * @returns List of history objects
   */
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
      return (<div className={styles.emptyhistory}>
        <h3>Noch keine Anfragen</h3>
      </div>);
    }
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
              {promptError?
                <Result
                  status="error"
                  title="Bei der Erzeugung der Antwort ist ein Fehler aufgetreten!"
                />
                : <Answer />}
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