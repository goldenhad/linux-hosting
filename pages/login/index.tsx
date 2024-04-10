import router from "next/router";
import { useState } from "react";
import { Alert, Checkbox, Form, Input, Menu, MenuProps } from "antd";
import styles from "./login.module.scss"
import signIn from "../../firebase/auth/signin";
import Head from "next/head";
import Link from "next/link";
import CookieBanner from "../../components/CookieBanner/CookieBanner";
import FatButton from "../../components/FatButton";
import Nav from "../../public/icons/nav.svg";
import Icon from "@ant-design/icons";
import { logEvent } from "firebase/analytics";
import { analytics } from "../../db";
import getDocument from "../../firebase/data/getData";
import { User } from "../../firebase/types/User";


/**
 * Define the login page navigation
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
    label: <Link href={"login"}>Siteware business</Link>,
    key: "login"
  }
]

/**
 * Page users can use to log in into the application
 * @constructor
 */
export default function Login(){
  // State to indicate login failures
  const [ loginFailed, setLoginFailed ] = useState( false );

  /**
   * Function to call on form finish -> form send
   * @param values Input values
   */
  const onFinish = async ( values ) => {
    // Call the firebase sign in routine
    const { result, error } = await signIn( values.email, values.password );

    // Check if we ecounter a sign in error
    if ( error ) {
      //console.log(error);
      setLoginFailed( true );
    }else{
      setLoginFailed( false );
      //console.log(result)
      logEvent(analytics, "login", {
        email: values.email
      });

      // If the login was successfull query the database for the resulting user id
      const usereq = await getDocument("User", result.user?.uid);

      // Check if the query request was successfull
      if(usereq.result){
        // Cast the query result as User object
        const userobj = usereq.result.data() as User;

        if(userobj){
          /*// Choose where to redirect the user to after the login
          if(userobj.setupDone){

          }else{
            return router.push( "/setup" )
          }*/

          return router.push( "/" )
        }else{
          return router.push( "/login" )
        }
      }else{
        // If we encounter an error set the failed flga
        setLoginFailed( true );
      }
    }
  };

  /**
   * Function to resolve form send errors
   */
  const onFinishFailed = () => {
    //console.log('Failed:', errorInfo);
    setLoginFailed( true );
  };

  return(
    <div className={styles.logincontent}>
      <div className={styles.logincontainer}>
        <div className={styles.logorow}>
          <div className={styles.logobox}>
            <Link href={"/login"}>
              {/*eslint-disable-next-line */}
              <img src={"/logo.svg"} alt="Logo" width={100}/>
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
          <div className={styles.formtitle}>Log in</div>
          <div className={styles.formexplanation}>Willkommen zurück. Bitte gebe unten deine Logindaten ein.</div>
          <Form
            name="basic"
            className={styles.loginform}
            initialValues={{
              remember: true
            }}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
            layout="vertical"
            onChange={() => {
              setLoginFailed( false ) 
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

            <div className={styles.rememberrow}>
              <Checkbox name="remember">Eingeloggt bleiben</Checkbox>
              <Link href={"/forgot/password"}>Passwort vergessen</Link>
            </div>

            <Alert
              style={{ marginBottom: 20, marginTop: 20, display: ( loginFailed )? "block": "none" }}
              message="Beim Anmelden ist etwas schief gelaufen bitte versuche es noch einmal!" 
              type="error"
            />

            <Form.Item className={styles.loginbutton}>
              <FatButton isSubmitButton={true} text="Anmelden" />
            </Form.Item>
          </Form>

          
                    
          <div className={styles.signupnotice}>
            <div>Noch keinen Account?</div><Link className={styles.signuplink} href={"/register"}>Jetzt kostenlos registrieren</Link>
          </div>
        </div>
      </div>
      <div className={styles.copyrightfooter}>© Siteware business 2024</div>
    </div>
  );
}

/**
 * Login page layout seperate from the normal login flow
 * @param page
 */
Login.getLayout = ( page ) => {
  return(
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Siteware business dein intelligenter KI-Assistent" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/ogimage.jpg" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_BASEURL}`} />
        <link rel="icon" type="image/x-icon" href="small_logo.ico" />
        <title>Siteware business | ai assistant</title>
      </Head>
      <main>
        {page}
        <CookieBanner />
      </main>
    </>
  );
}