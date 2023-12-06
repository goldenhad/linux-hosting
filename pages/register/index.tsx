import router from "next/router";
import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import { Alert, Button, Checkbox, Form, Input, Select, Space } from "antd";
import styles from "./register.module.scss"
import signUp, { signUpUser } from "../../firebase/auth/signup";
import Head from "next/head";
import userExists, { usernameExists } from "../../firebase/auth/userExists";
import CookieBanner from "../../components/CookieBanner";
import { getDocWhere } from "../../firebase/data/getData";
import Link from "next/link";
import CryptoJS from "crypto-js";


export const getServerSideProps: GetServerSideProps = async ( ctx ) => {
  //Get the context of the request
  const { req, res, query } = ctx
  //Get the cookies from the current request
  const { cookies } = req
    
  //Check if the login cookie is set
  if( cookies.login ){
    //Redirect if the cookie is not set
    res.writeHead( 302, { Location: "/" } );
    res.end();
  }

  const invite = query.invite;
  if( invite ){
    try{
      const readableCipher = Buffer.from( invite as string, "base64" ).toString();
      const deciphered = CryptoJS.AES.decrypt( readableCipher, process.env.MAILENC ).toString( CryptoJS.enc.Utf8 );
      const json = Buffer.from( deciphered as string, "base64" ).toString();
      const invitiparams = JSON.parse( json );
      console.log( invitiparams );

      const currTime = Math.floor( Date.now() / 1000 );
      const timeDifference =  currTime - invitiparams.timestamp;

      const { result } = await getDocWhere( "User", "inviteCode", "==", invitiparams.code );

      if( result.length == 0 ){
        if( ( timeDifference/60 )/60 <= 24 ){
          return { 
            props: { 
              invite: {
                company: invitiparams.company,
                firstname: invitiparams.firstname,
                lastname: invitiparams.lastname,
                email: invitiparams.email,
                role: invitiparams.role,
                code: invitiparams.code
              } 
            } 
          }
        }else{
          return { props: { 
            inviteExpired: true
          } };
        }
      }else{
        return { props: { 
          codeAlreadyInUse: true
        } };
      }

    } catch( e ) {
      return { props: {  } };
    }
  }else if( query.recommend ){
    const readableCipher = Buffer.from( query.recommend as string, "base64" ).toString();
    const deciphered = CryptoJS.AES.decrypt( readableCipher, process.env.MAILENC ).toString( CryptoJS.enc.Utf8 );
    const json = Buffer.from( deciphered as string, "base64" ).toString();
    const recommendparams = JSON.parse( json );
    
    if( recommendparams.from ){

      return { props: { 
        invitedBy: {
          code: recommendparams.from
        }
      } };
    }else{
      return { props: { } };
    }

    
  }else{
    return { props: {  } };
  }
    
}

