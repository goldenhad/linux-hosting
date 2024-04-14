import { useAuthContext } from "../../context/AuthContext";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Alert, Button, Card, Divider, Drawer, Form, message, notification, Result, Skeleton, Typography } from "antd";
import { toGermanCurrencyString, TokenCalculator } from "../../../helper/price";
import { useRouter } from "next/router";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../db";
import { Profile } from "../../../firebase/types/Profile";
import axios from "axios";
import Assistant, { AssistantInputColumn, AssistantInputType } from "../../../firebase/types/Assistant";
import { Order } from "../../../firebase/types/Company";
import updateData from "../../../firebase/data/updateData";
import getDocument from "../../../firebase/data/getData";
import { Templates } from "../../../firebase/types/Settings";
import moment from "moment";
import styles from "./qaaassistant.module.scss";
import Icon, { ArrowLeftOutlined, HistoryOutlined } from "@ant-design/icons";
import Info from "../../../public/icons/info.svg";
import Markdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { oneLight } from "react-syntax-highlighter/dist/cjs/styles/prism";
import SidebarLayout from "../../Sidebar/SidebarLayout";
import { handleEmptyString } from "../../../helper/architecture";
import { isMobile } from "react-device-detect";
import AssistantForm from "../../AssistantForm/AssistantForm";
import FatButton from "../../FatButton";
import Clipboard from "../../../public/icons/clipboard.svg";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { MessageInstance } from "antd/es/message/interface";
import { NotificationInstance } from "antd/es/notification/interface";


// Defines how long antd messages will be visible
const MSGDURATION = 3;

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

