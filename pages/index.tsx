import { TourProps, Tour, Divider, message, Modal, Card, Badge, Button, Input } from "antd";
import styles from "./index.module.scss"
import { useEffect, useRef, useState } from "react";
import { GetServerSideProps } from "next";
import { useAuthContext } from "../lib/components/context/AuthContext";
import { useRouter } from "next/navigation";
import updateData from "../lib/firebase/data/updateData";
import { handleUndefinedTour } from "../lib/helper/architecture";
import AssistantCard from "../lib/components/AssistantCard/AssistantCard";
import HomeSidebarLayout from "../lib/components/HomeSidebar/HomeSidebarLayout";
import ReactPlayer from "react-player/lazy"
import { getAllDocs } from "../lib/firebase/data/getData";
import Assistant, { Visibility } from "../lib/firebase/types/Assistant";
import EmptyCard from "../lib/components/EmptyCard/EmptyCard";
import FatButton from "../lib/components/FatButton";
import Script from "next/script";

const { Search } = Input;


export const getServerSideProps: GetServerSideProps = async () => {
  let assistants: Array<Assistant> = [];

  const assistantreq = await getAllDocs("Assistants");

  if (assistantreq.result) {
    assistants = assistantreq.result;
  }


  return {
    props: {
      assistants: assistants
    }
  };
};


