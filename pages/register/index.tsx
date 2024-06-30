import router from "next/router";
import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import { Alert, Checkbox, Form, Input, MenuProps, Select, Space, Menu } from "antd";
import styles from "./register.module.scss"
import signUp, { signUpUser } from "../../firebase/auth/signup";
import Head from "next/head";
import userExists, { couponExists, usernameExists } from "../../firebase/auth/userExists";
import CookieBanner from "../../components/CookieBanner/CookieBanner";
import { getDocWhere } from "../../firebase/data/getData";
import Link from "next/link";
import CryptoJS from "crypto-js";
import Nav from "../../public/icons/nav.svg";
import Icon, { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import FatButton from "../../components/FatButton";

enum CouponState {
  "VALID",
  "INVALID",
  "NOCOUPON"
}

/**
 * Defne the navigation used in the frontend, to access the legal pages
 */
const frontendnav: MenuProps["items"] = [
  {
    label: <Link href={"privacy"}>Datenschutz</Link>,
    key: "privacy"
  },
  {
    label: <Link href={"legal"}>Impressum</Link>,
    key: "legal"
  },
  {
    label: <Link href={"login"}>Siteware</Link>,
    key: "login"
  }
]

/**
 * Get some serverside props, e.g invite parameters
 * @param ctx
 */
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

  // Get the invite query obj
  const invite = query.invite;
  if( invite ){
    try{
      // Get the invite parameter as base64 string
      const readableCipher = Buffer.from( invite as string, "base64" ).toString();
      // Decrypt the invite string with our password
      const deciphered = CryptoJS.AES.decrypt( readableCipher, process.env.MAILENC ).toString( CryptoJS.enc.Utf8 );
      // Cast it as JSON-string
      const json = Buffer.from( deciphered as string, "base64" ).toString();
      // Parse the JSON-String
      const invitiparams = JSON.parse( json );

      // Get the current time and calculate the difference between the creation of the invite and now
      const currTime = Math.floor( Date.now() / 1000 );
      const timeDifference =  currTime - invitiparams.timestamp;

      // Get the users with the given invite code
      const { result } = await getDocWhere( "User", "inviteCode", "==", invitiparams.code );

      // Check if the invite code belongs to some user
      if( result.length == 0 ){
        // Check that the invite is not older than 24 hours
        if( ( timeDifference / 60 ) / 60 <= 24 ){
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
    // Special path, if the recommend param was set.
    // Decode the given recommend base64 string and parse the included JSON
    const readableCipher = Buffer.from( query.recommend as string, "base64" ).toString();
    const deciphered = CryptoJS.AES.decrypt( readableCipher, process.env.MAILENC ).toString( CryptoJS.enc.Utf8 );
    const json = Buffer.from( deciphered as string, "base64" ).toString();
    const recommendparams = JSON.parse( json );

    // Set the recommend params
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

/**
 * Register page
 * @param props Page props
 * @constructor
 */
export default function Register( props ){
  const [ loginFailed, setLoginFailed ] = useState( false );
  {/*eslint-disable-next-line */}
  const [ usedInvite, setUsedInvite ] = useState( props.invite != undefined );
  const [ registerUserForm ] = Form.useForm();
  const [ registerForm ] = Form.useForm();
  const [ registeringCompany, setRegisteringCompany ] = useState( false );
  const [ couponValid, setCouponValid ] = useState(CouponState.NOCOUPON);

  /**
   * Effect to set some fields of the form depending on the invite used by the user
   */
  useEffect( () => {
    if( props.invite ){
      registerUserForm.setFieldValue( "firstname", props.invite.firstname );
      registerUserForm.setFieldValue( "lastname", props.invite.lastname );
      registerUserForm.setFieldValue( "email", props.invite.email );
    }
  }, [props.invite, registerUserForm] );


  /**
   * Returns an icon depending on the validity of the user input coupon
   */
  const getCouponIcon = () => {
    switch(couponValid){       
    case CouponState.INVALID:
      return <Icon component={CloseOutlined} style={{ "color": "red" }} />;
    case CouponState.VALID:
      return <Icon component={CheckOutlined} style={{ "color": "green" }} />;
    default:
      return <></>;
    }
  }


  /**
   * Function to be called if the user sends the form to register a company
   * @param values Form-Values
   */
  const onFinishRegisterCompany = async ( values ) => {
    // Test if the users tries to register a company or a singleuser
    const isPersonal = values.usecase != "Für mein Unternehmen";

    if( isPersonal ){
      // Case to be executed if the user tries to register a singleuser
      // Get the recommended by code from the page props
      const recommendCode = props.invitedBy?.code;

      // Call the Firebase signup function with the given form values
      const { error } = await signUp(
        values.firstname,
        values.lastname,
        (values.email as string).toLowerCase(),
        values.username,
        values.password,
        "",
        values.street,
        values.city,
        values.postalcode,
        "DE",
        true,
        recommendCode,
        values.coupon
      );

      // Check for errors during the firebase call
      if ( error ) {
        console.log(error);
        setLoginFailed( true );
      }else{
        setLoginFailed( false );
        // else successful
        console.log(error)
        return router.push( "/confirm" )
      }
    }else{
      // Case to be executed if the users registers a company
      const recommendCode = props.invitedBy?.code;

      // Call the firebase signup function
      const { error } = await signUp( 
        values.firstname,
        values.lastname,
        (values.email as string).toLowerCase(),
        values.username,
        values.password,
        values.company,
        values.street,
        values.city,
        values.postalcode,
        "DE",
        false,
        recommendCode,
        values.coupon
      );

      // Check for possible errors during firebase signup
      if ( error ) {
        console.log(error);
        setLoginFailed( true );
      }else{
        setLoginFailed( false );
        console.log("register successfull");
        // else successful

        return router.push( "/confirm" )
      }
    }
  };


  /**
   * Function to be called if the user tries to register a mailagent
   * @param values Form-values
   */
  const onFinishRegisterUser = async ( values ) => {
    // Call the firebase signup function to register a mailagent
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

    // Check for errors
    if ( error ) {
      //console.log(error);
      setLoginFailed( true );
    }else{
      setLoginFailed( false );
      // else successful
      //console.log(result)
      return router.push( "/confirm" )
    }
  }


  /**
   * Function to resolve the layout of the form depending on the selected usecase
   */
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

        <Form.Item
          label="Aktionscode"
          name="coupon"
          className={styles.loginpart}
          rules={[
            () => ( {
              async validator( _, value ) {
                if( value != "" && value != undefined ){
                  if ( await couponExists( value ) ) {
                    setCouponValid(CouponState.VALID);
                    return Promise.resolve();         
                  }else{
                    setCouponValid(CouponState.INVALID);
                    return Promise.reject( new Error( "Der Coupon existiert nicht!" ) );
                  }
                }else{
                  setCouponValid(CouponState.NOCOUPON);
                  return Promise.resolve();
                }
              }
            } )
          ]}
        >
          <Input className={styles.logininput} suffix={getCouponIcon()}/>
        </Form.Item>
      </>
    }else{
      return(
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
      );
    }
  }

  /**
   * Resolve the layout of the page depending on the state of the registration process
   */
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
                  message: "Bitte gebe einen Vornamen ein!"
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
                  message: "Bitte gebe einen Nachnamen ein!"
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
                message: "Bitte gebe eine E-Mail ein!"
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
                message: "Bitte gebe einen Usernamen ein!"
              },
              () => ( {
                async validator( _, value ) {
                  if( value != "" ){
                    if( /\s/g.test(value) ){
                      return Promise.reject( new Error( "Der Benutzername darf keine Leerzeichen enthalten!" ) );
                    }else{
                      if ( await usernameExists( value ) ) {
                        return Promise.reject( new Error( "Dieser Benutzername wird bereits verwendet!" ) );               
                      }
                      return Promise.resolve();
                    }
                  }else{
                    return Promise.reject( new Error( "Der Benutzername darf nicht leer sein!" ) );
                  }
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
            label="Password wdhl."
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
                Ich habe die <Link className={styles.agbLink} target="_blank" href="/privacy">Datenschutzvereinbarung</Link> gelesen und verstanden.
                 Mit dem Ankreuzen dieser Box stimme ich diesen Bedingungen zu und erkläre mich damit einverstanden.
            </Checkbox>
          </Form.Item>
    
          <Alert style={{ marginBottom: 20, display: ( loginFailed )? "block": "none" }}
            message="Beim Registrieren ist etwas schief gelaufen bitte versuche es noch einmal!" type="error" />
    
          <Form.Item className={styles.loginbutton}>
            <FatButton isSubmitButton={true} text="Registrieren" />
          </Form.Item>
        </Form> );
      }else{
        return ( <Form
          name="basic"
          className={styles.loginform}
          onFinish={onFinishRegisterCompany}
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
                  message: "Bitte gebe einen Vornamen ein!"
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
                  message: "Bitte gebe einen Nachnamen ein!"
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
                message: "Bitte gebe eine E-Mail ein!"
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
                message: "Bitte gebe einen Usernamen ein!"
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
                  message: "Bitte gebe ein Password ein!"
                }
              ]}
              className={styles.loginpart}
            >
              <Input.Password className={styles.logininput_left} />
            </Form.Item>
    
            <Form.Item
              label="Password wdhl."
              name="passwordwdhl"
              rules={[
                {
                  required: true,
                  message: "Bitte wiederhole das Passwort!"
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
    
          <Form.Item label="Nutzung" name={"usecase"} className={styles.loginpart} rules={[
            {
              required: true,
              message: "Bitte wähle einen Verwendungszweck!"
            }]}>
            <Select onChange={( value ) => {
              ( value == "Für mein Unternehmen" )? setRegisteringCompany( true ): setRegisteringCompany( false ) 
            }} placeholder={"Wie planst du Siteware zu nutzen?"}
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
                Ich habe die <Link className={styles.agbLink} target="_blank" href="/privacy">Datenschutzvereinbarung</Link> gelesen und verstanden. 
                Mit dem Ankreuzen dieser Box stimme ich diesen Bedingungen zu und erkläre mich damit einverstanden.</Checkbox>
          </Form.Item>
    
          <Alert style={{ marginBottom: 20, display: ( loginFailed )? "block": "none" }} 
            message="Beim Registrieren ist etwas schief gelaufen bitte versuche es noch einmal!" type="error" />
    
          <Form.Item className={styles.loginbutton}>
            <FatButton isSubmitButton={true} text="Registrieren" />
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
            <Link href={"/login"}>
              {/*eslint-disable-next-line */}
              <img src={"/siteware-logo-black.svg"} alt="Logo" width={100}/>
            </Link>
          </div>
          <div className={styles.nav}>
            <Menu className={styles.navmenu} overflowedIndicator={
              <Icon
                component={Nav}
                className={styles.headericon}
                viewBox='0 0 40 40'
              />} selectedKeys={["login"]} mode="horizontal" items={frontendnav} />
          </div>
        </div>

        <div className={styles.formContainer}>
          <div className={styles.formtitle}>Registrieren</div>
          <div className={styles.formexplanation}>
            Spare Zeit und steigere deine Produktivität mit Siteware –
            melde dich jetzt an und entdecke die Kraft unserer KI-Agenten!
          </div>
          {getForm()}
          <div className={styles.backtologin}>
            Du hast schon einen Account? Zum <Link className={styles.loginlink} href={"/login"}>Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Exclusive layout the registration page
Register.getLayout = ( page ) => {
  return(
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Siteware dein intelligenter KI-Agent" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/ogimage.jpg" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_BASEURL}`} />
        <link rel="icon" type="image/x-icon" href="small_logo.ico" />
        <title>Siteware | ai assistant</title>
      </Head>
      <main>
        {page}
        <CookieBanner />
      </main>
    </>
  );
}