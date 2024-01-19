import { TourProps, Tour, Divider, message, Modal } from "antd";
import styles from "./index.module.scss"
import { useEffect, useRef, useState } from "react";
import { GetServerSideProps } from "next";
import { useAuthContext } from "../components/context/AuthContext";
import { useRouter } from "next/navigation";
import updateData from "../firebase/data/updateData";
import { handleUndefinedTour } from "../helper/architecture";
import AssistantCard from "../components/AssistantCard/AssistantCard";
import RecommendBox from "../components/RecommendBox/RecommendBox";
import HomeSidebarLayout from "../components/HomeSidebar/HomeSidebarLayout";
import { Service } from "../firebase/types/Service";
import ReactPlayer from "react-player/lazy"



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
  const { login, user, services } = context;
  const router = useRouter();
  const dialogRef = useRef( null );
  const monologRef = useRef( null );
  const [open, setOpen] = useState<boolean>( !handleUndefinedTour( user.tour ).home );
  const [messageApi, contextHolder] = message.useMessage();
  const [ selectedCat, setSelectedCat ] = useState("all");
  const [ videoPopupVisible, setVideoPopupVisible ] = useState(false);
  const [ videoLink, setVideoLink ] = useState("");
  const [play, setPlay] = useState(false);

  const videoplayer = useRef(null);



  useEffect( () => {
    if( !user.setupDone && user.setupDone != undefined ){
      router.push( "/setup" );
    }
  }, [router, user.setupDone] );


  const steps: TourProps["steps"] = [
    {
      title: "Willkommen",
      description: "Willkommen bei Siteware.Business, dem Ort, an dem wir das E-Mail-Schreiben revolutionieren! Unser Ziel ist es, "+
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
      "soll. Basierend auf deinen Vorgaben und dem Kontext des E-Mail-Verlaufs generiert Siteware.Business automatisch eine passende Antwort.",
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
      "ein Projekt oder eine Rückmeldung zu einer Anfrage. Basierend auf deinen Angaben generiert Siteware business dann einen professionellen und "+
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
      "Nachdem du das Thema des Blogtexts sowie individuelle Parameter festgelegt hast, generiert Siteware business automatisch einen professionellen und "+
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

  const AssistantCardList = () => {
    let servicearr = services;

    if(selectedCat != "all"){
      if(selectedCat != "favourites"){
        servicearr = services.filter((singleService: Service) => {
          return singleService.category == selectedCat;
        });
      }else{
        servicearr = services.filter((singleService: Service) => {
          if(user.services){
            return user.services.favourites.includes(singleService.uid);
          }
        });
      }
    }

    servicearr = servicearr.sort((a: Service, b: Service) => {
      if( a.rank < b.rank){
        return -1;
      }else if( a.rank > b.rank){
        return 1;
      }else{
        return 0;
      }
    })

    return (
      <div className={styles.servicelist}>
        {servicearr.map((singleService: Service, idx: number) => {
          return <AssistantCard
            key={idx}
            image={singleService.image}
            title={singleService.title}
            description={singleService.description}
            link={singleService.link}
            fav={user.services?.favourites.includes(singleService.uid)}
            onVideoClick={() => {
              setVideoLink(singleService.video);
              setVideoPopupVisible(true);
              setPlay(true);
            }}
            onFav={async () => {
              const currentfavs = (user.services?.favourites)? user.services.favourites: [];
              currentfavs.push(singleService.uid);
              await updateData("User", login.uid, { services: { favourites: currentfavs } });
            }}
            onDeFav={async () => {
              const currentfavs =  user.services.favourites.filter((fservice: string) => {
                return fservice != singleService.uid
              })
              await updateData("User", login.uid, { services: { favourites: currentfavs } });
            }}
          />
        })}
      </div>
    );
  }


  return (
    <HomeSidebarLayout context={context} category={{ value: selectedCat, setter: setSelectedCat }}>
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
            <AssistantCardList />
          </div>

          <div className={styles.bannersection}><RecommendBox user={user} messageApi={messageApi} /></div>
        </div>

        <Modal className={styles.videopopup} footer={null} width={800} open={videoPopupVisible} onCancel={() => {
          setPlay(false);
          setVideoPopupVisible(false);
          if(videoLink){
            const player = videoplayer.current as ReactPlayer;
            if(player.getCurrentTime ){
              player.getInternalPlayer().pauseVideo();
              player.seekTo(0);
            }
            
          }
        }}>
          <div className={styles.videoplayer}>
            <ReactPlayer ref={videoplayer} url={videoLink} width='100%' height='100%'/>
          </div>
        </Modal>

        <Tour open={open} onClose={async () => {
          const currstate = user.tour;
          currstate.home = true;
          updateData( "User", login.uid, { tour: currstate } );
          setOpen( false );
        }} steps={steps} />
      </div>
    </HomeSidebarLayout>
  )
}