export default function Home(props: { assistants: Array<Assistant> }) {
  const context = useAuthContext();
  const { login, user, role } = context;
  const router = useRouter();
  const dialogRef = useRef(null);
  const monologRef = useRef(null);
  const [open, setOpen] = useState<boolean>(!handleUndefinedTour(user.tour).home);
  const [messageApi, contextHolder] = message.useMessage();
  const [selectedCat, setSelectedCat] = useState("all");
  const [videoPopupVisible, setVideoPopupVisible] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [videoLink] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [play, setPlay] = useState(false);
  const [searchValue, setSearchValue] = useState<string>("");
  const [favs, setFavs] = useState<Array<Assistant>>([])


  const videoplayer = useRef(null);



  useEffect(() => {
    if (!user.setupDone && user.setupDone != undefined) {
      router.push("/setup");
    }
  }, [router, user.setupDone]);

  useEffect(() => {
    const visibleAssistants = props.assistants.filter((singleService: Assistant) => {
      return singleService.published == true &&
        (
          (singleService.visibility === Visibility.ALL) ||
          (singleService.visibility === Visibility.SELECTED && singleService.selectedCompanies && singleService.selectedCompanies.includes(user.Company)) ||
          (singleService.visibility === Visibility.PRIVATE && singleService.owner === user.Company)
        );
    });

    setFavs(visibleAssistants);
  }, []);


  const steps: TourProps["steps"] = [
    {
      title: "Willkommen",
      description: "Willkommen bei Siteware, dem Ort, an dem wir das E-Mail-Schreiben revolutionieren! Unser Ziel ist es, " +
        "deine E-Mail-Kommunikation effizienter und angenehmer zu gestalten. Wir bieten dir innovative Funktionen, die deine E-Mail-Erfahrung " +
        "vereinfachen und verbessern. Im Folgenden wollen wir dir in diesen Tutorials die wichtigsten Funktionen näher erklären.",
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
      description: "Dann kannst du dieses Pop-Up einfach wegklicken, und wir nerven dich nicht weiter. Wenn du das Tutorial nochmal durchlaufen möchtest, " +
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
      title: "Mail-Dialog",
      description: "Die Funktion \"Mail-Dialog\" ermöglicht es dir, einen bestehenden E-Mail-Verlauf nahtlos fortzuführen. " +
        "Hierbei kannst du einfach den bisherigen E-Mail-Verlauf in das System einfügen und spezifizieren, wie deine gewünschte Antwort aussehen " +
        "soll. Basierend auf deinen Vorgaben und dem Kontext des E-Mail-Verlaufs generiert Siteware automatisch eine passende Antwort.",
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
      description: "Die Funktion \"E-Mail schreiben\" ist ein leistungsstarkes Tool, das dir dabei hilft, schnell und effektiv E-Mails zu verfassen. " +
        "Als Nutzer spezifizierst du einfach den gewünschten Inhalt oder den Hauptzweck deiner E-Mail, zum Beispiel eine Terminanfrage, ein Update für " +
        "ein Projekt oder eine Rückmeldung zu einer Anfrage. Basierend auf deinen Angaben generiert Siteware dann einen professionellen und " +
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
      description: "Die Funktion \"Blogbeitrag erzeugen\" dient dazu, voll automatisch fesselnde Blogbeiträge zu verfassen. " +
        "Nachdem du das Thema des Blogtexts sowie individuelle Parameter festgelegt hast, generiert Siteware automatisch einen professionellen und " +
        "ansprechenden Blogtext, ganz nach deinen Vorstellungen.",
      target: () => monologRef.current,
      nextButtonProps: {
        children: (
          "Alles klar"
        ),
        onClick: async () => {
          const currstate = user.tour;
          currstate.home = true;
          updateData("User", login.uid, { tour: currstate })
        }
      },
      prevButtonProps: {
        children: (
          "Zurück"
        )
      }
    }
  ];

  const AssistantCardList = ({ assistantsList }: { assistantsList: Array<Assistant> }) => {


    if (assistantsList.length > 0) {
      const getRibbonText = (published: boolean) => {
        if (!published) {
          return "Entwurf"
        } else {
          return undefined;
        }
      }

      return (
        <div className={styles.servicelist}>
          {assistantsList.map((singleService: Assistant, idx: number) => {
            return <AssistantCard
              aid={singleService.uid}
              name={singleService.uid}
              blocks={singleService.blocks}
              key={idx}
              image={singleService.image}
              title={singleService.name}
              description={singleService.description}
              link={`/assistant?aid=${singleService.uid}`}
              fav={user.services?.favourites.includes(singleService.uid)}
              knowledeFiles={singleService.knowledgeFiles}
              ribbonText={getRibbonText(singleService.published)}
              router={router}
              onVideoClick={() => {
                // setVideoLink(singleService.video);
                // setVideoPopupVisible(true);
                // setPlay(true);
                window.open(singleService.video, "_blank", "noreferrer");
              }}
              onFav={async () => {
                const currentfavs = (user.services?.favourites) ? user.services.favourites : [];
                currentfavs.push(singleService.uid);
                await updateData("User", login.uid, { services: { favourites: currentfavs } });
              }}
              onDeFav={async () => {
                const currentfavs = user.services.favourites.filter((fservice: string) => {
                  return fservice != singleService.uid
                })
                await updateData("User", login.uid, { services: { favourites: currentfavs } });
              }}
              canEdit={role.canUseEditor}
              published={singleService.published}
            />
          })}
          {role.canUseEditor && <EmptyCard />}
        </div>
      );
    } else {
      return (
        <div className={styles.servicenotice}>
          {(role.canEditCompanyDetails) ? "Du kannst neue Agenten im Appstore hinzufügen" : "Bitte einen Firmenadministrator darum neue Agenten hinzuzufügen"}
          {role.canEditCompanyDetails &&
            <FatButton text={"Zum Appstore"} onClick={() => {
              router.push("/store")
            }}></FatButton>}
        </div>
      );
    }
  }

  let assistantsList: Array<Assistant> = [];
  if (context.company.assistants !== undefined) {
    let servicearr = props.assistants.filter((assistant) => {
      return context.company.assistants.includes(assistant.uid) || (selectedCat == "admin");
    });


    if (selectedCat != "admin") {
      servicearr = favs

      if (selectedCat != "all") {
        if (selectedCat != "favourites") {
          servicearr = servicearr.filter((singleService: Assistant) => {
            return singleService.category == selectedCat;
          });
        } else {
          servicearr = servicearr.filter((singleService: Assistant) => {
            if (user.services) {
              return user.services.favourites.includes(singleService.uid);
            }
          });
        }
      }
    } else {
      servicearr = servicearr.filter(() => {
        return true;
      });
    }

    assistantsList = servicearr.filter((assistant) => {
      return context.company.assistants.includes(assistant.uid) || (selectedCat == "admin");
    }).filter((singleService: Assistant) => {
      if (searchValue !== "") {
        return singleService.name.includes(searchValue);
      } else {
        return true;
      }
    });

  }

  const env = process.env.NODE_ENV;
  const firstAssistantId = env === "development" && !!context.company.assistants ? assistantsList?.[0]?.uid : null;

  return (
    <HomeSidebarLayout messageApi={messageApi} context={context}
      category={{ value: selectedCat, setter: setSelectedCat }} favouriteCount={
        favs.filter((singleService: Assistant) => {
          if (user.services) {
            return user.services.favourites.includes(singleService.uid);
          }
        }).length
      } >
      {firstAssistantId && 
        <Script onReady={() => window.initChatBot()} strategy="afterInteractive" src={`/api/chatbot?agentid=${firstAssistantId}&apiKey=${user.apikey}`} />}
      {contextHolder}
      <div className={styles.main}>
        <div className={styles.greetingrow}>
          <div className={styles.greeting}>Willkommen {user.firstname}</div>
          <Search placeholder="Suchbegriff" allowClear onSearch={(value) => {
            setSearchValue(value)
          }} style={{ width: 200 }} />
        </div>

        <div className={styles.dividerrow}>
          <Divider />
        </div>

        <div className={styles.content}>
          <div className={styles.services}>
            <AssistantCardList assistantsList={assistantsList} />
          </div>

          <div className={styles.comingsoonrow}>
            <div className={styles.comingsoon}>
              <Card className={styles.comingsooncard}>
                <div className={styles.builder}>
                  <div className={styles.buildercontent}>
                    <h2 className={styles.builderheadline}>Frag jetzt deinen individuellen KI-Agenten von
                      Siteware an.</h2>
                    <div className={styles.buildertext}>
                      Fordere jetzt dein maßgeschneidertes Angebot an und nutze unsere innovative DMSP-Technologie
                      für kostengünstige,
                      hochindividualisierte Lösungen. Einzigartig: Profitiere von einer möglichen vollständigen
                      Refinanzierung der Entwicklungskosten,
                      wenn dein Agent auch von anderen aktiv genutzt wird. Je nach Akzeptanz unter den Nutzern
                      schreiben wir dir die doppelte Höhe deiner
                      Entwicklungskosten auf dein Konto als siteware-Credits gut.
                      Wähle schon bald aus einer Vielzahl an Agenten im neuen siteware APP-Store.
                      Mit siteware bist du immer einen Schritt voraus – sei dabei. Von Anfang an.
                    </div>
                    <div className={styles.buttonsection}>
                      <Button
                        type="primary"
                        href={"mailto:info@siteware.io?subject=Anfrage%20individueller%20KI-Agent"}
                        className={styles.builderbutton}
                      >
                        Angebot anfordern
                      </Button>
                    </div>
                  </div>
                  <div className={styles.builderteaser}>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className={styles.bannersection}></div>
        </div>

        <Modal className={styles.videopopup} footer={null} width={1000} open={videoPopupVisible} onCancel={() => {
          setPlay(false);
          setVideoPopupVisible(false);
          if (videoLink) {
            const player = videoplayer.current as ReactPlayer;
            if (player.getCurrentTime) {
              player.getInternalPlayer().pauseVideo();
              player.seekTo(0);
            }

          }
        }}>
          <div className={styles.videoplayer}>
            <ReactPlayer ref={videoplayer} url={videoLink} width='100%' height='60vh' />
          </div>
        </Modal>

        <Tour open={open} onClose={async () => {
          const currstate = user.tour;
          currstate.home = true;
          updateData("User", login.uid, { tour: currstate });
          setOpen(false);
        }} steps={steps} />
      </div>
    </HomeSidebarLayout>
  )
}