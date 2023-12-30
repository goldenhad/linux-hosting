import { GetServerSideProps } from "next";
import { Typography, Menu, MenuProps, FloatButton } from "antd";
import Icon from "@ant-design/icons";
import styles from "./legal.module.scss"
import Head from "next/head";
import CookieBanner from "../../components/CookieBanner/CookieBanner";
import Help from "../../public/icons/help.svg";
import Link from "next/link";
import Nav from "../../public/icons/nav.svg";



const { Paragraph } = Typography;

export const getServerSideProps: GetServerSideProps = async ( ctx ) => {
  //Get the context of the request
  const { req, res } = ctx
  //Get the cookies from the current request
  const { cookies } = req
    
  //Check if the login cookie is set
  if( cookies.login ){
    //Redirect if the cookie is not set
    res.writeHead( 302, { Location: "/" } );
    res.end();
  }

  return { props: { InitialState: {} } }
}

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
    label: <Link href={"login"}>Siteware Business</Link>,
    key: "login"
  }
]

export default function Legal(){

  return(
    <div className={styles.content}>
      <div className={styles.container}>
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
              />} selectedKeys={["legal"]} mode="horizontal" items={frontendnav} />
          </div>
        </div>

        <div className={styles.textcontainer}>
          {/* eslint-disable */}
          <Paragraph className={styles.text}>
            <h1>Impressum</h1>

            <h2>Angaben gem&auml;&szlig; &sect; 5 TMG</h2>
            <p>SugarPool GmbH<br />
            Am Weilsberg 11<br />
            51789 Lindlar</p>

            <p>Handelsregister: 72710<br />
            Registergericht: K&ouml;ln</p>

            <p><strong>Vertreten durch:</strong><br />
            Andreas Jansen</p>

            <h2>Kontakt</h2>
            <p>Telefon: +49 (0) 2266 904177-0<br />
            Telefax: +49 (0) 2266 904177-9<br />
            E-Mail: info@sugarpool.de</p>

            <h2>Umsatzsteuer-ID</h2>
            <p>Umsatzsteuer-Identifikationsnummer gem&auml;&szlig; &sect; 27 a Umsatzsteuergesetz:<br />
            DE-271536541</p>

            <h2>EU-Streitschlichtung</h2>
            <p>Die Europ&auml;ische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr/</a>.<br /> Unsere E-Mail-Adresse finden Sie oben im Impressum.</p>

            <h2>Verbraucher&shy;streit&shy;beilegung/Universal&shy;schlichtungs&shy;stelle</h2>
            <p>Wir nehmen an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teil. Zust&auml;ndig ist die Universalschlichtungsstelle des Zentrums f&uuml;r Schlichtung e.V., Stra&szlig;burger Stra&szlig;e 8, 77694 Kehl am Rhein (<a href="https://www.verbraucher-schlichter.de" rel="noopener noreferrer" target="_blank">https://www.verbraucher-schlichter.de</a>).</p>
            <div className={styles.spacer}></div>
            <h1>Site Notice</h1>

            <h2>Information pursuant to Sect. 5 German Telemedia Act (TMG)</h2>
            <p>SugarPool GmbH<br />
            Am Weilsberg 11<br />
            51789 Lindlar</p>

            <p>Commercial Register: 72710<br />
            Registration court: K&ouml;ln</p>

            <p><strong>Represented by:</strong><br />
            Andreas Jansen</p>

            <h2>Contact</h2>
            <p>Phone: +49 (0) 2266 904177-0<br />
            Telefax: +49 (0) 2266 904177-9<br />
            E-mail: info@sugarpool.de</p>

            <h2>VAT ID</h2>
            <p>Sales tax identification number according to Sect. 27 a of the Sales Tax Law:<br />
            DE-271536541</p>

            <h2>EU dispute resolution</h2>
            <p>The European Commission provides a platform for online dispute resolution (ODR): <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr/</a>.<br /> Our e-mail address can be found above in the site notice.</p>

            <h2>Dispute resolution proceedings in front of a consumer arbitration board</h2>
            <p>We participate in a dispute settlement procedure before a consumer arbitration board. The competent consumer arbitration board is Zentrum f&uuml;r Schlichtung e.V., Stra&szlig;burger Stra&szlig;e 8, 77694 Kehl am Rhein (<a href="https://www.verbraucher-schlichter.de" rel="noopener noreferrer" target="_blank">https://www.verbraucher-schlichter.de</a>).</p>
        </Paragraph>
          {/* eslint-enable */}
        </div>
      </div>
      <FloatButton
        className='sosbutton'
        icon={<Icon component={Help} className={styles.floaticon} viewBox='0 0 22 22' size={24} />}
        shape='square'
        description={"Hilfe"}
      />
    </div>
  );
}

Legal.getLayout = ( page ) => {
  return(
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Siteware.Business dein intelligenter Mail-Assistent" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/ogimage.jpg" />
        <meta property="og:url" content={`${process.env.BASEURL}`} />
        <link rel="icon" type="image/x-icon" href="small_logo.ico" />
        <title>Siteware.Business | ai assistant</title>
      </Head>
      <main>
        {page}
        <CookieBanner />
      </main>
    </>
  );
}