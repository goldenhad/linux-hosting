import router from "next/router";
import { useEffect, useState } from "react";
import { Button, Form, Input, Select, Steps, Typography, message } from "antd";
import styles from "./setup.module.scss"
import { useAuthContext } from "../../components/context/AuthContext";
import updateData from "../../firebase/data/updateData";
import { listToOptions } from "../../helper/architecture";
import axios from "axios";
import UploadProfileImage from "../../components/UploadProfileImage/UploadProfileImage";
const { Paragraph } = Typography;
const { TextArea } = Input;


/**
 * Setup Page used for setting up the user and company information after the first login
 * All data that is needed for the requesting of the user should be defined
 * here.
 * 
 */
export default function Setup(){
  const { login, user, role, profile, parameters, company } = useAuthContext();
  const [current, setCurrent] = useState( 0 );
  const [ setupForm ] = Form.useForm();
  const [ position, setPosition ] = useState(false);
  const [ tasks, setTasks ] = useState(false);
  const [ knowledge, setKnowledge ] = useState(false);
  const [ communicationstyle, setCommunicationstyle ] = useState(false);
  const [ profileImage, setProfileimage ] = useState("");
  const [ loading, setLoading ] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect( () => {
    // Check if the user already has gone trough setup
    if( user.setupDone ){
      router.push( "/" );
    }
  }, [user.setupDone] )


  /**
   * Returns the steps used for the setup depentend on the role of the current user
   * @returns Antd Steps for the setup
   */
  const getFormSteps = () => {        
    if(role.isCompany){
      if( role.canSetupCompany ){
        // Company-Admin
        return [
          {
            step: 0,
            title: "Erzähl mir etwas über Dich!",
            content: <div className={styles.singlestep}>
              <Paragraph>Zusätzlich benötigen wir noch Informationen über dich. Wer bist du, was treibt dich an?</Paragraph>
              <div className={styles.quadform}>
                <div className={styles.halfformcontainer}>
                  <div className={styles.formpart}>
                    <Form.Item name={"user.position"} label={"Wie lautet Deine Funktion im Unternehmen?"} className={styles.formitemlabel}>
                      <TextArea className={styles.forminput} onChange={( value ) => {
                        setPosition((value.currentTarget.value != ""));
                      }} rows={2} maxLength={100} placeholder={"Beschreibe kurz deine Rolle und Hauptaufgaben in deinem Unternehmen"}></TextArea>
                    </Form.Item>
                  </div>
                  <div className={styles.formpart}>
                    <Form.Item name={"user.tasks"} label={"Was sind Deine Aufgaben im Unternehmen?"}>
                      <Select
                        mode="tags"
                        style={{ width: "100%", fontWeight: "normal" }}
                        tokenSeparators={[","]}
                        placeholder={"Bitte nenne die Hauptprodukte und Dienstleistungen deines Unternehmens."}
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
                    <Form.Item name={"user.communicationstyle"} label={"Was ist das wichtigste Element in deinem Kommunikationsstil?"}>
                      <TextArea className={styles.forminput} onChange={( value ) => {
                        setCommunicationstyle((value.currentTarget.value != ""));
                      }} rows={2} maxLength={100} placeholder={"Bitte beschreibe das Schlüsselelement deines Kommunikationsstils."}></TextArea>
                    </Form.Item>
                  </div>
                  <div className={styles.formpart}>
                    <Form.Item name={"user.knowledge"} label={"Was sind Deine Fachkenntnisse und Spezialisierungen?"}>
                      <Select
                        mode="tags"
                        style={{ width: "100%", fontWeight: "normal" }}
                        tokenSeparators={[","]}
                        placeholder={"Bitte nenne die Hauptprodukte und Dienstleistungen deines Unternehmens."}
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
            title: "Erzähl mir etwas über deine Firma!",
            content: <div className={styles.singlestep}>
              <Paragraph>Zusätzlich benötigen wir noch Informationen über dich. Wer bist du, was treibt dich an?</Paragraph>
              <div className={styles.quadform}>
                <div className={styles.halfformcontainer}>
                  <div className={styles.formpart}>
                    <Form.Item name={"company.core"} label={"Was ist das Kerngeschäft deiner Firma?"} className={styles.formitemlabel}>
                      <TextArea
                        className={styles.forminput}
                        rows={2}
                        maxLength={100}
                        placeholder={"Bitte erläutere das Hauptgeschäftsfeld deiner Firma."}
                      ></TextArea>
                    </Form.Item>
                  </div>
                  <div className={styles.formpart}>
                    <Form.Item name={"company.team"} label={"Was zeichnet dich und dein Team aus?"}>
                      <TextArea
                        className={styles.forminput}
                        rows={2}
                        maxLength={100}
                        placeholder={"Bitte beschreibe die besonderen Stärken von dir und deinem Team."}
                      ></TextArea>
                    </Form.Item>
                  </div>
                </div>
  
                <div className={styles.halfformcontainer}>
                  <div className={styles.formpart}>
                    <Form.Item name={"company.philosophy"} label={"Wie würdest Du die Philosophie Deines Unternehmens beschreiben?"}>
                      <TextArea
                        className={styles.forminput}
                        rows={2}
                        maxLength={100}
                        placeholder={"Bitte umreiße kurz die Philosophie deines Unternehmens."}
                      ></TextArea>
                    </Form.Item>
                  </div>
                  <div className={styles.formpart}>
                    <Form.Item name={"company.products"} label={"Welche Produkte und Dienstleistungen bietet Ihr an?"}>
                      <Select
                        mode="tags"
                        style={{ width: "100%", fontWeight: "normal" }}
                        tokenSeparators={[","]}
                        placeholder={"Bitte nenne die Hauptprodukte und Dienstleistungen deines Unternehmens."}
                        notFoundContent={null}
                      />
                    </Form.Item>
                  </div>
                </div>
              </div>
            </div>
          },
          {
            step: 2,
            title: "Wie schreibst du deine Mails?",
            content: <div className={styles.singlestep}>
              <Paragraph>
                Wir möchten mehr über deinen Schreibstil erfahren, damit Siteware.Mail ihn perfekt imitieren kann. 
                Das hilft uns, dir eine personalisierte und natürliche Erfahrung zu bieten.
              </Paragraph>
              <div className={styles.formpart}>
                <Form.Item name={"mail.styles"} label={"Wir würdest du den Stil deiner E-Mails beschreiben? (maximal  3)"}
                  rules={[
                    () => ( {
                      validator( _, value ) {
                        if(value){
                          if( value.length > 3 ){
                            setupForm.setFieldValue( "styles", value.slice( 0, 3 ) )
                          }
                        }
                        return Promise.resolve();
                      }
                    } )
                  ]}
                >
                  <Select options={listToOptions( parameters.style )} className={styles.formselect} size='large' mode="multiple" allowClear/>
                </Form.Item>
              </div>
              <div className={styles.formpart}>
                <Form.Item name={"mail.emotions"} label={"Welche Gemütslage hast du dabei? (maximal  3)"}
                  rules={[
                    () => ( {
                      validator( _, value ) {
                        if(value){
                          if( value.length > 3 ){
                            setupForm.setFieldValue( "emotions", value.slice( 0, 3 ) )
                          }
                        }
                        return Promise.resolve();
                      }
                    } )
                  ]}
                >
                  <Select options={listToOptions( parameters.emotions )} className={styles.formselect} size='large' mode="multiple" allowClear/>
                </Form.Item>
              </div>
            </div>
          },
          {
            step: 3,
            title: "Lade ein Profilbild hoch",
            content: <div className={styles.singlestep}>
              <Paragraph>
                Hey! Bereit, dein Profil zum Leben zu erwecken? Lade jetzt ein Profilbild hoch! Keine Sorge, falls du gerade keins zur Hand hast 
                – du kannst es auch später jederzeit hinzufügen.
              </Paragraph>
              <div className={styles.uploadcontainer}>
                <UploadProfileImage
                  login={login}
                  loading={{ state: loading, set: setLoading }}
                  image={{ url: profileImage, set: setProfileimage }}
                  messageApi={messageApi}
                  profile={profile}
                />
              </div>
            </div>
          }
        ];
      }else{
        // Mailagent or Company-Manager
        return [
          {
            step: 0,
            title: "Erzähl mir etwas über Dich!",
            content: <div className={styles.singlestep}>
              <Paragraph>Zusätzlich benötigen wir noch Informationen über dich. Wer bist du, was treibt dich an?</Paragraph>
              <div className={styles.quadform}>
                <div className={styles.halfformcontainer}>
                  <div className={styles.formpart}>
                    <Form.Item name={"user.position"} label={"Wie lautet Deine Funktion im Unternehmen?"} className={styles.formitemlabel}>
                      <TextArea className={styles.forminput} onChange={( value ) => {
                        setPosition((value.currentTarget.value != ""));
                      }} rows={2} maxLength={100} placeholder={"Beschreibe kurz deine Rolle und Hauptaufgaben in deinem Unternehmen"}></TextArea>
                    </Form.Item>
                  </div>
                  <div className={styles.formpart}>
                    <Form.Item name={"user.tasks"} label={"Was sind Deine Aufgaben im Unternehmen?"}>
                      <Select
                        mode="tags"
                        style={{ width: "100%", fontWeight: "normal" }}
                        tokenSeparators={[","]}
                        placeholder={"Bitte nenne die Hauptprodukte und Dienstleistungen deines Unternehmens."}
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
                    <Form.Item name={"user.communicationstyle"} label={"Was ist das wichtigste Element in deinem Kommunikationsstil?"}>
                      <TextArea className={styles.forminput} onChange={( value ) => {
                        setCommunicationstyle((value.currentTarget.value != ""));
                      }} rows={2} maxLength={100} placeholder={"Bitte beschreibe das Schlüsselelement deines Kommunikationsstils."}></TextArea>
                    </Form.Item>
                  </div>
                  <div className={styles.formpart}>
                    <Form.Item name={"user.knowledge"} label={"Was sind Deine Fachkenntnisse und Spezialisierungen?"}>
                      <Select
                        mode="tags"
                        style={{ width: "100%", fontWeight: "normal" }}
                        tokenSeparators={[","]}
                        placeholder={"Bitte nenne die Hauptprodukte und Dienstleistungen deines Unternehmens."}
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
                <Form.Item name={"mail.styles"} label={"Wir würdest du den Stil deiner E-Mails beschreiben? (maximal  3)"}
                  rules={[
                    () => ( {
                      validator( _, value ) {
                        if(value){
                          if( value.length > 3 ){
                            setupForm.setFieldValue( "styles", value.slice( 0, 3 ) )
                          }
                        }
                        return Promise.resolve();
                      }
                    } )
                  ]}
                >
                  <Select options={listToOptions( parameters.style )} className={styles.formselect} size='large' mode="multiple" allowClear/>
                </Form.Item>
              </div>
              <div className={styles.formpart}>
                <Form.Item name={"mail.emotions"} label={"Welche Gemütslage hast du dabei? (maximal  3)"}
                  rules={[
                    () => ( {
                      validator( _, value ) {
                        if(value){
                          if( value.length > 3 ){
                            setupForm.setFieldValue( "emotions", value.slice( 0, 3 ) )
                          }
                        }
                        return Promise.resolve();
                      }
                    } )
                  ]}
                >
                  <Select options={listToOptions( parameters.emotions )} className={styles.formselect} size='large' mode="multiple" allowClear/>
                </Form.Item>
              </div>
            </div>
          },
          {
            step: 2,
            title: "Lade ein Profilbild hoch",
            content: <div className={styles.singlestep}>
              <Paragraph>
                Hey! Bereit, dein Profil zum Leben zu erwecken? Lade jetzt ein Profilbild hoch! Keine Sorge, falls du gerade keins zur Hand hast 
                – du kannst es auch später jederzeit hinzufügen.
              </Paragraph>
              <div className={styles.uploadcontainer}>
                <UploadProfileImage
                  login={login}
                  loading={{ state: loading, set: setLoading }}
                  image={{ url: profileImage, set: setProfileimage }}
                  messageApi={messageApi}
                  profile={profile}
                />
              </div>
            </div>
          }
        ];
      }
    }else{
      // Singleuser
      return [
        {
          step: 0,
          title: "Erzähl mir etwas über Dich!",
          content: <div className={styles.singlestep}>
            <Paragraph>Zusätzlich benötigen wir noch Informationen über dich. Wer bist du, was treibt dich an?</Paragraph>
            <div className={styles.quadform}>
              <div className={styles.halfformcontainer}>
                <div className={styles.formpart}>
                  <Form.Item name={"user.position"} label={"Bitte beschreibe dich kurz in ein paar Sätzen"} className={styles.formitemlabel}>
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
                  <Form.Item name={"user.communicationstyle"} label={"Was ist das wichtigste Element in deinem Kommunikationsstil?"}>
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
              <Form.Item name={"mail.styles"} label={"Wir würdest du den Stil deiner E-Mails beschreiben? (maximal  3)"}
                rules={[
                  () => ( {
                    validator( _, value ) {
                      if(value){
                        if( value.length > 3 ){
                          setupForm.setFieldValue( "mail.styles", value.slice( 0, 3 ) )
                        }
                      }
                      return Promise.resolve();
                    }
                  } )
                ]}
              >
                <Select options={listToOptions( parameters.style )} className={styles.formselect} size='large' mode="multiple" allowClear/>
              </Form.Item>
            </div>
            <div className={styles.formpart}>
              <Form.Item name={"mail.emotions"} label={"Welche Gemütslage hast du dabei? (maximal  3)"}
                rules={[
                  () => ( {
                    validator( _, value ) {
                      if(value){
                        if( value.length > 3 ){
                          setupForm.setFieldValue( "mail.emotions", value.slice( 0, 3 ) )
                        }
                      }
                      return Promise.resolve();
                    }
                  } )
                ]}
              >
                <Select options={listToOptions( parameters.emotions )} className={styles.formselect} size='large' mode="multiple" allowClear/>
              </Form.Item>
            </div>
          </div>
        },
        {
          step: 2,
          title: "Lade ein Profilbild hoch",
          content: <div className={styles.singlestep}>
            <Paragraph>
              Hey! Bereit, dein Profil zum Leben zu erwecken? Lade jetzt ein Profilbild hoch! Keine Sorge, falls du gerade keins zur Hand hast 
              – du kannst es auch später jederzeit hinzufügen.
            </Paragraph>
            <div className={styles.uploadcontainer}>
              <UploadProfileImage
                login={login}
                loading={{ state: loading, set: setLoading }}
                image={{ url: profileImage, set: setProfileimage }}
                messageApi={messageApi}
                profile={profile}
              />
            </div>
          </div>
        }
      ];
    }
  }
  

  /**
   * Function to be called after setup completes. Creates a first profile for the user
   * and sets the company background if the user is a company admin.
   */
  async function setupUser(){
    // Get the user realated input from the form
    const positioninfo = setupForm.getFieldValue( "user.position" );
    const tasksinfo = setupForm.getFieldValue( "user.tasks" );
    const knowledgeinfo = setupForm.getFieldValue( "user.knowledge" );
    const communicationstyleinfo = setupForm.getFieldValue( "user.communicationstyle" );

    // Create a sample text containing the user information
    let userinfo = "";
    if(!role.isCompany){
      userinfo = `Mein Name ist ${user.firstname} ${user.lastname}. Ich würde mich beschreiben als: "${positioninfo}". 
    Bei der Kommunikation lege ich besonders Wert auf ${communicationstyleinfo}.`;
    }else{
      userinfo = `Mein Name ist ${user.firstname} ${user.lastname}. Ich arbeite bei ${company.name}. Meine Position im Unternehmen ist "${positioninfo}."
    In der Firma beschäftige ich mich mit "${tasksinfo.join(", ")}". Mich zeichnet besonders aus: "${knowledgeinfo.join(", ")}".
    Bei der Kommunikation lege ich besonders Wert auf ${communicationstyleinfo}.`;
    }

    // If the current user is Company Admin
    if( role.canSetupCompany ){
      // Get the company info from the form
      const coreinfo = setupForm.getFieldValue("company.core");
      const teaminfo = setupForm.getFieldValue("company.team");
      const philosophyinfo = setupForm.getFieldValue("company.philosophy");
      const productinfo = setupForm.getFieldValue("company.products");

      // Construct the company text used as company background
      const companyinfo = `Wir sind ${company.name}. Unser Kerngeschäft ist "${coreinfo}". Mein Team und ich zeichnet sich aus durch: "${teaminfo}".
      Die Philosophie meines Unternehmens ist ${philosophyinfo}. Wir bieten ${productinfo.join(", ")} als Produkte bzw. Dienstleistungen an.`;

      // Update the company with the background text
      await updateData( "Company", user.Company, {
        settings: {
          background: companyinfo.replace(/\s\s+/g, "")
        }
      } );
    }

    // Get the mail relevant information from the prompt
    let profileArr = [];
    const userstyles = setupForm.getFieldValue( "mail.styles" );
    const userEmotions = setupForm.getFieldValue( "mail.emotions" );

    try{
      // Construct the main profile and request encryption of it
      const encreq = await axios.post( "/api/prompt/encrypt", {
        content: JSON.stringify({
          name: "Hauptprofil",
          settings: {
            personal: userinfo.replace(/\s\s+/g, ""),
            emotions: userEmotions,
            stil: userstyles 
          } 
        }),
        salt: user.salt
      } );

      profileArr.push( encreq.data.message );
    }catch{
      profileArr = [];
    }

    // Update the user with the new constructed profile
    await updateData( "User", login.uid, { profiles: profileArr, setupDone: true } );

    // Redirect to the home page
    router.push( "/" );
  }

  return(
    <div>
      {contextHolder}
      <div className={styles.logincontainer}>
        <div className={styles.logorow}>
          <div className={styles.logobox}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={"/logo.svg"} alt="Logo" width={100}/>
          </div>
        </div>

        <div className={styles.formContainer}>
          <div className={styles.formtitle}>Willkommen bei Siteware.Mail</div>
          <div className={styles.formexplanation}>Wir müssen zuerst dein Konto einrichten<br/>Keine Sorge, es dauert nicht lang!</div>
                    
          <div className={styles.stepcontainer}>
            <Steps className={styles.stepbanner} current={current} items={getFormSteps()} />

            <div className={styles.stepformcontent}>
              <Form form={setupForm} onFinish={setupUser} layout="vertical">
                {getFormSteps()[current].content}
              </Form>
            </div>


            <div className={styles.continue}>
              {current < getFormSteps().length - 1 && (
                <Button
                  disabled={( !position || !tasks || !knowledge || !communicationstyle )}
                  type="primary"
                  onClick={
                    () => setCurrent( current + 1 )
                  }
                >
                      Weiter
                </Button>
              )}
              {current === getFormSteps().length - 1 && (
                <Button type="primary" onClick={() => setupUser()}>
                                Zu Siteware.Mail
                </Button>
              )}
              {current > 0 && (
                <Button style={{ margin: "0 8px" }} onClick={() => setCurrent( current - 1 )}>
                                Zurück
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className={styles.copyrightfooter}>© Siteware.Mail 2023</div>
    </div>
  );
}