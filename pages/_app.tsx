import './globals.css'
import Head from 'next/head';
import { Roboto } from 'next/font/google';
import { AppContext, AppInitialProps, AppLayoutProps, AppProps } from 'next/app';
import favicon from '../public/favicon.ico';
import { AuthContextProvider } from '../components/context/AuthContext';
import { ReactNode } from 'react';
import type { NextComponentType } from 'next';

const roboto = Roboto({
  weight: ['100', '300', '400', '500', '700', '900'],
  subsets: ['latin'],
})

const MyApp: NextComponentType<AppContext, AppInitialProps, AppLayoutProps> = ({
  Component,
  pageProps,
}: AppLayoutProps) => {
  console.log(Component.getLayout);

  const getLayout = Component.getLayout || ((page) => page);

  if(Component.getLayout){
    return Component.getLayout(
      <>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta property="og:title" content="Siteware Mailbuddy dein intelligenter Mail-Assistent" />
          <meta property="og:type" content="website" />
          <meta property="og:image" content="/cartoon.jpeg" />
          <link rel="icon" type="image/x-icon" href="mailbuddy.ico" />
          <title>Siteware-Mailbuddy | mail assistant</title>
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
          <meta property="og:title" content="Siteware Mailbuddy dein intelligenter Mail-Assistent" />
          <meta property="og:type" content="website" />
          <meta property="og:image" content="/cartoon.jpeg" />
          <link rel="icon" type="image/x-icon" href="small_logo.ico" />
          <title>Siteware-Mailbuddy | mail assistant</title>
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
