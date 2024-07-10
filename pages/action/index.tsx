import { GetServerSideProps } from "next";
import Head from "next/head";
import { ResetPassword } from "../../lib/components/Actions/ResetPassword/ResetPassword";
import { VerifyMail } from "../../lib/components/Actions/VeryfyMail/VerifyMail";

// Props given by firebase to this page trough redirection
export interface restprops {
    mode: string,
    oobCode: string,
    apiKey: string,
}

/**
 * Parse the request to the page from firebase
 * @param ctx
 */
export const getServerSideProps: GetServerSideProps = async ( ctx ) => {
  const mode = ctx.query.mode;
  const code = ctx.query.oobCode;
  const apikey = ctx.query.apiKey;

  if( mode && code && apikey ){
    return { props: { mode: mode, oobCode: code, apiKey: apikey  } } 
  }else{
    return { props: {  } }
  }
}

/**
 * Reset page. Lets users action their password.
 * @param props Props of the firebase request to this page
 * @constructor
 */
export default function Action( props: restprops ){
  const ActionComponent = () => {
    if(props.mode == "resetPassword"){
      return <ResetPassword oobCode={props.oobCode} />
    }else if(props.mode == "verifyEmail"){
      return <VerifyMail oobCode={props.oobCode} />
    }
  }

  return(
    <div>
      <ActionComponent />
    </div>
  );
}

/**
 * Exclusive Layout of the action page
 * @param page
 */
Action.getLayout = ( page ) => {
  return(
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <link rel="icon" type="image/x-icon" href="small_logo.ico"/>
        <title>Siteware | ai assistant</title>
      </Head>
      <main>
        {page}
      </main>

    </>
  );
}
