import { Card, Button, Form, Input, Result, Alert, Avatar, Spin, message, QRCode, Modal } from "antd";
import styles from "./account.module.scss"
import { useEffect, useState } from "react";
import { GetServerSideProps } from "next";
import SidebarLayout from "../../components/Sidebar/SidebarLayout";
import { useAuthContext } from "../../components/context/AuthContext";
import { handleEmptyString } from "../../helper/architecture";
import { usernameExistsAtDifferentUser } from "../../firebase/auth/userExists";
import { LoadingOutlined } from "@ant-design/icons";
import forgotpassword from "../../firebase/auth/forgot";
import updateData from "../../firebase/data/updateData";
import axios from "axios";
import { TourState, User, basicUser } from "../../firebase/types/User";
import deleteData from "../../firebase/data/deleteData";
import deleteSitewareUser from "../../firebase/auth/delete";
import { getDocWhere } from "../../firebase/data/getData";
import reauthUser from "../../firebase/auth/reauth";
import { useRouter } from "next/router";


export interface InitialProps {
  Data: object;
}

export const getServerSideProps: GetServerSideProps = async () => {

  return {
    props: {
      Data: {}
    }
  };
};


function onlyUpdateIfSet( val, ideal ){
  if( val != "" ){
    return val;
  }else{
    return ideal;
  }
}