export default function QaAAssistant(props: {
    assistant: Assistant,
    context,
    quotaOverused: boolean,
    formDisabled: boolean,
    setHistoryOpen: Dispatch<SetStateAction<boolean>>,
    messageApi: MessageInstance,
    notificationApi: NotificationInstance
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
  const [ historyState, setHistoryState ] = useState([]);
  const [ cancleController, setCancleController ] = useState(new AbortController());
  //const [open, setOpen] = useState<boolean>( tourState  );
  const [ calculator ] = useState(new TokenCalculator(context.calculations))
  const router = useRouter();
  const [ form ] = Form.useForm();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;


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
        console.log(parsed);
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
              console.log(decryptedProfiles);
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
    props.assistant.inputColumns.forEach((column: AssistantInputColumn) => {
      column.inputs.forEach((inputobj) => {
        const cleanedValued = values[inputobj.key].replace(/(<~).+?(~>)/gm, "");

        if(inputobj.type == AssistantInputType.PROFILE){
          const profile: Profile = decryptedProfiles.find( ( singleProfile: Profile ) => {
            return singleProfile.name == values.profile;
          });

          if(profile){
            let profileInformation = "";
            if(context.role.isCompany){
              const companyinfo = `Ich arbeite für ${context.company.name}. Wir beschäftigen uns mit: ${context.company.settings.background}`;
              profileInformation = `Mein Name ist ${user.firstname} ${user.lastname}. Ich bin ${profile.settings.personal}. ${companyinfo}`
            }

            replaced = replaced.replace(`<${inputobj.key}>`, profileInformation);
          }
        }else{
          replaced = replaced.replace(`<${inputobj.key}>`, cleanedValued);
        }
      })
    })

    console.log(replaced);

    return { prompt: replaced };
  }

  const getBasicState = () => {
    const obj = {};
    props.assistant.inputColumns.forEach((column: AssistantInputColumn) => {
      column.inputs.forEach((inputobj, index) => {
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

  const updateCompanyTokens = async (cost) => {
    if(context.company.plan){
      if(context.company.plan?.state == "active"){
        let paymentSuccesfull = false;
        let invoiceid = "";

        // Check if company has less tokens than the threshold
        if(context.company.tokens < context.company.plan.threshold){
          // Try to charge the user with the values defined in the plan
          try{
            const paymentreq = await axios.post("/api/payment/issuepayment", {
              price: context.calculations.products[context.company.plan?.product].price,
              customer: context.company.customerId,
              method: context.company.paymentMethods[0].methodId
            });

            invoiceid = paymentreq.data.message;

            paymentSuccesfull = true;
          }catch{
            paymentSuccesfull = false;
          }


          // If the payment was successfull
          if(paymentSuccesfull){
            // Get the tokens that will be added according to the plan
            const amountToAdd = calculator.indexToPrice(context.company.plan?.product);
            // Add the totkens to the tokens of the company
            const updatedTokenValue = context.company.tokens + amountToAdd;

            // Update paymentmethod
            const newState = context.company.paymentMethods[0];
            newState.lastState = "successfull"
            const updatedMethods = [newState]

            // Create an order for the charged amount
            const currentOrders = context.company.orders;
            const nextInvoiceNumber = context.invoice_data.last_used_number+1;

            const newOrder: Order = {
              id: invoiceid,
              timestamp: Math.floor( Date.now() / 1000 ),
              tokens: amountToAdd,
              amount: context.calculations.products[context.company.plan?.product].price,
              method: "Stripe",
              state: "accepted",
              type: "recharge",
              invoiceId: `SM${context.invoice_data.number_offset + nextInvoiceNumber}`
            }

            // Added the new order to the company orders
            currentOrders.push( newOrder );
            // Update the last used invoice id
            await updateData( "Settings", "Invoices", { last_used_number: nextInvoiceNumber } );

            // Update the tokens of the company
            await updateData("Company", context.user.Company, {
              tokens: updatedTokenValue,
              paymentMethods: updatedMethods,
              orders: currentOrders
            });

            props.notificationApi.info({
              message: "Automatisches Nachfüllen",
              description: `Dein Credit-Budget wurde automatisch um ${toGermanCurrencyString(amountToAdd)} Tokens aufgefüllt!`,
              duration: MSGDURATION
            });
          }else{
            const newState = context.company.paymentMethods[0];
            newState.lastState = "error"
            const updatedMethods = [newState]

            await updateData("Company", context.user.Company, { tokens: context.company.tokens, paymentMethods: updatedMethods })

            props.notificationApi.error({
              message: "Automatisches Nafüllen",
              description: "Es ist ein Fehler beim automatischen Auffüllen deines Credit-Budgets aufgetreten.",
              duration: MSGDURATION
            });
          }
        }else{
          // Update the balance of the company
          console.log("Value to update ", context.company.tokens);
          await updateDoc( doc( db, "Company", context.user.Company ), { tokens: context.company.tokens } );
        }

      }else{
        // Update the balance of the company
        await updateDoc( doc( db, "Company", context.user.Company ), { tokens: context.company.tokens } );
      }
    }else{
      // Update the balance of the company
      await updateDoc( doc( db, "Company", context.user.Company ), { tokens: context.company.tokens } );
    }

    // Get the usage of the current month and year from the user
    const userusageidx = context.user.usedCredits.findIndex( ( val ) => {
      return val.month == currentMonth && val.year == currentYear
    } );

    // Check if the user used the tool in the current month and year
    if( userusageidx != -1 ){
      // If so just update the usage with the used tokens
      const usageupdates = context.user.usedCredits;
      usageupdates[userusageidx].amount += cost;
      await updateDoc( doc( db, "User", context.login.uid ), { usedCredits: usageupdates } );
    }else{
      // Otherwise create a new usage object and write it to the user
      const usageupdates = context.user.usedCredits;
      usageupdates.push( { month: currentMonth, year: currentYear, amount: cost } );
      await updateDoc( doc( db, "User", context.login.uid ), { usedCredits: usageupdates } );
    }
  }

  const reduceCost = (cost: number) => {
    // Reduce the token balance by the used token
    if( context.company.tokens - cost <= 0 ){
      context.company.tokens = 0;
    }else{
      context.company.tokens -= cost
    }
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
      const usedTokens = { in: 0, out: 0 };
      let cost = 0;

      // Retrieve the template for prompts from the database
      const templatereq = await getDocument("Settings", "Prompts");

      // Check if the template request was successful
      if (!templatereq.result) {
        throw Error("Settings not found...");
      }

      // Extract the template data
      const templates: Templates = templatereq.result.data();

      // Format the given values to fit to the prompt api
      const { prompt } = promptFunction( values, props.assistant.prompt )

      //Calculate the used tokens of the input
      const costbeforereq = await axios.post("/api/prompt/count", { prompt: prompt });

      if(costbeforereq){
        const costbefore = costbeforereq.data.tokens;

        if(costbefore){
          let localtext = "";
          let localAnswer = "";

          try{
            // Query the api for an answer to the input
            await axios.post( "/api/prompt/generate", { prompt: prompt, personality: props.assistant.personality },
              { onDownloadProgress: async (progressEvent) => {
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

                // Check if we encounterd a control char.
                if(parsedval && parsedval.length == 1){
                  // If we found the control sequence, we reached the end of the response
                  // Remove the control sequence
                  dataChunk = dataChunk.replace(`<~${parsedval[0]}~>`, "");
                  localAnswer = dataChunk;

                  // Calculate the tokens of the answer
                  const costbeforereq = await axios.post("/api/prompt/count", { prompt: localtext });
                  if(costbeforereq){
                    const tokensused = costbeforereq.data.tokens
                    // Set the tokens to the sum of the input and the received answer
                    usedTokens.in = costbefore;
                    usedTokens.out = tokensused;

                    // Update the used tokens and display them
                    setTokenCountVisible(true);

                    cost = calculator.cost(usedTokens);

                    // Add the generated answer to the history state
                    // Validate that the answer is not empty
                    if(localAnswer != ""){
                      // We need to check if the user already has 10 saved states
                      if(historyState.length >= MAXHISTITEMS){
                        // If so remove last Element from array
                        historyState.pop();
                      }

                      // Add the answer with the current time and the used tokens to the front of the history array
                      historyState.unshift({ content: localAnswer, time: moment(Date.now()).format("DD.MM.YYYY"), tokens: toGermanCurrencyString(cost) });

                      // Encrypt the history array
                      const encHistObj = await axios.post( "/api/prompt/encrypt", {
                        content: JSON.stringify(historyState),
                        salt: context.user.salt
                      } );

                      const encHist = encHistObj.data.message;

                      // Check if the user previously had a history
                      /*if(context.user.history){
                                                  // If so get the history
                          
                                                }else{
                                                  // If the user previously didn't have a history
                                                  // Init the history
                                                  const hist: History = {
                                                    monolog: "",
                                                    dialog: "",
                                                    monolog_old: "",
                                                    dialog_old: "",
                                                    blog: "",
                                                    excel: ""
                                                  };
                                                  // Update the history state of the assistant and update the user
                                                  const encHist = encHistObj.data.message;
                                                  hist[props.laststate] = encHist;
                                                  await updateDoc( doc( db, "User", props.context.login.uid ), { history: hist } );
                                                }*/

                      const userhist = context.user.history;
                      // Set the history to the encoded string and update the user
                      userhist[props.assistant.uid] = encHist;
                      await updateDoc( doc( db, "User", context.login.uid ), { history: userhist } );
                    }

                    reduceCost(cost)

                    await updateCompanyTokens(cost);

                    props.notificationApi.info({
                      message: "Creditverbrauch",
                      description: `Die Anfrage hat ${toGermanCurrencyString(cost)} verbraucht`,
                      duration: MSGDURATION
                    });

                    // Set the answer to the recieved data without the control sequence
                    setAnswer(dataChunk);
                  }


                }else{
                  // Update the answer and show the cursor char
                  setAnswer(dataChunk + "█");
                  localAnswer = dataChunk;

                }



              }, signal: cancleController.signal
              });
          }catch(e){
            // If we encounter an error
            if(axios.isCancel(e)){
              // Check if we encounterd a cancle signal. e.g if the user aborted the request
              // Show the used tokens

              const costbeforereq = await axios.post("/api/prompt/count", { prompt: localtext });
              if(costbeforereq){
                const tokensused = costbeforereq.data.tokens
                // Set the tokens to the sum of the input and the received answer
                usedTokens.in = costbefore;
                usedTokens.out = tokensused;

                cost = calculator.cost(usedTokens);

                reduceCost(cost);
                await updateCompanyTokens(cost);

                // Update the used tokens and display them
                setTokenCountVisible(true);

                props.notificationApi.info({
                  message: "Creditverbrauch",
                  description: `Die Anfrage hat  ${toGermanCurrencyString(cost)} Credits verbraucht`,
                  duration: MSGDURATION
                });
              }

              // Abort the request
              setCancleController(new AbortController);
            }else{
              setAnswer("");
              setPromptError(true);
            }
          }

          console.log("hier", context.company.tokens);



          // Check if the user activated automatic recharge. If charge them and add tokens
          console.log(context.company);


        }else{
          throw("Costbefore undefined");
        }
      }else{
        throw("Costbreforereq undefined");
      }
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
              <HistoryOutlined/>}>{`Bisherige Anfragen ${historyState.length}/${MAXHISTITEMS}`}</Button> : <></>
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
          <AssistantForm title={props.assistant.name} inputColumns={props.assistant.inputColumns}
            quotaOverused={quotaOverused}
            formDisabled={formDisabled} profiles={decryptedProfiles}/>
          <div className={styles.formfootercontainer}>
            <div className={styles.tokenalert}>
              {
                (quotaOverused) ?
                  <Alert
                    message={"Das Budget ist ausgeschöpft. In der Kontoübersicht kannst du weiteres Budget dazubuchen."}
                    type="error"/>
                  : <></>
              }
            </div>
            <div className={styles.generatebuttonrow}>
              <FatButton
                isSubmitButton={true}
                disabled={formDisabled || quotaOverused}
                text="Assistenten ausführen"
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
              form.submit();
            }} text="Neu generieren"/>
          </div>
        </div>
      </div>
      <style>{"span.ant-select-selection-placeholder{font-size: 14px !important; font-weight: normal !important}"}</style>
    </>
  );
}
