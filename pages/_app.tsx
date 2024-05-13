import "./globals.css"
import Head from "next/head";
import { Roboto } from "next/font/google";
import { AppContext, AppInitialProps, AppLayoutProps } from "next/app";
import { AuthContextProvider } from "../components/context/AuthContext";
import { useEffect, useState } from "react";
import type { NextComponentType } from "next";
import Chatra from "@chatra/chatra";
import { useRouter } from "next/router";
import { logEvent, setAnalyticsCollectionEnabled } from "firebase/analytics";
import { analytics, firebase_app } from "../db";
import cookieCutter from "cookie-cutter"
import { getAuth } from "firebase/auth";


const roboto = Roboto( {
  weight: ["100", "300", "400", "500", "700", "900"],
  subsets: ["latin"]
} )

const MyApp: NextComponentType<AppContext, AppInitialProps, AppLayoutProps> = ( {
  Component,
  pageProps
}: AppLayoutProps ) => {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [count, setCount] = useState(0);


  useEffect( () => {

    const config = {
      ID: "hmW4w975YAotbeZhQ",
      setup: {
        colors: {
          buttonText: "#000",
          buttonBg: "#fff"
        },
        customWidgetButton: ".sosbutton"
      }
    }

    Chatra( "init", config );
    Chatra( "pageView" );

    if( cookieCutter.get( "mailbuddy-opt-analytics-consent" ) == 1){
      console.log("enabled");
      setAnalyticsCollectionEnabled(analytics, true);
    }else{
      console.log("disabling");
      setAnalyticsCollectionEnabled(analytics, false);
    }
  }, [] );

  useEffect(() => {
    setCount((x) => x + 1);
    console.log("route change with dependency", router.pathname);

    logEvent(analytics, "page_view", {
      page_location: router.pathname
    });
  }, [router]);

  /*useEffect(() => {
    const checkRoute = async () => {
      const routeRGX = "/((?!login|register|legal|privacy|logout|api|_next/static|_next/image|favicon.ico|logo.svg|small_logo.svg|small_logo.ico|monitoring).*)";

      if(router.pathname.match(routeRGX)){
        // If we encounter a route that does not match the regex, i.e /, /confirm, /account etc.
        const curruser = auth.currentUser;
        console.log(curruser);

        if(curruser){
          // in this case the user is logged in

          console.log(curruser);

          try {
            const userreq = await getDocument("User", curruser.uid);
            const userobj = userreq.result.data() as User;

            if(!curruser.emailVerified){
              await router.replace("/confirm");
            }else{
              if(!userobj.setupDone){
                await router.replace("/setup");
              }
            }
          }catch (e){
            console.log(e);
            await router.replace("/login");
          }

        }else{
          await router.replace("/login");
        }
      }else{
        console.log("NO MATCH", router.pathname);
      }
    }

    checkRoute();
  }, [router.pathname]);*/


  if( Component.getLayout ){
    return Component.getLayout(
      <>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta property="og:title" content="Siteware business dein intelligenter KI-Assistent" />
          <meta property="og:type" content="website" />
          <meta property="og:image" content="/ogimage.jpg" />
          <meta name="viewport" content="initial-scale=1, maximum-scale=1" />
          <meta property="og:url" content={`${process.env.NEXT_PUBLIC_BASEURL}`} />
          <link rel="icon" type="image/x-icon" href="/small_logo.ico" />
          <title>Siteware business | ai assistant</title>
        </Head>
        <div className={roboto.className}>
          <Component {...pageProps}/>
        </div>
      </>
    );
  }else{
    return(
      <>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta property="og:title" content="Siteware business dein intelligenter KI-Assistent" />
          <meta property="og:type" content="website" />
          <meta property="og:image" content="/ogimage.jpg" />
          <meta property="og:url" content={`${process.env.NEXT_PUBLIC_BASEURL}`} />
          <link rel="icon" type="image/x-icon" href="/small_logo.ico" />
          <title>Siteware business | ai assistant</title>
        </Head>
        <AuthContextProvider>
          <div className={roboto.className}>
            <Component {...pageProps}/>
          </div>
        </AuthContextProvider>
      </>
    );
  }
}


// Der Authcontextprovider muss rein

export default MyApp