export default function Register( props ){
  const [ loginFailed, setLoginFailed ] = useState( false );
  {/*eslint-disable-next-line */}
  const [ usedInvite, setUsedInvite ] = useState( props.invite != undefined );
  const [ registerUserForm ] = Form.useForm();
  const [ registerForm ] = Form.useForm();
  const [ registeringCompany, setRegisteringCompany ] = useState( false );

  const onFinishRegisterCompany = async ( values ) => {
    const isPersonal = values.usecase != "Für mein Unternehmen";
    

    if( isPersonal ){
      const { error } = await signUp(
        values.firstname,
        values.lastname,
        values.email,
        values.username,
        values.password,
        "",
        "",
        "",
        "",
        "DE",
        isPersonal,
        props.invitedBy.code
      );
            
      if ( error ) {
        //console.log(error);
        setLoginFailed( true );
      }else{
        setLoginFailed( false );
        // else successful
        //console.log(result)
        return router.push( "/setup" )
      }
    }else{
      const { error } = await signUp( 
        values.firstname,
        values.lastname,
        values.email,
        values.username,
        values.password,
        values.company,
        values.street,
        values.city,
        values.postalcode,
        "DE",
        isPersonal,
        undefined
      );
            
      if ( error ) {
        //console.log(error);
        setLoginFailed( true );
      }else{
        setLoginFailed( false );
        // else successful
        //console.log(result)
        return router.push( "/setup" )
      }
    }

        
  };


  const onFinishRegisterUser = async ( values ) => {
    const { error } = await signUpUser( 
      values.firstname,
      values.lastname,
      values.email,
      values.username,
      values.password,
      props.invite.company,
      props.invite.role,
      props.invite.code
    );

    if ( error ) {
      //console.log(error);
      setLoginFailed( true );
    }else{
      setLoginFailed( false );
      // else successful
      //console.log(result)
      return router.push( "/setup" )
    }
  }

  useEffect( () => {
    if( props.invite ){
      registerUserForm.setFieldValue( "firstname", props.invite.firstname );
      registerUserForm.setFieldValue( "lastname", props.invite.lastname );
      registerUserForm.setFieldValue( "email", props.invite.email );
    }
  }, [props.invite, registerUserForm] );

  const onFinishFailed = () => {
    //console.log('Failed:', errorInfo);
    setLoginFailed( true );
  };

  const evalUseCase = () => {
    if( registeringCompany ){
      return <>
        <Form.Item
          label="Name des Unternehmens"
          name="company"
          rules={[
            {
              required: true,
              message: "Bitte geben Sie einen Namen für Ihr Unternehmen ein!"
            }
          ]}
          className={styles.loginpart}
        >
          <Input className={styles.logininput} />
        </Form.Item>

        <Space.Compact style={{ width: "100%" }} block>
          <Form.Item
            label="Straße"
            name="street"
            style={{ width: "50%" }}
            rules={[
              {
                required: true,
                message: "Bitte geben Sie einen Namen für Ihr Unternehmen ein!"
              }
            ]}
            className={styles.loginpart}
          >
            <Input className={styles.logininput_left} />
          </Form.Item>

          <Form.Item
            label="Ort"
            name="city"
            style={{ width: "30%" }}
            rules={[
              {
                required: true,
                message: "Bitte geben Sie einen Namen für Ihr Unternehmen ein!"
              }
            ]}
            className={styles.loginpart}
          >
            <Input className={styles.logininput_middle} />
          </Form.Item>

          <Form.Item
            label="PLZ"
            name="postalcode"
            style={{ width: "20%" }}
            rules={[
              {
                required: true,
                message: "Bitte geben Sie einen Namen für Ihr Unternehmen ein!"
              }
            ]}
            className={styles.loginpart}
          >
            <Input className={styles.logininput_right} />
          </Form.Item>
        </Space.Compact>
      </>
    }
  }


  const getForm = () => {
    if( props.inviteExpired ){
      return (
        <Alert message="Der Einladungslink ist leider abgelaufen. Bitte kontaktiere den Aussteller des Links für eine neue Einladung." type="error" />
      );
    }else if( props.codeAlreadyInUse ){
      const errmsg = "Dein Einladungslink wurde bereits verwendet und kann nicht nochmal benutzt werden."+
        " Bitte wende dich für eine neue Einladung an den Aussteller des Links.";
      return (
        <Alert message={errmsg} type="error" />
      );
    }else{
      if( usedInvite ){
        return ( <Form
          name="basic"
          className={styles.loginform}
          initialValues={{
            remember: true
          }}
          onFinish={onFinishRegisterUser}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          layout="vertical"
          onChange={() => {
            setLoginFailed( false ) 
          }}
          form={registerUserForm}
        >
          <Space.Compact block>
            <Form.Item
              label="Vorname"
              name="firstname"
              style={{ width: "50%" }}
              rules={[
                {
                  required: true,
                  message: "Bitte geben Sie einen Vornamen ein!"
                }
              ]}
              className={styles.loginpart}
            >
              <Input className={styles.logininput_left} disabled={true} />
            </Form.Item>
    
            <Form.Item
              label="Nachname"
              name="lastname"
              style={{ width: "50%" }}
              rules={[
                {
                  required: true,
                  message: "Bitte geben Sie einen Nachnamen ein!"
                }
              ]}
              className={styles.loginpart}
            >
              <Input className={styles.logininput_right} disabled={true} />
            </Form.Item>
          </Space.Compact>
    
          <Form.Item
            label="E-Mail"
            name="email"
            rules={[
              {
                required: true,
                message: "Bitte geben Sie ein E-Mail ein!"
              },
              () => ( {
                async validator( _, value ) {
                  if( value != "" ){
                    if ( await userExists( value ) ) {
                      return Promise.reject( new Error( "Die E-Mail wird bereits verwendet!" ) );
                                            
                    }
                  }
                  return Promise.resolve();
                }
              } )
            ]}
            className={styles.loginpart}
          >
            <Input className={styles.logininput} disabled={true} />
          </Form.Item>
    
          <Form.Item
            label="Username"
            name="username"
            rules={[
              {
                required: true,
                message: "Bitte geben Sie einen Usernamen ein!"
              },
              () => ( {
                async validator( _, value ) {
                  if( value != "" ){
                    if ( await usernameExists( value ) ) {
                      return Promise.reject( new Error( "Dieser Benutzername wird bereits verwendet!" ) );
                                            
                    }
                  }
                  return Promise.resolve();
                }
              } )
            ]}
            className={styles.loginpart}
          >
            <Input className={styles.logininput} />
          </Form.Item>
    
          <Form.Item
            label="Password"
            name="password"
            rules={[
              {
                required: true,
                message: "Bitte geben Sie ein Password ein!"
              },
              () => ( {
                validator( _, value: string ) {
                  if ( value.length >= 6 ) {
                    return Promise.resolve();
                  }
                  return Promise.reject( new Error( "Das Passwort muss länger als 6 Zeichen sein!" ) );
                }
              } )
            ]}
            className={styles.loginpart}
          >
            <Input.Password className={styles.logininput} />
          </Form.Item>
    
          <Form.Item
            label="Password wiederholen"
            name="passwordwdhl"
            rules={[
              {
                required: true,
                message: "Bitte wiederholen Sie das Passwort!"
              },
              ( { getFieldValue } ) => ( {
                validator( _, value ) {
                  if ( !value || getFieldValue( "password" ) === value ) {
                    return Promise.resolve();
                  }
                  return Promise.reject( new Error( "Die Passwörter stimmen nicht überein!" ) );
                }
              } )
                                
            ]}
            className={styles.loginpart}
          >
            <Input.Password className={styles.logininput} />
          </Form.Item>

          <Form.Item name={"agb"} valuePropName="checked" className={styles.loginpart} 
            rules={[
              {
                required: true,
                message: ""
              },
              {
                validator: ( _, value ) =>
                  value ? Promise.resolve() : Promise.reject( new Error( "Du musst den allgemeinen Geschäftsbedingungen zustimmen!" ) )
              }
            ]}>
            <Checkbox className={styles.agbCheckbox}>
                Ich habe die <Link className={styles.agbLink} href="/datenschutz">Datenschutzvereinbarung</Link> gelesen und verstanden.
                 Mit dem Ankreuzen dieser Box stimme ich diesen Bedingungen zu und erkläre mich damit einverstanden.
            </Checkbox>
          </Form.Item>
    
          <Alert style={{ marginBottom: 20, display: ( loginFailed )? "block": "none" }}
            message="Beim Registrieren ist etwas schief gelaufen bitte versuche es noch einmal!" type="error" />
    
          <Form.Item className={styles.loginbutton}>
            <Button type="primary" htmlType="submit">
                                Registrieren
            </Button>
          </Form.Item>
        </Form> );
      }else{
        return ( <Form
          name="basic"
          className={styles.loginform}
          onFinish={onFinishRegisterCompany}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          layout="vertical"
          onChange={() => {
            setLoginFailed( false ) 
          }}
          form={registerForm}
        >
          <Space.Compact style={{ width: "100%" }} block>
            <Form.Item
              label="Vorname"
              name="firstname"
              style={{ width: "50%" }}
              rules={[
                {
                  required: true,
                  message: "Bitte geben Sie einen Vornamen ein!"
                }
              ]}
              className={styles.loginpart}
            >
              <Input className={styles.logininput_left} />
            </Form.Item>
    
            <Form.Item
              label="Nachname"
              name="lastname"
              style={{ width: "50%" }}
              rules={[
                {
                  required: true,
                  message: "Bitte geben Sie einen Nachnamen ein!"
                }
              ]}
              className={styles.loginpart}
            >
              <Input className={styles.logininput_right} />
            </Form.Item>
          </Space.Compact>
    
          <Form.Item
            label="E-Mail"
            name="email"
            rules={[
              {
                required: true,
                message: "Bitte geben Sie ein E-Mail ein!"
              },
              () => ( {
                async validator( _, value ) {
                  if( value != "" ){
                    if ( await userExists( value ) ) {
                      return Promise.reject( new Error( "Die E-Mail wird bereits verwendet!" ) );
                                            
                    }
                  }
                  return Promise.resolve();
                }
              } )
            ]}
            className={styles.loginpart}
          >
            <Input className={styles.logininput} />
          </Form.Item>
    
          <Form.Item
            label="Username"
            name="username"
            rules={[
              {
                required: true,
                message: "Bitte geben Sie einen Usernamen ein!"
              },
              () => ( {
                async validator( _, value ) {
                  if( value != "" ){
                    if ( await usernameExists( value ) ) {
                      return Promise.reject( new Error( "Dieser Benutzername wird bereits verwendet!" ) );
                                            
                    }
                  }
                  return Promise.resolve();
                }
              } )
            ]}
            className={styles.loginpart}
          >
            <Input className={styles.logininput} />
          </Form.Item>
    
          <Space.Compact block>
            <Form.Item
              label="Password"
              name="password"
              rules={[
                {
                  required: true,
                  message: "Bitte geben Sie ein Password ein!"
                }
              ]}
              className={styles.loginpart}
            >
              <Input.Password className={styles.logininput_left} />
            </Form.Item>
    
            <Form.Item
              label="Password wiederholen"
              name="passwordwdhl"
              rules={[
                {
                  required: true,
                  message: "Bitte wiederholen Sie das Passwort!"
                },
                ( { getFieldValue } ) => ( {
                  validator( _, value ) {
                    if ( !value || getFieldValue( "password" ) === value ) {
                      return Promise.resolve();
                    }
                    return Promise.reject( new Error( "Die Passwörter stimmen nicht überein!" ) );
                  }
                } ),
                () => ( {
                  validator( _, value: string ) {
                    if ( value.length >= 6 ) {
                      return Promise.resolve();
                    }
                    return Promise.reject( new Error( "Das Passwort muss länger als 6 Zeichen sein!" ) );
                  }
                } )
              ]}
              className={styles.loginpart}
            >
              <Input.Password className={styles.logininput_right} />
            </Form.Item>
          </Space.Compact>
    
          <Form.Item label="Nutzung" name={"usecase"} className={styles.loginpart}>
            <Select onChange={( value ) => {
              ( value == "Für mein Unternehmen" )? setRegisteringCompany( true ): setRegisteringCompany( false ) 
            }} placeholder={"Wie planst du Siteware.Mail zu nutzen?"}
            options={[{ key: 0, value: "Nur für mich persönlich" }, { key: 1, value: "Für mein Unternehmen" }]}/>
          </Form.Item>
    
          {
            evalUseCase() 
          }

          <Form.Item name={"agb"} valuePropName="checked" className={styles.loginpart} 
            rules={[
              {
                required: true,
                message: ""
              },
              {
                validator: ( _, value ) =>
                  value ? Promise.resolve() : Promise.reject( new Error( "Du musst den allgemeinen Geschäftsbedingungen zustimmen!" ) )
              }
            ]}>
            <Checkbox className={styles.agbCheckbox}>
                Ich habe die <Link className={styles.agbLink} href="/datenschutz">Datenschutzvereinbarung</Link> gelesen und verstanden. 
                Mit dem Ankreuzen dieser Box stimme ich diesen Bedingungen zu und erkläre mich damit einverstanden.</Checkbox>
          </Form.Item>
    
          <Alert style={{ marginBottom: 20, display: ( loginFailed )? "block": "none" }} 
            message="Beim Registrieren ist etwas schief gelaufen bitte versuche es noch einmal!" type="error" />
    
          <Form.Item className={styles.loginbutton}>
            <Button type="primary" htmlType="submit">
                                Registrieren
            </Button>
          </Form.Item>
        </Form> );
      }
    }
  }

  return(
    <div>
      <div className={styles.logincontainer}>
        <div className={styles.logorow}>
          <div className={styles.logobox}>
            {/*eslint-disable-next-line */}
            <img src={"/logo.svg"} alt="Logo" width={100}/>
          </div>
        </div>

        <div className={styles.formContainer}>
          <div className={styles.formtitle}>Registrieren</div>
          <div className={styles.formexplanation}>
            Willkommen an Bord! Perfektioniere deine E-Mail-Kunst – starte mit dem Registrierungsformular direkt unter diesem Text.
          </div>
          {getForm()}
        </div>
      </div>
      <div className={`${styles.copyrightfooter} ${( registeringCompany )? styles.lowerfooter : ""}`}>© Siteware.Mail 2023</div>
    </div>
  );
}

Register.getLayout = ( page ) => {
  return(
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Siteware.Mail dein intelligenter Mail-Assistent" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/ogimage.jpg" />
        <meta property="og:url" content={`${process.env.BASEURL}`} />
        <link rel="icon" type="image/x-icon" href="small_logo.ico" />
        <title>Siteware.Mail | mail assistant</title>
      </Head>
      <main>
        {page}
        <CookieBanner />
      </main>
    </>
  );
}