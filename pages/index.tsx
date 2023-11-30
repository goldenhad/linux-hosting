import { TourProps, Tour, Button } from "antd";
import styles from "./index.module.scss"
import { useEffect, useRef, useState } from "react";
import { GetServerSideProps } from "next";
import SidebarLayout from "../components/Sidebar/SidebarLayout";
import { useAuthContext } from "../components/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import updateData from "../firebase/data/updateData";
import { handleEmptyUser, handleUndefinedTour } from "../helper/architecture";
import getDocument from "../firebase/data/getData";


export interface InitialProps {
  Data: {
    currentMonth: number,
    currentYear: number,
  };
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
  const { login, user, role } = useAuthContext();
  const router = useRouter();
  const dialogRef = useRef( null );
  const monologRef = useRef( null );
  const [open, setOpen] = useState<boolean>( !handleUndefinedTour( user.tour ).home );

  useEffect( () => {
    if( !user.setupDone ){
      router.push( "/setup" );
    }
  }, [router, user.setupDone] );


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

  return (
    <SidebarLayout role={role} user={user} login={login}>
      <div className={styles.main}>
        <div className={styles.greetingrow}>
          <div className={styles.greeting}>Willkommen {user.firstname}</div>
          <div className={styles.greeting_subtitle}>Wie kann ich dir heute helfen?</div>
        </div>

        <div className={styles.optioncontainer}>
          <div className={styles.optionrow}>
            <Link href={"/dialog"}>
              <div ref={dialogRef} className={styles.option}>
                <div className={styles.option_title}>Mail-Dialog fortsetzen</div>
              </div>
            </Link>

            <Link href={"/monolog"}>
              <div ref={monologRef} className={styles.option}>
                <div className={styles.option_title}>E-Mail schreiben</div>
              </div>
            </Link>
          </div>
        </div>
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
