import { Card, Button, Form, Input, Result, Alert, Spin, message, QRCode, Modal, Upload, UploadProps } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import styles from "./account.module.scss"
import { useEffect, useState } from "react";
import { GetServerSideProps } from "next";
import SidebarLayout from "../../components/Sidebar/SidebarLayout";
import { useAuthContext } from "../../components/context/AuthContext";
import { usernameExistsAtDifferentUser } from "../../firebase/auth/userExists";
import { LoadingOutlined } from "@ant-design/icons";
import forgotpassword from "../../firebase/auth/forgot";
import updateData from "../../firebase/data/updateData";
import axios from "axios";
import { TourState, User } from "../../firebase/types/User";
import deleteData from "../../firebase/data/deleteData";
import deleteSitewareUser from "../../firebase/auth/delete";
import { getDocWhere } from "../../firebase/data/getData";
import reauthUser from "../../firebase/auth/reauth";
import { useRouter } from "next/router";
import { getBase64 } from "../../helper/upload";
import { RcFile, UploadChangeParam, UploadFile } from "antd/es/upload/interface";
import ImgCrop from "antd-img-crop";
import { deleteProfilePicture } from "../../firebase/drive/delete";


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
  const context = useAuthContext();
  const { login, user, company, role, profile } = context;
  const [ personalForm ] = Form.useForm();
  const [ wasReset, setWasReset ] = useState( false );
  const [ isErrVisible, setIsErrVisible ] = useState( false );
  const [ editSuccessfull, setEditSuccessfull ] = useState( false );
  const [messageApi, contextHolder] = message.useMessage();
  const [ deleteAccountModal, setDeleteAccountModal ] = useState( false );
  const [ reauthSuccessfull, setReauthSuccessfull] = useState( false );
  const [ reauthErr, setReauthErr ] = useState( false );
  const [ recommendLink, setRecommendLink ] = useState( "" );
  const [imageUrl, setImageUrl] = useState<string>( profile.picture );
  const [loading, setLoading] = useState( false );
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
    // eslint-disable-next-line
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
      profiles: false,
      company: false
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

          for( let i=0; i < userOfCompany.length; i++ ){
            const userobj = userOfCompany[i];
            if( userobj.id != login.uid ){
              await axios.post( "/api/company/member", { id: userobj.id } );
            }
          }

          await deleteProfilePicture( login.uid );
          await deleteData( "User", login.uid );
          await deleteData( "Company", user.Company );
          await deleteSitewareUser();
        }
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

  const handleChange: UploadProps["onChange"] = ( info: UploadChangeParam<UploadFile> ) => {
    if ( info.file.status === "uploading" ) {
      setLoading( true );
      return;
    }
    if ( info.file.status === "done" ) {
      // Get this url from response in real world.
      getBase64( info.file.originFileObj as RcFile, ( url ) => {
        setLoading( false );
        profile.setProfilePicture( url );
        setImageUrl( url )
      } );
    }
  };


  const uploadImage = ( options ) => {
    console.log( Upload.LIST_IGNORE );
    if( beforeUpload( options.file, undefined ) ){
      const { onSuccess, onError, file, onProgress } = options;
      const fmData = new FormData();
      const config = {
        headers: { "content-type": "multipart/form-data" },
        onUploadProgress: ( event ) => {
          console.log( ( event.loaded / event.total ) * 100 );
          onProgress( { percent: ( event.loaded / event.total ) * 100 },file );
        }
      };
      fmData.append( "image", file );
      fmData.append( "user", login.uid );
      axios
        .post( "/api/account/upload", fmData, config )
        .then( ( res ) => {
          onSuccess( file );
          console.log( res );
        } )
        .catch( ( )=>{
          const error = new Error( "Some error" );
          onError( { event:error } );
        } );
    }
    
    
  }

  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Profilbild hochladen</div>
    </div>
  );
  
  const beforeUpload = ( file: RcFile, message ) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if ( !isJpgOrPng ) {
      messageApi.error( "Das Format muss .png oder jpg sein!" );
    }
    
    const isLt2M = file.size / 1024 / 1024 < 2;
    if ( !isLt2M ) {
      messageApi.error( "Das Bild ist zu groß. Maximal sind 2MB erlaubt!" );
    }

    const uploadAllowed = ( Upload.LIST_IGNORE == "true" )? true: false;
    if( uploadAllowed ){
      setLoading( false );
    }
  
    return ( isJpgOrPng && isLt2M ) && !uploadAllowed ;
  }

  const getDeleteButton = () => {
    if( imageUrl ){
      return <DeleteOutlined className={styles.deleteProfilePictureButton} onClick={async () => {
        await deleteProfilePicture( login.uid );
        console.log( "Deleted Picture successfully!" )
        profile.setProfilePicture( undefined );
        setImageUrl( undefined );
      }}/>
    }
  }

  return (
    <>
      {contextHolder}
      <SidebarLayout context={context}>
        <div className={styles.main}>
          <div className={styles.profilepicturerow}>
            <ImgCrop
              onModalCancel={() => {
                Upload.LIST_IGNORE = "true";
              }}
              onModalOk={() => {
                Upload.LIST_IGNORE = "false";
              }}
            >
              <Upload
                name="avatar"
                listType="picture-circle"
                className="avatar-uploader"
                showUploadList={false}
                customRequest={uploadImage}
                onChange={handleChange}
                style={{ overflow: "hidden" }}
                rootClassName={styles.uploadavatar}
              >

                {imageUrl ?
                // eslint-disable-next-line
                <img src={imageUrl} alt="avatar" style={{ width: "100%" }} /> : uploadButton}
              </Upload>
            </ImgCrop>
            
            {/* <Avatar size={250} style={{ backgroundColor: "#f0f0f2", color: "#474747", fontSize: 100 }}>
              {handleEmptyString( getUser().firstname ).toUpperCase().charAt( 0 )}{handleEmptyString( getUser().lastname ).toUpperCase().charAt( 0 )}
            </Avatar> */}
            {getDeleteButton()}
          </div>
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
