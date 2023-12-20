import { Alert, Button, Card, Form, Input, Modal, Select, Steps, Tag, Tour, TourProps, Typography, message } from "antd";
import { SettingOutlined, DeleteOutlined } from "@ant-design/icons";
import styles from "./list.profiles.module.scss"
import { useEffect, useRef, useState } from "react";
import { GetServerSideProps } from "next";
import SidebarLayout from "../../components/Sidebar/SidebarLayout";
import { useRouter } from "next/router";
const { Paragraph } = Typography;
const { TextArea } = Input;
import { useAuthContext } from "../../components/context/AuthContext";
import { Profile, ProfileSettings } from "../../firebase/types/Profile";
import updateData from "../../firebase/data/updateData";
import { arrayUnion } from "firebase/firestore";
import { handleEmptyArray, handleUndefinedTour, listToOptions } from "../../helper/architecture";
import axios from "axios";
import environment from "dotenv";
import { isMobile } from "react-device-detect";
environment.config();

const MAXPROFILES = 12;


export interface InitialProps {
  Data: { Profiles: Array<Profile & {parsedSettings: ProfileSettings}> };
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



export default function Profiles() {
  const context = useAuthContext();
  const { login, user, parameters, role, company } = context;
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
  const [ emotionBarrier, setEmotionBarrier ] = useState(false);
  const [ styleBarrier, setStyleBarrier ] = useState(false);
  const [ promptProcesing, setPromptProcessing ] = useState(false);

  const addRef = useRef( null );
  const profileRef = useRef( null );

  const router = useRouter();


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

  
  const refreshData = () => {
    router.replace( router.asPath );
  }

  useEffect( () => {

    if ( login == null ) router.push( "/login" );
        
  }, [login, router] );


  useEffect( () => {
    const decodeProfiles = async () => {
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

      setDecodedProfiles( profilearr );
    }

    if( user.profiles ){
      decodeProfiles();
    }
  }, [user.profiles, user.salt] );
    

  
  const setEditFields = ( obj: {name: string, settings: ProfileSettings} ) => {
    editForm.setFieldValue( "name", obj.name );
    editForm.setFieldValue( "personal", obj.settings.personal );
    editForm.setFieldValue( "style", obj.settings.stil );
    editForm.setFieldValue( "emotions", obj.settings.emotions );
    editForm.setFieldValue( "tags", obj.settings.tags );
    editForm.setFieldValue( "user.position.edit", obj.settings.parameters?.position );
    editForm.setFieldValue( "user.tasks.edit", obj.settings.parameters?.tasks );
    editForm.setFieldValue( "user.knowledge.edit", obj.settings.parameters?.knowledge );
    editForm.setFieldValue( "user.communicationstyle.edit", obj.settings.parameters?.communicationstyle );

    if( obj.settings.tags ){
      setTokenCount( obj.settings.tags.length );
    }
  }
  
  const deleteProfile = async () => {
    setIsDeleteModalOpen( false );
    try{
      if ( profileToDelete != -1 ){
        const profiles = user.profiles;
        profiles.splice( profileToDelete, 1 );

        await updateData( "User", login.uid, { profiles: profiles } )
        editForm.setFieldsValue( [] );
      }else{
        throw( "Profile not defined" );
      }
    }catch( e ){
      //console.log(e);
      setErrMsg( "Beim Löschen ist etwas fehlgeschlagen bitte versuche es später erneut." );
      setIsErrVisible( true );
    }
  
    setErrMsg( "" );
    setIsErrVisible( false );
      
    setProfileToDelete( -1 );
    refreshData();
  } 
  
  const editProfile = async ( values ) => {
    const positioninfo = editForm.getFieldValue( "user.position.edit");
    const tasksinfo = editForm.getFieldValue( "user.tasks.edit");
    const knowledgeinfo = editForm.getFieldValue( "user.knowledge.edit");
    const communicationstyleinfo = editForm.getFieldValue( "user.communicationstyle.edit");

    if ( values.name ){
      if ( profileToEdit != -1 ){
        const profiles = user.profiles;
        let encdata = "";

        setPromptProcessing(true);
        try{
          const aiinfo = await axios.post("/api/profile/create", {
            name: `${user.firstname} ${user.lastname}`,
            company: company.name,
            position: positioninfo,
            tasks: tasksinfo?.join(", "),
            knowledge: knowledgeinfo?.join(", "),
            communicationstyle: communicationstyleinfo,
            isSingleUser: !role.isCompany
          });

          const profiletoupload = JSON.stringify(
            {
              name: values.name,
              settings: {
                personal: aiinfo,
                stil: handleEmptyArray( values.style ),
                emotions: handleEmptyArray( values.emotions ),
                tags: handleEmptyArray( values.tags ),
                parameters: {
                  position: positioninfo,
                  tasks: tasksinfo,
                  knowledge: knowledgeinfo,
                  communicationstyle: communicationstyleinfo
                }
              } 
            } );

          try{
            const encreq = await axios.post( "/api/prompt/encrypt", { 
              content: profiletoupload,
              salt: user.salt
            } )

            encdata = encreq.data.message;
          }catch( e ){
            encdata = "";
          }

          profiles[profileToEdit] = encdata;
            
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
  
  const createProfile = async ( values ) => {
    // Get the user realated input from the form
    const positioninfo = form.getFieldValue( "user.position" );
    const tasksinfo = form.getFieldValue( "user.tasks" );
    const knowledgeinfo = form.getFieldValue( "user.knowledge" );
    const communicationstyleinfo = form.getFieldValue( "user.communicationstyle" );
    const styles = form.getFieldValue( "styles" );
    const emotions = form.getFieldValue( "emotions" );

    // Create a sample text containing the user information
    /* let userinfo = "";
    if(!role.isCompany){
      userinfo = `Mein Name ist ${user.firstname} ${user.lastname}. Ich würde mich beschreiben als: "${positioninfo}". 
    Bei der Kommunikation lege ich besonders Wert auf ${communicationstyleinfo}.`;
    }else{
      userinfo = `Mein Name ist ${user.firstname} ${user.lastname}. Ich arbeite bei ${company.name}. Meine Position im Unternehmen ist "${positioninfo}."
    In der Firma beschäftige ich mich mit "${tasksinfo.join(", ")}". Mich zeichnet besonders aus: "${knowledgeinfo.join(", ")}".
    Bei der Kommunikation lege ich besonders Wert auf ${communicationstyleinfo}.`;
    } */

    setPromptProcessing(true);

    try{
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
  
      if( values.name ){
        try{
          const profileObj = {
            name: values.name,
            settings: {
              personal: aiinfo.data.message,
              stil: handleEmptyArray( styles ),
              emotions: handleEmptyArray( emotions ),
              tags: handleEmptyArray( values.tags ),
              parameters: {
                position: positioninfo,
                tasks: tasksinfo,
                knowledge: knowledgeinfo,
                communicationstyle: communicationstyleinfo
              }
            }
          }
  
          const stringified = JSON.stringify( profileObj );
          let encdata = "";
  
          try{
            const encreq = await axios.post( "/api/prompt/encrypt", { 
              content: stringified,
              salt: user.salt
            } )
            encdata = encreq.data.message;
          }catch( e ){
            //console.log(e);
            encdata = "";
          }
  
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
        setEmotionBarrier(false);
        setStyleBarrier(false);
      }
    }catch(e){
      message.error("Bei der Erstellung des Profils ist etwas schiefgelaufen bitte versuche es erneut!");
      setPromptProcessing(false);
    }
  }

  const getTags = ( tags: Array<string> ) => {
    if( tags ){
      return tags.map( ( element, tagid ) => {
        return(
          <Tag key={tagid}>{element}</Tag>
        );
      } );
    }
  }
    
  const getProfileDisplay = () => {
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
          <div className={styles.addProfileRow}>
            <Button ref={addRef} type='primary' onClick={() => {
              setIsCreateModalOpen( true )
            }} disabled={( user.profiles && user.profiles.length >= MAXPROFILES )}>+ Hinzufügen</Button>
          </div>
          <div className={styles.profilecounter}>{user.profiles? user.profiles.length : 0} von 12 erstellt</div>
        </>
      );
    }else{
      return <div className={styles.profilesempty}><h3>Noch keine Profile definiert</h3></div>
    }
  }


  function getSteps(){
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
          title: "Wie schreibst du deine Mails?",
          content: <div className={styles.singlestep}>
            <Paragraph>
              Wir möchten mehr über deinen Schreibstil erfahren, damit Siteware.Mail ihn perfekt imitieren kann. 
              Das hilft uns, dir eine personalisierte und natürliche Erfahrung zu bieten.
            </Paragraph>
            <div className={styles.formpart}>
              <Form.Item name={"styles"} label={"Wir würdest du den Stil deiner E-Mails beschreiben? (maximal  3)"}
                rules={[
                  () => ( {
                    validator( _, value ) {
                      if(value){
                        if( value.length > 3 ){
                          form.setFieldValue( "styles", value.slice( 0, 3 ) )
                        }

                        if(value.length > 0){
                          setStyleBarrier(true);
                        }else{
                          setStyleBarrier(false);
                        }
                      }else{
                        setStyleBarrier(false);
                      }
                      return Promise.resolve();
                    }
                  }),
                  {
                    required: true,
                    message: "Bitte gib einen Stil an!"
                  }
                ]}
              >
                <Select options={listToOptions( parameters.style )} className={styles.formselect} size='large' mode="multiple" allowClear/>
              </Form.Item>
            </div>
            <div className={styles.formpart}>
              <Form.Item name={"emotions"} label={"Welche Gemütslage hast du dabei? (maximal  3)"}
                rules={[
                  () => ( {
                    validator( _, value ) {
                      if(value){
                        if( value.length > 3 ){
                          form.setFieldValue( "emotions", value.slice( 0, 3 ) )
                        }

                        if(value.length > 0){
                          setEmotionBarrier(true);
                        }else{
                          setEmotionBarrier(false);
                        }
                      }else{
                        setEmotionBarrier(false);
                      }
                      return Promise.resolve();
                    }
                  }),
                  {
                    required: true,
                    message: "Bitte lege die Gemütslage fest!"
                  }
                ]}
              >
                <Select options={listToOptions( parameters.emotions )} className={styles.formselect} size='large' mode="multiple" allowClear/>
              </Form.Item>
            </div>
          </div>
        },
        {
          step: 2,
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
          title: "Wie schreibst du deine Mails?",
          content: <div className={styles.singlestep}>
            <Paragraph>
              Wir möchten mehr über deinen Schreibstil erfahren, damit Siteware.Mail ihn perfekt imitieren kann. 
              Das hilft uns, dir eine personalisierte und natürliche Erfahrung zu bieten.
            </Paragraph>
            <div className={styles.formpart}>
              <Form.Item name={"styles"} label={"Wir würdest du den Stil deiner E-Mails beschreiben? (maximal  3)"}
                rules={[
                  () => ( {
                    validator( _, value ) {
                      if(value){
                        if( value.length > 3 ){
                          form.setFieldValue( "styles", value.slice( 0, 3 ) )
                        }

                        if(value.length > 0){
                          setStyleBarrier(true);
                        }else{
                          setStyleBarrier(false);
                        }
                      }else{
                        setStyleBarrier(false);
                      }
                      return Promise.resolve();
                    }
                  }),
                  {
                    required: true,
                    message: "Bitte gib einen Stil an!"
                  }
                ]}
              >
                <Select options={listToOptions( parameters.style )} className={styles.formselect} size='large' mode="multiple" allowClear/>
              </Form.Item>
            </div>
            <div className={styles.formpart}>
              <Form.Item name={"emotions"} label={"Welche Gemütslage hast du dabei? (maximal  3)"}
                rules={[
                  () => ( {
                    validator( _, value ) {
                      if(value){
                        if( value.length > 3 ){
                          form.setFieldValue( "emotions", value.slice( 0, 3 ) )
                        }

                        if(value.length > 0){
                          setEmotionBarrier(true);
                        }else{
                          setEmotionBarrier(false);
                        }
                      }else{
                        setEmotionBarrier(false);
                      }
                      return Promise.resolve();
                    }
                  }),
                  {
                    required: true,
                    message: "Bitte lege die Gemütslage fest!"
                  }
                ]}
              >
                <Select options={listToOptions( parameters.emotions )} className={styles.formselect} size='large' mode="multiple" allowClear/>
              </Form.Item>
            </div>
          </div>
        },
        {
          step: 2,
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

  //const items = steps.map( ( item ) => ( { key: item.title, title: item.title } ) );

  return (
    <SidebarLayout context={context}>
      <div className={styles.main}>
        <div className={styles.interactionrow}>
          
        </div>
        <div className={styles.projecttable}>
          { getProfileDisplay() }
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

                  {current == 1 && (
                    <Button
                      type="primary"
                      onClick={() => setCurrent( current + 1 )}
                      disabled={( !emotionBarrier || !styleBarrier )}
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

            <Form.Item className={styles.formpart} label={<b>Allgemeine Stilistik (maximal 3)</b>} name="style"
              rules={[
                () => ( {
                  validator( _, value ) {
                    if( value.length > 3 ){
                      editForm.setFieldValue( "style", value.slice( 0, 3 ) )
                    }
                    return Promise.resolve();
                  }
                } ),
                {
                  required: true,
                  message: "Bitte gib deine Stilistik an!"
                }
              ]}
            >
              <Select
                className={styles.formselect}
                placeholder="In welchem Stil soll geantwortet werden?"
                options={listToOptions( parameters.style )}
                mode="multiple"
                allowClear
              />
            </Form.Item>

            <Form.Item className={styles.formpart} label={<b>Allgemeine Gemütslage (maximal 3)</b>} name="emotions"
              rules={[
                () => ( {
                  validator( _, value ) {
                    if( value.length > 3 ){
                      editForm.setFieldValue( "emotions", value.slice( 0, 3 ) )
                    }
                    return Promise.resolve();
                  }
                } ),
                {
                  required: true,
                  message: "Bitte lege deine Gemütslage fest!"
                }
              ]}
            >
              <Select
                className={styles.formselect}
                placeholder="Wie ist deine allgemeine Gemütslage?"
                options={listToOptions( parameters.emotions )}
                mode="multiple"
                allowClear
              />
            </Form.Item>

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
        >
          <Paragraph>Willst du das Profil wirklich löschen?</Paragraph>
  
          <div className={styles.finishformrow}>
            <Button type='default' onClick={() => {
              setIsDeleteModalOpen( false )
            }}>Abbrechen</Button>
            <Button type='primary' onClick={() => {
              deleteProfile()
            }}>Löschen</Button>
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
  
