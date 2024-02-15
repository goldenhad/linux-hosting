import { Card, Button, Form, Input, Result, message, Modal } from "antd";
import styles from "./account.module.scss"
import { useEffect, useState } from "react";
import SidebarLayout from "../../components/Sidebar/SidebarLayout";
import { useAuthContext } from "../../components/context/AuthContext";
import forgotpassword from "../../firebase/auth/forgot";
import updateData from "../../firebase/data/updateData";
import axios from "axios";
import { TourState, User } from "../../firebase/types/User";
import deleteData from "../../firebase/data/deleteData";
import deleteSitewareUser from "../../firebase/auth/delete";
import { getDocWhere } from "../../firebase/data/getData";
import reauthUser from "../../firebase/auth/reauth";
import { useRouter } from "next/router";
import { deleteProfilePicture } from "../../firebase/drive/delete";
import FatButton from "../../components/FatButton";
import EditUserForm from "../../components/Forms/EditUserForm/EditUserForm";
import UploadProfileImage from "../../components/UploadProfileImage/UploadProfileImage";



/**
 * Account-Page
 * 
 * Page resolving around everything user account related
 * 
 */
export default function Account() {
  const context = useAuthContext();
  const { login, user, company, role, profile } = context;
  const [ personalForm ] = Form.useForm();
  const [ wasReset, setWasReset ] = useState( false );
  const [messageApi, contextHolder] = message.useMessage();
  const [ deleteAccountModal, setDeleteAccountModal ] = useState( false );
  const [ reauthSuccessfull, setReauthSuccessfull] = useState( false );
  const [imageUrl, setImageUrl] = useState<string>( profile.picture );
  const [loading, setLoading] = useState( false );
  const router = useRouter();

  useEffect( () => {
    // Init the edit account form with the values of the user
    personalForm.setFieldValue( "username", user.username );
    personalForm.setFieldValue( "email", login.email );
    personalForm.setFieldValue( "firstname", user.firstname );
    personalForm.setFieldValue( "lastname", user.lastname );
    personalForm.setFieldValue( "street", company.street );
    personalForm.setFieldValue( "postalcode", company.postalcode );
    personalForm.setFieldValue( "city", company.city );

    // eslint-disable-next-line
  }, [] );



  /**
   * Local Component regarding the resetting of the users password
   * @returns JSX regarding the password reset
   */
  function PasswordResetButton() {
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
        <FatButton onClick={async () => {
          const { error } = await forgotpassword( login.email );

          if ( !error ) {
            setWasReset( true );
          }
        }} text="Passwort zurücksetzen" />
      );
    }
  }

  const resetTutorial = async () => {
    const resetTutObj: TourState = {
      home: false,
      dialog: false,
      monolog: false,
      blog: false,
      usage: false,
      profiles: false,
      company: false,
      excel: false,
      translator: false
    }
    const { error } = await updateData( "User", login.uid, { tour: resetTutObj } );
    if( error ){
      messageApi.error( "Beim zurücksetzen des Tutorials ist etwas schiefgelaufen. Versuche es später nochmal!" );
    }else{
      messageApi.success( "Tutorial zurückgesetzt!" );
    }
  }

  const deleteUser = async () => {
    // Check role of user...

    switch ( user.Role ) {
    case "Company-Admin":
      const { result } = await getDocWhere( "User", "Company", "==", user.Company );
      console.log(result);
      if( result ){
        // Test if there are any other users of the company
        if( result.length > 1 ){
          // If we are no the last person in the company, query the remaining users
          const userOfCompany: Array<User & { id: string }> = result;

          for( let i=0; i < userOfCompany.length; i++ ){
            const userobj = userOfCompany[i];
            if( userobj.id != login.uid ){
              await axios.post( "/api/company/member", { id: userobj.id } );
            }
          }
        }
      }

      try{
        await deleteProfilePicture( login.uid );
        await deleteData( "User", login.uid );
        await deleteData( "Company", user.Company );
        await deleteSitewareUser();
      }catch(e){
        console.log( e );
      }
      break;

    case "Company-Manager":
      const cpmngrDeleteData = await deleteData( "User", login.uid );
      if( !cpmngrDeleteData.error ){
        await deleteProfilePicture( login.uid );
        await deleteSitewareUser()
      }
      break;
            
    case "Mailagent":
      // Mailagents can be deleted easily as they have no constraint on the company
      const mlgntDeleteData = await deleteData( "User", login.uid );
      if( !mlgntDeleteData.error ){
        await deleteProfilePicture( login.uid );
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
          await deleteProfilePicture( login.uid );
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


  return (
    <>
      {contextHolder}
      <SidebarLayout context={context}>
        <div className={styles.main}>
          <UploadProfileImage 
            login={login}
            image={{ url: imageUrl, set: setImageUrl }}
            loading={{ state: loading, set: setLoading }}
            messageApi={messageApi}
            profile={profile}
          />
          <div className={styles.personal}>
            <Card className={styles.personalcard} title="Persönliche Informationen" bordered={true}>
              <EditUserForm form={personalForm} singleUser={!role.isCompany} user={user} login={login} messageApi={messageApi} />
            </Card>
          </div>
          <div className={styles.password}>
            <Card className={styles.passwordcard} title="Passwort" bordered={true}>
              <PasswordResetButton />
            </Card>
          </div>

          <div className={styles.password}>
            <Card className={styles.passwordcard} title="Einstellungen" bordered={true}>
              <FatButton onClick={() => {
                resetTutorial()
              }} text="Tutorial zurücksetzen" />
            </Card>
          </div>

          <div className={styles.deleteRow}>
            <FatButton danger={true} onClick={() => {
              setDeleteAccountModal( true )
            }} text="Konto löschen" />

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
                {( role.isCompany && role.canSetupCompany )?
                  <>
                    <br/>
                    <p>
                      <b>Wenn du dein Konto löschst, werden alle Konten deiner Firma gelöscht. Deine Mitarbeiter können sich dann nicht mehr einloggen!</b>
                    </p>
                  </> : <></>}
                <div className={styles.reauthform}>
                  {( !reauthSuccessfull )? <Form name="reauth" className={styles.loginform} layout='vertical' onFinish={async ( values ) => {
                    const { error } = await reauthUser( values.email, values.password );
                    if( error ){
                      setReauthSuccessfull( false );
                      messageApi.error("Fehler bei der Authentifizierung")

                    }else{
                      setReauthSuccessfull( true );
                    }
                  }}>
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


                    <FatButton isSubmitButton={true} text="Login" />
                  </Form>: <div className={styles.deletefinaly}><Button danger onClick={() => {
                    deleteUser();
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