export default function Account() {
  const { login, user, company, role } = useAuthContext();
  const [ personalForm ] = Form.useForm();
  const [ wasReset, setWasReset ] = useState( false );
  const [ isErrVisible, setIsErrVisible ] = useState( false );
  const [ editSuccessfull, setEditSuccessfull ] = useState( false );
  const [messageApi, contextHolder] = message.useMessage();
  const [ deleteAccountModal, setDeleteAccountModal ] = useState( false );
  const [ reauthSuccessfull, setReauthSuccessfull] = useState( false );
  const [ reauthErr, setReauthErr ] = useState( false );
  const [ recommendLink, setRecommendLink ] = useState( "" );
  const router = useRouter();

  useEffect( () => {
    personalForm.setFieldValue( "username", user.username );
    personalForm.setFieldValue( "email", login.email );
    personalForm.setFieldValue( "firstname", user.firstname );
    personalForm.setFieldValue( "lastname", user.lastname );
    personalForm.setFieldValue( "street", company.street );
    personalForm.setFieldValue( "postalcode", company.postalcode );
    personalForm.setFieldValue( "city", company.city );


    const getRecommendLink = async () => {

      const encryptedLink = await axios.post( "/api/recommend", { from: user.Company } );
      if( encryptedLink.data.message != "" ){
        setRecommendLink( encryptedLink.data.message );
      }
    }
    
    getRecommendLink();
  }, [] );



  const saveAccountInfo = async () => {
    const username = personalForm.getFieldValue( "username" );
    const firstname = personalForm.getFieldValue( "firstname" );
    const lastname = personalForm.getFieldValue( "lastname" );

    const street = personalForm.getFieldValue( "street" );
    const postalcode = personalForm.getFieldValue( "postalcode" );
    const city = personalForm.getFieldValue( "city" );

    const { error } = await updateData( "User", login.uid, { 
      username: onlyUpdateIfSet( username, user.username ),
      firstname: onlyUpdateIfSet( firstname, user.firstname ),
      lastname: onlyUpdateIfSet( lastname, user.lastname )
    } );

    if( !error ){
      if( !role.isCompany ){
        await updateData( "Company", user.Company, { 
          street: onlyUpdateIfSet( street, company.street ),
          postalcode: onlyUpdateIfSet( postalcode, company.postalcode ),
          city: onlyUpdateIfSet( city, company.city )
        } );
      }

      if( !error ){
        setIsErrVisible( false );
        setEditSuccessfull( true );
      }else{
        setIsErrVisible( true );
        setEditSuccessfull( false );
      }
    }else{
      setIsErrVisible( true );
      setEditSuccessfull( false );
    }
  }

  const getRecommendCard = () => {
    if( company ){
      if( !company.recommended ){
        return(
          <div className={styles.recommend}>
            <Card className={styles.recommendcard} title="Siteware.Mail weiterempfehlen" headStyle={{ backgroundColor: "#F9FAFB" }} bordered={true}>
              <div className={styles.recommendContent}>
                <h3 className={styles.recommendHeadline}>Lade deine Freunde ein und sichere dir Gratis-Mails!</h3>
                <p>Du hast jetzt die Gelegenheit, deine Freunde zu unserem Service einzuladen.
                      Für jeden Freund, der sich erfolgreich registriert, schenken wir dir 200 Gratis-Mails als Dankeschön.
                      Teile einfach diesen Link, um deine Freunde einzuladen:
                </p>
                <div className={styles.recommendLink}>
                  {( recommendLink == "" )? <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />: <div onClick={() => {
                    copyLink()
                  }}>{recommendLink}</div>}
                </div>
                <p>Alternativ kannst du auch folgenden QR-Code herunterladen und deinen Freunden schicken:</p>
                <div className={styles.recommendqrcode} id="recommendqrcode">
                  <QRCode errorLevel="M" status={( recommendLink == "" )? "loading": undefined} value={recommendLink} bgColor="#fff" />
                </div>
                <div className={styles.downloadQRCode}>
                  <Button type='primary' onClick={downloadQRCode} className={styles.download}>Download</Button>
                </div>
              </div>
            </Card>
          </div>
        );
      }
    }
  }

  const getPersonalForm = () => {
    if( role.isCompany ){
      return(
        <Form layout='vertical' form={personalForm} onFinish={() => {
          saveAccountInfo()
        }} onChange={() => {
          setIsErrVisible( false ), setEditSuccessfull( false )
        }}>
          <div className={styles.formrow}>
            <Form.Item
              className={styles.formpart}
              name={"username"}
              label="Benutzername"
              rules={[
                () => ( {
                  async validator( _, value ) {
                    if( value != "" ){
                      if ( await usernameExistsAtDifferentUser( value, login.uid ) ) {
                        return Promise.reject( new Error( "Dieser Benutzername wird bereits verwendet!" ) );
                                        
                      }
                    }
                    return Promise.resolve();
                  }
                } )
              ]}
            >
              <Input className={styles.forminput} />
            </Form.Item>
          </div>

          <div className={styles.formrow}>
            <Form.Item className={styles.formpart} name={"email"} label="E-Mail">
              <Input className={styles.forminput} disabled/>
            </Form.Item>
          </div>

          <div className={`${styles.formrow} ${styles.multiformrow}`}>
            <Form.Item className={styles.formpart} name={"firstname"} label="Vorname">
              <Input className={styles.forminput} />
            </Form.Item>

            <Form.Item className={styles.formpart} name={"lastname"} label="Nachname">
              <Input className={styles.forminput} />
            </Form.Item>
          </div>

          <div className={styles.errorrow} style={{ display: ( isErrVisible )? "block": "none" }}>
            <Alert type='error' message={"Speichern fehlgeschlagen, bitte versuche es erneut!"} />
          </div>

          <div className={styles.successrow} style={{ display: ( editSuccessfull )? "block": "none" }}>
            <Alert type='success' message="Speichern erfolgreich!" />
          </div>

          <div className={styles.savebuttonrow}>
            <Button type='primary' className={styles.save} htmlType='submit'>Speichern</Button>
          </div>
        </Form>
      );
    }else{
      return(
        <Form layout='vertical' form={personalForm} onFinish={() => {
          saveAccountInfo()
        }} onChange={() => {
          setIsErrVisible( false ), setEditSuccessfull( false )
        }}>
          <Form.Item
            className={styles.formpart}
            name={"username"}
            label="Benutzername"
            rules={[
              () => ( {
                async validator( _, value ) {
                  if( value != "" ){
                    if ( await usernameExistsAtDifferentUser( value, login.uid ) ) {
                      return Promise.reject( new Error( "Dieser Benutzername wird bereits verwendet!" ) );
                                        
                    }
                  }
                  return Promise.resolve();
                }
              } )
            ]}
          >
            <Input className={styles.forminput} />
          </Form.Item>

          <div className={styles.formrow}>
            <Form.Item className={styles.formpart} name={"email"} label="E-Mail">
              <Input className={styles.forminput} disabled/>
            </Form.Item>
          </div>

          <div className={`${styles.formrow} ${styles.multiformrow}`}>
            <Form.Item className={styles.formpart} name={"firstname"} label="Vorname">
              <Input className={styles.forminput} />
            </Form.Item>

            <Form.Item className={styles.formpart} name={"lastname"} label="Nachname">
              <Input className={styles.forminput} />
            </Form.Item>
          </div>

          <div className={`${styles.formrow} ${styles.multiformrow}`}>
            <Form.Item className={styles.formpart} name={"street"} label="Straße">
              <Input className={styles.forminput} />
            </Form.Item>

            <Form.Item className={styles.formpart} name={"postalcode"} label="PLZ">
              <Input className={styles.forminput} />
            </Form.Item>

            <Form.Item className={styles.formpart} name={"city"} label="Ort">
              <Input className={styles.forminput} />
            </Form.Item>
          </div>

          <div className={styles.errorrow} style={{ display: ( isErrVisible )? "block": "none" }}>
            <Alert type='error' message={"Speichern fehlgeschlagen, bitte versuche es erneut!"} />
          </div>

          <div className={styles.successrow} style={{ display: ( editSuccessfull )? "block": "none" }}>
            <Alert type='success' message="Speichern erfolgreich!" />
          </div>

          <div className={styles.savebuttonrow}>
            <Button type='primary' className={styles.save} htmlType='submit'>Speichern</Button>
          </div>
        </Form>
      );
    }
  }


  const sendResetMail = async () => {
    const { error } = await forgotpassword( login.email );

    if ( error ) {
      //console.log(error);
    }else{
      setWasReset( true );
    }
  };

  const getResetButton = () => {
    if( wasReset ){
      return(
        <Result
          status="success"
          title={<div className={styles.passwordresetnotice}>Neues Passwort, Neues Glück – Dein Reset-Link ist Unterwegs!</div>}
          subTitle={<div className={styles.passwordresetsubtitle}>Checke deine E-Mails – wir haben dir den Link zum Zurücksetzen deines Passworts geschickt! 🚀</div>}
        />
      );
    }else{
      return(
        <div className={styles.savebuttonrow}>
          <Button type='primary' onClick={() => {
            sendResetMail()
          }} className={styles.save}>Passwort zurücksetzen</Button>
        </div>
      );
    }
  }

  const resetTutorial = async () => {
    const resetTutObj: TourState = {
      home: false,
      dialog: false,
      monolog: false,
      usage: false,
      profiles: false
    }
    const { error } = await updateData( "User", login.uid, { tour: resetTutObj } );
    if( error ){
      messageApi.error( "Beim zurücksetzen des Tutorials ist etwas schiefgelaufen. Versuche es später nochmal!" );
    }else{
      messageApi.success( "Tutorial zurückgesetzt!" );
    }
  }

  const getSettings = () => {
    return(
      <div className={styles.tutorialbuttonrow}>
        <Button type='primary' onClick={() => {
          resetTutorial()
        }} className={styles.resettutorial}>Tutorial zurücksetzen</Button>
      </div>
    );
  }

  const copyLink = () => {
    if( recommendLink != "" ){
      navigator.clipboard.writeText( recommendLink );
      messageApi.success( "Link in die Zwischenablage kopiert." );
    }
  }

  const downloadQRCode = () => {
    const canvas = document.getElementById( "recommendqrcode" )?.querySelector<HTMLCanvasElement>( "canvas" );
    if ( canvas ) {
      const url = canvas.toDataURL( "image/png", 1.0 );
      const a = document.createElement( "a" );
      a.download = "siteware_mail_recommend.png";
      a.href = url;
      document.body.appendChild( a );
      a.click();
      document.body.removeChild( a );
    }
  };

  const deleteUser = async () => {
    // Check role of user...

    switch ( user.Role ) {
    case "Company-Admin":
      const { result } = await getDocWhere( "User", "Company", "==", user.Company );
      if( result ){
        // Test if the current company-admin is the last person in the company
        if( result.length > 1 ){
          // If we are no the last person in the company, query the remaining users
          const userOfCompany: Array<User & { id: string }> = result;
                    
          const companyManager = userOfCompany.filter( ( Singleuser: User & { id: string } ) => {
            return Singleuser.Role == "Company-Manager";
          } );

          // Test if the remaining users contain at least one company-manager
          if( companyManager.length == 0 ){
            // Query for any Mail-Agent
            const mailagents = userOfCompany.filter( ( Singleuser: User & { id: string } ) => {
              return Singleuser.Role == "Mailagent";
            } );

            // Make the first agent you find the new company owner
            const firstAgent = mailagents[0];
            await updateData( "User", firstAgent.id, { Role: "Company-Admin" } );
            const snglSerDeleteData = await deleteData( "User", login.uid );
            if( !snglSerDeleteData.error ){
              await deleteSitewareUser()
            }
          }else{
            // Override the company ownership the the first company-manager you find
            const firstManager = companyManager[0];
            await updateData( "User", firstManager.id, { Role: "Company-Admin" } );
            const snglSerDeleteData = await deleteData( "User", login.uid );
            if( !snglSerDeleteData.error ){
              await deleteSitewareUser()
            }
          }
        }else{
          // We can savely delete the company if we are the last person in it
          const cmpnysnglSerDeleteData = await deleteData( "Company", user.Company );
          if( !cmpnysnglSerDeleteData.error ){
            const snglSerDeleteData = await deleteData( "User", login.uid );
            if( !snglSerDeleteData.error ){
              await deleteSitewareUser()
            }
          }
        }
      }
      break;

    case "Company-Manager":
      const cpmngrDeleteData = await deleteData( "User", login.uid );
      if( !cpmngrDeleteData.error ){
        await deleteSitewareUser()
      }
      break;
            
    case "Mailagent":
      // Mailagents can be deleted easily as they have no constraint on the company
      const mlgntDeleteData = await deleteData( "User", login.uid );
      if( !mlgntDeleteData.error ){
        await deleteSitewareUser()
      }
      break;

    case "Singleuser":
      const cmpnysnglSerDeleteData = await deleteData( "Company", user.Company );
      console.log( cmpnysnglSerDeleteData );
      if( !cmpnysnglSerDeleteData.error ){
        const snglSerDeleteData = await deleteData( "User", login.uid );
        console.log( snglSerDeleteData );
        if( !snglSerDeleteData.error ){
          const deleteUserCall = await deleteSitewareUser();
          console.log( deleteUserCall );
        }
      }
      break;
        
    default:
      break;
    }

    router.push( "/login" );
  }

  const getUser = () =>{
    if( user != null ){
      return user;
    }else{
      return basicUser;
    }
  }

  return (
    <>
      {contextHolder}
      <SidebarLayout role={role} user={user} login={login}>
        <div className={styles.main}>
          <Avatar size={250} style={{ backgroundColor: "#f0f0f2", color: "#474747", fontSize: 100 }}>
            {handleEmptyString( getUser().firstname ).toUpperCase().charAt( 0 )}{handleEmptyString( getUser().lastname ).toUpperCase().charAt( 0 )}
          </Avatar>
          <div className={styles.personal}>
            <Card className={styles.personalcard} title="Persönliche Informationen" headStyle={{ backgroundColor: "#F9FAFB" }} bordered={true}>
              {getPersonalForm()}
            </Card>
          </div>
          <div className={styles.password}>
            <Card className={styles.passwordcard} title="Passwort" headStyle={{ backgroundColor: "#F9FAFB" }} bordered={true}>
              {getResetButton()}
            </Card>
          </div>

          <div className={styles.password}>
            <Card className={styles.passwordcard} title="Einstellungen" headStyle={{ backgroundColor: "#F9FAFB" }} bordered={true}>
              {getSettings()}
            </Card>
          </div>

          {getRecommendCard()}

          <div className={styles.deleteRow}>
            <Button type='primary' danger onClick={() => {
              setDeleteAccountModal( true )
            }} className={styles.deleteAccount}>Konto löschen</Button>

            <Modal
              open={deleteAccountModal}
              title="Account wirklich löschen?"
              onCancel={() => {
                setDeleteAccountModal( false )
              }}
              footer={null}
            >
              <div>
                <p>
                    Achtung: Du bist dabei, dein Konto zu löschen. Beachte, dass nach der Löschung alle Daten endgültig entfernt werden und nicht wiederhergestellt
                    werden können. Bitte logge dich noch einmal ein, um die Löschung abzuschließen.</p>
                <div className={styles.reauthform}>
                  {( !reauthSuccessfull )? <Form name="reauth" className={styles.loginform} layout='vertical' onFinish={async ( values ) => {
                    const { error } = await reauthUser( values.email, values.password );
                    if( error ){
                      setReauthErr( true );
                      setReauthSuccessfull( false );
                    }else{
                      setReauthErr( false );
                      setReauthSuccessfull( true );
                    }
                  }}
                  onChange={() => {
                    setReauthErr( false )
                  }}
                  >
                    <Form.Item
                      label="E-Mail"
                      name="email"
                      className={styles.loginpart}
                    >
                      <Input className={styles.logininput} />
                    </Form.Item>

                    <Form.Item
                      label="Passwort"
                      name="password"
                      className={styles.loginpart}
                    >
                      <Input.Password className={styles.logininput} />
                    </Form.Item>

                    {( reauthErr )?
                      <Alert type='error' className={styles.reautherrormsg} message="Beim Login ist etwas schief gelaufen oder die Login-Daten sind falsch!" />
                      : <></>
                    }

                    <div className={styles.reauthloginbuttonrow}>
                      <Button type='primary' className={styles.reauthloginbutton} htmlType='submit'>Login</Button>
                    </div>
                  </Form>: <div className={styles.deletefinaly}><Button danger onClick={() => {
                    deleteUser()
                  }}>Konto entgültig löschen!</Button></div>}
                </div>
              </div>
            </Modal>
          </div>

        </div>
      </SidebarLayout>
    </>
  )
}
