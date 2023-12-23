import { TourProps, Tour, Typography, Button, Divider, Space, Modal, QRCode, Spin, message } from "antd";
import styles from "./index.module.scss"
import { useEffect, useRef, useState } from "react";
import { GetServerSideProps } from "next";
import SidebarLayout from "../components/Sidebar/SidebarLayout";
import { useAuthContext } from "../components/context/AuthContext";
import { useRouter } from "next/navigation";
import updateData from "../firebase/data/updateData";
import { handleUndefinedTour } from "../helper/architecture";
import { HeartFilled, LoadingOutlined } from "@ant-design/icons";
import AssistantCard from "../components/AssistantCard";
import axios from "axios";
const Paragraph = Typography;


export interface InitialProps {
}

export const getServerSideProps: GetServerSideProps = async () => {
  const datum = new Date();

  return {
    props: {
      Data: {
        currentMonth: datum.getMonth() + 1,
        currentYear: datum.getFullYear()
      }
    }
  };
};


export default function Home() {
  const context = useAuthContext();
  const { login, user } = context;
  const router = useRouter();
  const dialogRef = useRef( null );
  const monologRef = useRef( null );
  const blogRef = useRef(null);
  const [open, setOpen] = useState<boolean>( !handleUndefinedTour( user.tour ).home );
  const [recommendModalOpen, setRecommendModalOpen] = useState(false);
  const [ recommendLink, setRecommendLink ] = useState( "" );
  const [messageApi, contextHolder] = message.useMessage();


  useEffect( () => {
    if( !user.setupDone ){
      router.push( "/setup" );
    }
  }, [router, user.setupDone] );

  

  useEffect( () => {
    /**
     * Gets the recommend link from the api asynchronously
     * and sets the corresponding state 
     */
    async function getRecommendLink() {
      const encryptedLink = await axios.post( "/api/recommend", { from: user.Company } );
      if( encryptedLink.data.message != "" ){
        setRecommendLink( encryptedLink.data.message );
      }
    }
    
    getRecommendLink();
    // eslint-disable-next-line
  }, [] );


  const steps: TourProps["steps"] = [
    {
      title: "Willkommen",
      description: "Willkommen bei Siteware.Mail, dem Ort, an dem wir das E-Mail-Schreiben revolutionieren! Unser Ziel ist es, "+
      "deine E-Mail-Kommunikation effizienter und angenehmer zu gestalten. Wir bieten dir innovative Funktionen, die deine E-Mail-Erfahrung "+
      "vereinfachen und verbessern. Im folgenden wollen wir dir in diesen Tutorials die wichtigsten Funktionen näher erklären.",
      nextButtonProps: {
        children: (
          "Weiter"
        )
      },
      prevButtonProps: {
        children: (
          "Zurück"
        )
      }
    },
    {
      title: "Du bist kein Fan von Tutorials?",
      description: "Dann kannst du dieses PopUp einfach wegklicken und wir nerven dich nicht weiter. Wenn du das Tutorial nochmal durchlaufen möchtest "+
      "kannst du es in deinen Account-Einstellungen zurücksetzen!",
      nextButtonProps: {
        children: (
          "Weiter"
        )
      },
      prevButtonProps: {
        children: (
          "Zurück"
        )
      }
    },
    {
      title: "Mail-Dialog fortsetzen",
      description: "Die Funktion \"Mail-Dialog fortsetzen\" ermöglicht es dir, einen bestehenden E-Mail-Verlauf nahtlos fortzuführen. "+
      "Hierbei kannst du einfach den bisherigen E-Mail-Verlauf in das System einfügen und spezifizieren, wie deine gewünschte Antwort aussehen "+
      "soll. Basierend auf deinen Vorgaben und dem Kontext des E-Mail-Verlaufs generiert Siteware.Mail automatisch eine passende Antwort.",
      target: () => dialogRef.current,
      nextButtonProps: {
        children: (
          "Weiter"
        )
      },
      prevButtonProps: {
        children: (
          "Zurück"
        )
      }
    },
    {
      title: "E-Mail schreiben",
      description: "Die Funktion \"E-Mail schreiben\" ist ein leistungsstarkes Tool, das dir dabei hilft, schnell und effektiv E-Mails zu verfassen. "+
      "Als Nutzer spezifizierst du einfach den gewünschten Inhalt oder den Hauptzweck deiner E-Mail, zum Beispiel eine Terminanfrage, ein Update für "+
      "ein Projekt oder eine Rückmeldung zu einer Anfrage. Basierend auf deinen Angaben generiert Siteware.Mail dann einen professionellen und "+
      "kohärenten E-Mail-Text, der genau auf deine Bedürfnisse zugeschnitten ist.",
      target: () => monologRef.current,
      nextButtonProps: {
        children: (
          "Weiter"
        )
      },
      prevButtonProps: {
        children: (
          "Zurück"
        )
      }
    },
    {
      title: "Blogbeitrag erzeugen",
      description: "Die Funktion \"Blogbeitrag erzeugen\" dient dazu, voll automatisch fesselnde Blogbeiträge zu verfassen. "+
      "Nachdem du das Thema des Blogtexts sowie individuelle Parameter festgelegt hast, generiert Siteware.Mail automatisch einen professionellen und "+
      "ansprechenden Blogtext, ganz nach Deinen Vorstellungen.",
      target: () => monologRef.current,
      nextButtonProps: {
        children: (
          "Alles klar"
        ),
        onClick: async () => {
          const currstate = user.tour;
          currstate.home = true;
          updateData( "User", login.uid, { tour: currstate } )
        }
      },
      prevButtonProps: {
        children: (
          "Zurück"
        )
      }
    }
  ];
  
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

  const RecommendNotice = () => {
    return (
      <div className={styles.recommendourapp}>
        <div className={styles.recommendlove}>
          <HeartFilled />
        </div>
        <div className={styles.recommendexplanation}>
          <h3>Du liebst Siteware.Business?</h3>
          <Paragraph>
                Empfehle uns weiter und sichere Dir 200 GRATIS E-Mails!
          </Paragraph>
          <div className={styles.openrecdrawerrow}>
            <Button type="primary" onClick={() => {
              setRecommendModalOpen(true);
            }}>Jetzt empfehlen</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarLayout context={context}>
      {contextHolder}
      <div className={styles.main}>
        <div className={styles.greetingrow}>
          <div className={styles.greeting}>Willkommen {user.firstname}</div>
        </div>

        <div className={styles.dividerrow}>
          <Divider />
        </div>

        <div className={styles.content}>
          <div className={styles.services}>
            <Space size={"large"} wrap>
              <AssistantCard
                image="/small_logo.png"
                title="E-Mail Dialog"
                description="Mit einem Klick generiert unsere KI smarte Antworten zu Deinen bisher empfangenen E-Mail Verlauf."
                link="/dialog"
              />
              <AssistantCard
                image="/small_logo.png"
                title="E-Mail erzeugen"
                description="Gib den Inhalt an, und die KI zaubert Dir eine E-Mail in Deinem Stil – schnell, smart, persönlich!"
                link="/monolog"
              />
              <AssistantCard
                image="/small_logo.png"
                title="Blogbeitrag erzeugen"
                description="Erstelle ansprechende Artikel für Deine Website - mit von Dir bestimmtem Inhalt und Schreibstil."
                link="/blog"
              />
               <AssistantCard
                image="/small_logo.png"
                title="Webinhalte generieren"
                description='Erstelle maßgeschneiderte Inhalte für Deine Internetpräsenz - "Über Uns"-, Leistungsübersichts- und Leistungstexte.'
                link="/webcontent"
              />
            </Space>
          </div>

          <RecommendNotice />
        </div>

        <Modal title="Lade deine Freunde ein und sichere dir Gratis-Mails!" open={recommendModalOpen} width={800} footer={null} onCancel={() => {
          setRecommendModalOpen(false);
        }}>
          <div className={styles.recommendContent}>
            <div className={styles.recommendtext}>
              <h3 className={styles.recommendHeadline}></h3>
              <Paragraph>
                Du hast jetzt die Gelegenheit, deine Freunde zu Siteware.Business einzuladen.
                Für jeden Freund, der sich erfolgreich registriert, schenken wir dir 200 Gratis-Mails als Dankeschön.
                Teile einfach diesen Link, um deine Freunde einzuladen:
              </Paragraph>
              <div className={styles.recommendLink}>
                {( recommendLink == "" )? <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />: <div onClick={() => {
                  copyLink()
                }}>{recommendLink}</div>}
              </div>
              <p>Alternativ kannst du auch den QR-Code rechts benutzen und deinen Freunden schicken</p>
            </div>
            <div className={styles.recommendqrcode} id="recommendqrcode">
              <QRCode errorLevel="M" status={( recommendLink == "" )? "loading": undefined} value={recommendLink} bgColor="#fff" />
              <div className={styles.downloadQRCode}>
                {/* <FatButton onClick={downloadQRCode} text="Download"/> */}
                <Button type="link" className={styles.downloadbutton} onClick={downloadQRCode}>Download</Button>
              </div>
            </div>
          </div>
        </Modal>

        <Tour open={open} onClose={async () => {
          const currstate = user.tour;
          currstate.home = true;
          updateData( "User", login.uid, { tour: currstate } );
          setOpen( false );
        }} steps={steps} />
      </div>
    </SidebarLayout>
  )
}