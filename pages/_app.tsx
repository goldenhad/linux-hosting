import './globals.css'
import Head from 'next/head';
import { Roboto } from 'next/font/google';
import { AppProps } from 'next/app';
import favicon from '../public/favicon.ico';

const roboto = Roboto({
  weight: ['100', '300', '400', '500', '700', '900'],
  subsets: ['latin'],
})

function MyApp({ Component, pageProps }: AppProps) {
  return (<>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/x-icon" href="mailbuddy.ico" />
        <title>Siteware-Mailbuddy | mail assistant</title>
      </Head>
      <main className={roboto.className}>
        <Component {...pageProps} />
      </main>
    </>);
}

export default MyApp
