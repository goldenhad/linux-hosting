import { Alert, Button, Card, Form, Input, Modal, Select, Steps, Tag, Tour, TourProps, Typography, message } from "antd";
import { SettingOutlined, DeleteOutlined } from "@ant-design/icons";
import styles from "./list.profiles.module.scss"
import { useEffect, useRef, useState } from "react";
import SidebarLayout from "../../lib/components/Sidebar/SidebarLayout";
import { useRouter } from "next/router";
const { Paragraph } = Typography;
const { TextArea } = Input;
import { useAuthContext } from "../../lib/components/context/AuthContext";
import { Profile, ProfileSettings } from "../../lib/firebase/types/Profile";
import updateData from "../../lib/firebase/data/updateData";
import { arrayUnion } from "firebase/firestore";
import { handleEmptyArray, handleUndefinedTour } from "../../lib/helper/architecture";
import axios from "axios";
import environment from "dotenv";
import { isMobile } from "react-device-detect";
import FatButton from "../../lib/components/FatButton";
environment.config();

// Define a maximum amount of profiles as constant
// We should move this value to the database settings...
const MAXPROFILES = 12;


export default function Profiles() {
  const context = useAuthContext();
  const { login, user, role, company } = context;
  const [ isCreateModalOpen, setIsCreateModalOpen ]  = useState( false );
  const [ isEditModalOpen, setIsEditModalOpen ]  = useState( false );
  const [ isDeleteModalOpen, setIsDeleteModalOpen ]  = useState( false );
  const [ errMsg, setErrMsg ] = useState( "" );
  const [ profileToDelete, setProfileToDelete ] = useState( -1 );
  const [ profileToEdit, setProfileToEdit ] = useState( -1 );
  const [ isErrVisible, setIsErrVisible ] = useState( false );
  const [ tokenCount, setTokenCount ] = useState( 0 );
  const [ form ] = Form.useForm();
  const [ editForm ] = Form.useForm();
  const [ decodedProfiles, setDecodedProfiles ] = useState( [] );
  const [current, setCurrent] = useState( 0 );
  const [open, setOpen] = useState<boolean>( !handleUndefinedTour( user.tour ).profiles );
  const [ position, setPosition ] = useState(false);
  const [ tasks, setTasks ] = useState(false);
  const [ knowledge, setKnowledge ] = useState(false);
  const [ communicationstyle, setCommunicationstyle ] = useState(false);
  const [ promptProcesing, setPromptProcessing ] = useState(false);

  // Define the refs to use in the tutorial
  const addRef = useRef( null );
  const profileRef = useRef( null );
  const router = useRouter();

  // Define the steps of the tutorial
  const toursteps: TourProps["steps"] = [
    {
      title: "Profile",
      description: "Willkommen auf der Profil-Seite. Hier findest du eine Übersicht deiner verschiedenen Profile, mit denen du E-Mails "+
      "schreiben kannst. Du hast die Möglichkeit, weitere Profile anzulegen, bestehende Profile zu bearbeiten oder zu löschen.",
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
      title: "Neue Profile",
      description: "Über diesen Button kannst du neue Profile anlegen. Du hast die Möglichkeit, insgesamt bis zu 12 verschiedene Profile zu erzeugen.",
      target: () => addRef.current,
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
      title: "Ein Profil",
      description: "Hier werden die einzelnen Profile angezeigt. Über das Zahnrad-Symbol unten rechts kannst du die Profile bearbeiten.",
      target: () => profileRef.current,
      nextButtonProps: {
        children: (
          "Alles klar"
        ),
        onClick: async () => {
          const currstate = user.tour;
          currstate.profiles = true;
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

  /**
   * Refreshes the page by replacing the route with the current route
   */
  const refreshData = () => {
    router.replace( router.asPath );
  }

  /**
   * Effect to redirect the user if they are not logged in
   */
  useEffect( () => {
    if ( login == null ) router.push( "/login" );
  }, [login, router] );

  /**
   * Effect to decode the user profiles, as they are saved encrypted in the database
   */
  useEffect( () => {
    /**
     * Decode function. Iterates over the profiles and decodes them iteratively after another
     * NOTICE: This could have a negative impact on the apps performance, as we engage the encryption sequential.
     * But a parallelized version has proven to be less controllable in this context
     */
    const decodeProfiles = async () => {
      const profilearr: Array<Profile> = [];

      // Iterate over the encoded user profiles
      for( let i = 0; i < user.profiles.length; i++ ){
        // Define the decoded profile variable were we sage the stringified version of the decoded profile
        let profilejson = "";
        try{
          // Call the API to decode the profile
          const decoded = await axios.post( "/api/prompt/decrypt", { 
            ciphertext: user.profiles[i],
            salt: user.salt
          } );
          profilejson = decoded.data.message;
        }catch( e ){
          // If we encounter an error during decoding, action the json string
          profilejson = "";
        }

        // Parse the decoded profile string
        const singleProfile: Profile = JSON.parse( profilejson );
        // Push the decoded profile object to the profile array
        profilearr.push( singleProfile );
      }

      // After we decoded all profiles, set the profile states to the array of decoded profiles
      setDecodedProfiles( profilearr );
    }

    // Check if the user has any profile. If so call the decode functions
    if( user.profiles ){
      decodeProfiles();
    }
  }, [user.profiles, user.salt] );


  /**
   * If called set the edit profile fields with the given values
   * @param obj Object containing the name and the settings of the profile
   */
  const setEditFields = ( obj: {name: string, settings: ProfileSettings} ) => {
    editForm.setFieldValue( "name", obj.name );
    editForm.setFieldValue( "personal", obj.settings.personal );
    editForm.setFieldValue( "tags", obj.settings.tags );
    editForm.setFieldValue( "user.position.edit", obj.settings.parameters?.position );
    editForm.setFieldValue( "user.tasks.edit", obj.settings.parameters?.tasks );
    editForm.setFieldValue( "user.knowledge.edit", obj.settings.parameters?.knowledge );
    editForm.setFieldValue( "user.communicationstyle.edit", obj.settings.parameters?.communicationstyle );

    // If the user defined tags set the tags count to the length of the array
    // So we can check that the user does not exceed the tag limit
    if( obj.settings.tags ){
      setTokenCount( obj.settings.tags.length );
    }
  }

  /**
   * Deletes the profile previously set in the profileToDelete state
   */
  const deleteProfile = async () => {
    // close the delete modal
    setIsDeleteModalOpen( false );
    try{
      // Check if the profileToDelete state does contain a valid index to the profiles array
      if ( profileToDelete != -1 ){
        // Get the profiles
        const profiles = user.profiles;
        // Splice the profile at the index saved in the state
        profiles.splice( profileToDelete, 1 );
        // Update the profile with the spliced array
        await updateData( "User", login.uid, { profiles: profiles } )
        // Reset the editform
        editForm.setFieldsValue( [] );
      }else{
        // If the index was not valid throw an error
        throw( "Profile not defined" );
      }
    }catch( e ){
      //console.log(e);
      // If we encounter any error inform the user about the problem
      setErrMsg( "Beim Löschen ist etwas fehlgeschlagen bitte versuche es später erneut." );
      setIsErrVisible( true );
    }

    setErrMsg( "" );
    setIsErrVisible( false );
      
    setProfileToDelete( -1 );
    refreshData();
  }

  /**
   * Edit a selected profile. Use the given values
   * @param values Input values of the edit form
   */
  const editProfile = async ( values ) => {
    // Get special editform values
    const positioninfo = editForm.getFieldValue( "user.position.edit");
    const tasksinfo = editForm.getFieldValue( "user.tasks.edit");
    const knowledgeinfo = editForm.getFieldValue( "user.knowledge.edit");
    const communicationstyleinfo = editForm.getFieldValue( "user.communicationstyle.edit");

    // Check if the name of the profile is still valid (in this case not false)
    if ( values.name ){
      // Check if the profiletoEdit state points to a valid array element
      if ( profileToEdit != -1 ){
        // Get the profiles
        const profiles = user.profiles;
        let encdata = "";

        // Indicate that we are processing a request, so the user does not get nervous
        setPromptProcessing(true);

        try{
          // Call the API to create a profile using the AI
          const aiinfo = await axios.post("/api/profile/create", {
            name: `${user.firstname} ${user.lastname}`,
            company: company.name,
            position: positioninfo,
            tasks: tasksinfo?.join(", "),
            knowledge: knowledgeinfo?.join(", "),
            communicationstyle: communicationstyleinfo,
            isSingleUser: !role.isCompany
          });

          // Stringify the information of the profile using the form values and the AI generated profile details
          const profiletoupload = JSON.stringify(
            {
              name: values.name,
              settings: {
                personal: aiinfo.data.message,
                tags: handleEmptyArray( values.tags ),
                parameters: {
                  position: positioninfo,
                  tasks: tasksinfo,
                  knowledge: knowledgeinfo,
                  communicationstyle: communicationstyleinfo
                }
              } 
            });

          // Encode the profile
          try{
            // Call the API encode endpoint with the newly generated profile
            const encreq = await axios.post( "/api/prompt/encrypt", { 
              content: profiletoupload,
              salt: user.salt
            } )
            encdata = encreq.data.message;
          }catch( e ){
            encdata = "";
          }

          // Update the profile at the index by overriding it with the newly generated profile
          profiles[profileToEdit] = encdata;

          // Update the user object
          await updateData( "User", login.uid, { profiles: profiles } )
          form.resetFields( [] );
        }catch(e){
          setPromptProcessing(false);
          message.error("Deine Anfrage konnte nicht verarbeitet werden. Bitte versuche es erneut!");
        }

        refreshData();
        setErrMsg( "" );
        setIsErrVisible( false );
        setIsEditModalOpen( false );
        form.resetFields( [] );
      }else{
        message.error("Beim Speichern ist etwas fehlgeschlagen. Bitte versuche es erneut!");
      }
    }
  }

  /**
   * Create a profile with the given values
   * @param values Create profile form input form
   */
  const createProfile = async ( values ) => {
    // Get the user realated input from the form
    const positioninfo = form.getFieldValue( "user.position" );
    const tasksinfo = form.getFieldValue( "user.tasks" );
    const knowledgeinfo = form.getFieldValue( "user.knowledge" );
    const communicationstyleinfo = form.getFieldValue( "user.communicationstyle" );

    setPromptProcessing(true);

    try{
      // Query the API to generate a profile with the AI
      const aiinfo = await axios.post("/api/profile/create", {
        name: `${user.firstname} ${user.lastname}`,
        company: company.name,
        position: positioninfo,
        tasks: tasksinfo?.join(", "),
        knowledge: knowledgeinfo?.join(", "),
        communicationstyle: communicationstyleinfo,
        isSingleUser: !role.isCompany
      });
  
      setPromptProcessing(false);

      // Check that the user entered a profile
      if( values.name ){
        try{
          // Construct the profile object
          const profileObj = {
            name: values.name,
            settings: {
              personal: aiinfo.data.message,
              tags: handleEmptyArray( values.tags ),
              parameters: {
                position: positioninfo,
                tasks: tasksinfo,
                knowledge: knowledgeinfo,
                communicationstyle: communicationstyleinfo
              }
            }
          }

          // Stringify the profile object
          const stringified = JSON.stringify( profileObj );
          let encdata = "";
  
          try{
            // Encrypt the stringified profile object using the API
            const encreq = await axios.post( "/api/prompt/encrypt", { 
              content: stringified,
              salt: user.salt
            } )
            encdata = encreq.data.message;
          }catch( e ){
            //console.log(e);
            encdata = "";
          }

          // Update the user object with newly generated profile
          await updateData( "User", login.uid, { profiles: arrayUnion( encdata ) } )
          
          setIsCreateModalOpen( false );
        }catch( e ){
          setErrMsg( "Beim Speichern ist etwas fehlgeschlagen bitte versuche es später erneut." );
          setIsErrVisible( true );
          setIsCreateModalOpen( true );
        }
      
        setErrMsg( "" );
        setIsErrVisible( false );
        
        form.resetFields();
  
        setCurrent(0);
        setPosition(false);
        setTasks(false);
        setKnowledge(false);
        setCommunicationstyle(false);
      }
    }catch(e){
      // Catch any error during generation
      message.error("Bei der Erstellung des Profils ist etwas schiefgelaufen bitte versuche es erneut!");
      setPromptProcessing(false);
    }
  }

  /**
   * Generate Antd tags from a given array
   * @param tags String array containing tags input
   */
  const getTags = ( tags: Array<string> ) => {
    if( tags ){
      return tags.map( ( element, tagid ) => {
        return(
          <Tag key={tagid}>{element}</Tag>
        );
      } );
    }
  }

  /**
   * Component to display the profiles in seperate cards if there are any defined profiles.
   * Displays a text if the user has not created a profile
   * @constructor
   */
  const ProfileDisplay = () => {
    if( user.profiles && user.profiles.length > 0 ){

      return (
        <>
          <div ref={profileRef} className={styles.profilerow}>
            { decodedProfiles.map( ( singleProfile: Profile, idx ) => {
              const settings: ProfileSettings = singleProfile.settings;

              let actions = [];
              if( idx != 0 ) {
                actions = [
                  <div key={0} onClick={() => {
                    setProfileToEdit( idx ); setEditFields( { name: singleProfile.name, settings: settings } ); setIsEditModalOpen( true );
                  }}><SettingOutlined key="setting" /></div>,
                  <div key={1} onClick={() => {
                    setProfileToDelete( idx ); setIsDeleteModalOpen( true )
                  }}><DeleteOutlined key="edit" /></div>
                ];
              }else{
                actions = [
                  <div key={0} onClick={() => {
                    setProfileToEdit( idx ); setEditFields( { name: singleProfile.name, settings: settings } ); setIsEditModalOpen( true );
                  }}><SettingOutlined key="setting" /></div>
                ];
              }

              return (
                <Card
                  key={idx}
                  style={{
                    width: 300,
                    marginTop: 16
                  }}
                  actions={actions}
                >
                  <div className={styles.profilecard}>
                    <div className={styles.profilecard_title}>{singleProfile.name}</div>
                    <div className={styles.profilecard_tags}>
                      { getTags( settings.tags )}
                    </div>
                  </div>
                </Card>
              );
            } ) }
          </div>
          <div ref={addRef} className={styles.addProfileRow}>
            <FatButton onClick={() => {
              setIsCreateModalOpen( true )
            }} disabled={( user.profiles && user.profiles.length >= MAXPROFILES )} text="+ Hinzufügen" />
          </div>
          <div className={styles.profilecounter}>{user.profiles? user.profiles.length : 0} von 12 erstellt</div>
        </>
      );
    }else{
      return <div className={styles.profilesempty}><h3>Noch keine Profile definiert</h3></div>
    }
  }


  /**
   * Get the steps used to guide the user during the creation of the profile
   */
  const getSteps = () => {
    if(role.isCompany){
      return [
        {
          step: 0,
          title: "Erzähl mir etwas über Dich!",
          content: <div className={styles.singlestep}>
            <Paragraph>Zusätzlich benötigen wir noch Informationen über dich. Wer bist du, was treibt dich an?</Paragraph>
            <div className={styles.quadform}>
              <div className={styles.halfformcontainer}>
                <div className={styles.formpart}>
                  <Form.Item
                    name={"user.position"}
                    label={"Wie lautet Deine Funktion im Unternehmen?"}
                    className={styles.formitemlabel}
                    rules={[
                      {
                        required: true,
                        message: "Bitte gib deine Funktion im Unternehmen an!"
                      }
                    ]}
                  >
                    <TextArea className={styles.forminput} onChange={( value ) => {
                      setPosition((value.currentTarget.value != ""));
                    }} rows={2} maxLength={100} placeholder={"Beschreibe kurz deine Rolle und Hauptaufgaben in deinem Unternehmen"}></TextArea>
                  </Form.Item>
                </div>
                <div className={styles.formpart}>
                  <Form.Item
                    name={"user.tasks"}
                    label={"Was sind Deine Aufgaben im Unternehmen?"}
                    rules={[
                      {
                        required: true,
                        message: "Bitte gib deine Aufgaben im Unternehmen ein!"
                      }
                    ]}
                  >
                    <Select
                      mode="tags"
                      style={{ width: "100%", fontWeight: "normal" }}
                      tokenSeparators={[","]}
                      placeholder={"Bitte gib deine Aufgaben im Unternehmen ein."}
                      notFoundContent={null}
                      onChange={( values ) => {
                        setTasks((values.length != 0));
                      }}
                    />
                  </Form.Item>
                </div>
              </div>

              <div className={styles.halfformcontainer}>
                <div className={styles.formpart}>
                  <Form.Item
                    name={"user.communicationstyle"}
                    label={"Was ist das wichtigste Element in deinem Kommunikationsstil?"}
                    rules={[
                      {
                        required: true,
                        message: "Bitte teile uns mit, was das wichtigste Element in deinem Kommunikationsstil ist."
                      }
                    ]}
                  >
                    <TextArea className={styles.forminput} onChange={( value ) => {
                      setCommunicationstyle((value.currentTarget.value != ""));
                    }} rows={2} maxLength={100} placeholder={"Bitte beschreibe das Schlüsselelement deines Kommunikationsstils."}></TextArea>
                  </Form.Item>
                </div>
                <div className={styles.formpart}>
                  <Form.Item
                    name={"user.knowledge"}
                    label={"Was sind Deine Fachkenntnisse und Spezialisierungen?"}
                    rules={[
                      {
                        required: true,
                        message: "Bitte gib deine Fachkenntnisse und Spezialisierungen an!"
                      }
                    ]}
                  >
                    <Select
                      mode="tags"
                      style={{ width: "100%", fontWeight: "normal" }}
                      tokenSeparators={[","]}
                      placeholder={"Bitte nenne deine Fachkenntnisse und Spezialisierungen."}
                      notFoundContent={null}
                      onChange={( values ) => {
                        setKnowledge((values.length != 0));
                      }}
                    />
                  </Form.Item>
                </div>
              </div>
            </div>
          </div>
        },
        {
          step: 1,
          title: "Abschließen",
          content: <div>
            <Paragraph>
                In diesem Bereich kannst du deinem Profil einen Namen geben und es mit Tags kategorisieren.
            </Paragraph>
            <Form.Item className={styles.formpart} name="name" rules={[{ required: true, message: "Ein Name ist erforderlich!" }]}>
              <Input className={styles.forminput} placeholder='Name des Profils'></Input>
            </Form.Item>
            <Paragraph>
                Kategorisiere dein Profil über Tags
            </Paragraph>
            <Form.Item className={styles.formpart} name="tags">
              <Select
                className={styles.formselect}
                mode="tags"
                style={{ width: "100%" }}
                tokenSeparators={[","]}
                options={[]}
                placeholder={"Tippe, um Tags hinzuzufügen, die das Profil kategorisieren"}
                notFoundContent={null}
              />
            </Form.Item>
          </div>
        }
      ];
    }else{
      return [
        {
          step: 0,
          title: "Erzähl mir etwas über Dich!",
          content: <div className={styles.singlestep}>
            <Paragraph>Zusätzlich benötigen wir noch Informationen über dich. Wer bist du, was treibt dich an?</Paragraph>
            <div className={styles.quadform}>
              <div className={styles.halfformcontainer}>
                <div className={styles.formpart}>
                  <Form.Item
                    name={"user.position"}
                    label={"Bitte beschreibe dich kurz in ein paar Sätzen"}
                    className={styles.formitemlabel}
                    rules={[
                      {
                        required: true,
                        message: "Bitte beschreibe dich kurz!"
                      }
                    ]}
                  >
                    <TextArea className={styles.forminput} onChange={( value ) => {
                      setPosition((value.currentTarget.value != ""));
                      setKnowledge(true);
                      setTasks(true);
                    }} rows={2} maxLength={100} placeholder={"Beschreibe kurz wer du bist und was dich antreibt"}></TextArea>
                  </Form.Item>
                </div>
              </div>

              <div className={styles.halfformcontainer}>
                <div className={styles.formpart}>
                  <Form.Item
                    name={"user.communicationstyle"}
                    label={"Was ist das wichtigste Element in deinem Kommunikationsstil?"}
                    rules={[
                      {
                        required: true,
                        message: "Bitte teile uns mit, was das wichtigste Element in deinem Kommunikationsstil ist."
                      }
                    ]}
                  >
                    <TextArea className={styles.forminput} onChange={( value ) => {
                      setCommunicationstyle((value.currentTarget.value != ""));
                      setKnowledge(true);
                      setTasks(true);
                    }} rows={2} maxLength={100} placeholder={"Bitte beschreibe das Schlüsselelement deines Kommunikationsstils."}></TextArea>
                  </Form.Item>
                </div>
              </div>
            </div>
          </div>
        },
        {
          step: 1,
          title: "Abschließen",
          content: <div>
            <Paragraph>
                In diesem Bereich kannst du deinem Profil einen Namen geben und es mit Tags kategorisieren.
            </Paragraph>
            <Form.Item className={styles.formpart} name="name" rules={[{ required: true, message: "Ein Name ist erforderlich!" }]}>
              <Input className={styles.forminput} placeholder='Name des Profils'></Input>
            </Form.Item>
            <Paragraph>
                Kategorisiere dein Profil über Tags
            </Paragraph>
            <Form.Item className={styles.formpart} name="tags">
              <Select
                className={styles.formselect}
                mode="tags"
                style={{ width: "100%" }}
                tokenSeparators={[","]}
                options={[]}
                placeholder={"Tippe, um Tags hinzuzufügen, die das Profil kategorisieren"}
                notFoundContent={null}
              />
            </Form.Item>
          </div>
        }
      ];
    }
  }

  /**
   * Component to render the form used for editing a profile
   * @constructor
   */
  const EditForm = () => {
    if(role.isCompany){
      return(
        <div className={styles.quadform}>
          <div className={styles.halfformcontainer}>
            <div className={styles.formpart}>
              <Form.Item
                name={"user.position.edit"}
                label={"Wie lautet Deine Funktion im Unternehmen?"}
                className={styles.formitemlabel}
                rules={[
                  {
                    required: true,
                    message: "Bitte gib deine Funktion im Unternehmen ein!"
                  }
                ]}
              >
                <TextArea
                  className={styles.forminput}
                  rows={2}
                  maxLength={100}
                  placeholder={"Beschreibe kurz deine Rolle und Hauptaufgaben in deinem Unternehmen"}
                ></TextArea>
              </Form.Item>
            </div>
            <div className={styles.formpart}>
              <Form.Item
                name={"user.tasks.edit"}
                label={"Was sind Deine Aufgaben im Unternehmen?"}
                rules={[
                  {
                    required: true,
                    message: "Bitte gib deine Aufgaben im Unternehmen ein!"
                  }
                ]}
              >
                <Select
                  mode="tags"
                  style={{ width: "100%", fontWeight: "normal" }}
                  tokenSeparators={[","]}
                  placeholder={"Bitte gib deine Aufgaben im Unternehmen ein."}
                  notFoundContent={null}
                />
              </Form.Item>
            </div>
          </div>

          <div className={styles.halfformcontainer}>
            <div className={styles.formpart}>
              <Form.Item
                name={"user.communicationstyle.edit"}
                label={"Was ist das wichtigste Element in deinem Kommunikationsstil?"}
                rules={[
                  {
                    required: true,
                    message: "Bitte gib das wichtigste Element deines Kommunikationsstils an!"
                  }
                ]}
              >
                <TextArea
                  className={styles.forminput}
                  rows={2}
                  maxLength={100}
                  placeholder={"Bitte beschreibe das Schlüsselelement deines Kommunikationsstils."}
                ></TextArea>
              </Form.Item>
            </div>
            <div className={styles.formpart}>
              <Form.Item
                name={"user.knowledge.edit"}
                label={"Was sind Deine Fachkenntnisse und Spezialisierungen?"}
                rules={[
                  {
                    required: true,
                    message: "Bitte gib deine Fachkenntnisse und Spezialisierungen an!"
                  }
                ]}
              >
                <Select
                  mode="tags"
                  style={{ width: "100%", fontWeight: "normal" }}
                  tokenSeparators={[","]}
                  placeholder={"Bitte nenne deine Fachkenntnisse und Spezialisierungen."}
                  notFoundContent={null}
                  onChange={( values ) => {
                    setKnowledge((values.length != 0));
                  }}
                />
              </Form.Item>
            </div>
          </div>
        </div>
      );
    }else{
      return(
        <div className={styles.quadform}>
          <div className={styles.halfformcontainer}>
            <div className={styles.formpart}>
              <Form.Item
                name={"user.position.edit"}
                label={"Bitte beschreibe dich kurz in ein paar Sätzen"}
                className={styles.formitemlabel}
                rules={[
                  {
                    required: true,
                    message: "Bitte beschreibe dich kurz!"
                  }
                ]}
              >
                <TextArea
                  className={styles.forminput}
                  rows={2}
                  maxLength={100}
                  placeholder={"Beschreibe kurz deine Rolle und Hauptaufgaben in deinem Unternehmen"}
                ></TextArea>
              </Form.Item>
            </div>
          </div>

          <div className={styles.halfformcontainer}>
            <div className={styles.formpart}>
              <Form.Item
                name={"user.communicationstyle.edit"}
                label={"Was ist das wichtigste Element in deinem Kommunikationsstil?"}
                rules={[
                  {
                    required: true,
                    message: "Bitte gib das wichtigste Element deines Kommunikationsstils an!"
                  }
                ]}
              >
                <TextArea
                  className={styles.forminput}
                  rows={2}
                  maxLength={100}
                  placeholder={"Bitte beschreibe das Schlüsselelement deines Kommunikationsstils."}
                ></TextArea>
              </Form.Item>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <SidebarLayout context={context}>
      <div className={styles.main}>
        <div className={styles.interactionrow}>
        </div>
        <div className={styles.projecttable}>
          <ProfileDisplay />
        </div>

        <Modal
          title={"Ein neues Profil anlegen"}
          open={isCreateModalOpen}
          width={(isMobile)? "90%": "70%"}
          onCancel={() => {
            setIsCreateModalOpen( false )
          }}
          footer = {[]}
        >
          <div className={styles.stepcontainer}>
            <Steps className={styles.stepbanner} current={current} items={getSteps()} />
            <div className={styles.stepformcontent}>
              <Form
                layout='vertical'
                onFinish={createProfile}
                form={form}
              >
                {getSteps()[current].content}
                <div className={styles.continue}>
                  {current == 0 && (
                    <Button
                      type="primary"
                      onClick={() => setCurrent( current + 1 )}
                      disabled={( !position || !tasks || !knowledge || !communicationstyle )}
                    >
                    Weiter
                    </Button>
                  )}

                  {current === getSteps().length - 1 && (
                    <Button loading={promptProcesing} type="primary" htmlType='submit'>
                    Speichern
                    </Button>
                  )}
                  {current > 0 && (
                    <Button style={{ margin: "0 8px" }} onClick={() => setCurrent( current - 1 )}>
                    Zurück
                    </Button>
                  )}
                </div>
                <div className={styles.errorrow} style={{ display: ( isErrVisible )? "block": "none" }}>
                  <Alert type='error' message={errMsg} />
                </div>
              </Form>
            </div>
          </div>
        </Modal>

        <Modal
          title="Profil bearbeiten"
          open={isEditModalOpen}
          width={"70%"}
          onCancel={() => {
            setIsEditModalOpen( false )
          }}
          footer = {[]}
        >
          <Form 
            layout='vertical'
            onFinish={editProfile}
            form={editForm}
          >
            <Form.Item className={styles.formpart} label={<b>Profilname</b>} name="name" rules={[{ required: true, message: "Ein Name ist erforderlich!" }]}>
              <Input className={styles.forminput} placeholder="Names des Profils..."/>
            </Form.Item>
  
            <EditForm />

            <Form.Item className={styles.formpart} label={<b>Tags {tokenCount}/4</b>} name="tags">
              <Select
                className={styles.formselect}
                mode="tags"
                style={{ width: "100%" }}
                tokenSeparators={[","]}
                onChange={( value ) => {
                  setTokenCount( value.length );
                }}
                options={[]}
                maxTagCount={5}
                placeholder={"Tippe, um Tags hinzuzufügen, die das Profil kategorisieren"}
              />
            </Form.Item>
  
                
            <div className={styles.errorrow} style={{ display: ( isErrVisible )? "block": "none" }}>
              <Alert type='error' message={errMsg} />
            </div>
  
            <div className={styles.finishformrow}>
              <Button type='primary' loading={promptProcesing} htmlType='submit'>Speichern</Button>
            </div>
  
          </Form>
        </Modal>
  
        <Modal
          title="Profil Löschen"
          open={isDeleteModalOpen}
          onCancel={() => {
            setIsDeleteModalOpen( false )
          }}
          footer = {[]}
          width={800}
        >
          <div className={styles.deletecontainer}>
            <Paragraph>Willst du das Profil wirklich löschen?</Paragraph>
  
            <div className={styles.finishformrow}>
              <Button type='default' onClick={() => {
                setIsDeleteModalOpen( false )
              }}>Abbrechen</Button>
              <Button type='primary' onClick={() => {
                deleteProfile()
              }}>Löschen</Button>
            </div>
          </div>
        </Modal>
        <Tour open={open} onClose={async () => {
          const currstate = user.tour;
          currstate.profiles = true;
          updateData( "User", login.uid, { tour: currstate } );
          setOpen( false );
        }} steps={toursteps} />
      </div>
    </SidebarLayout>
  )
}
  
