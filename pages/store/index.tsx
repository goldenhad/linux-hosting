import { Divider, Input, message, Modal } from "antd";
import styles from "./index.module.scss"
import { useEffect, useRef, useState } from "react";
import { GetServerSideProps } from "next";
import { useAuthContext } from "../../lib/components/context/AuthContext";
import { useRouter } from "next/navigation";
import updateData from "../../lib/firebase/data/updateData";
import { handleUndefinedTour } from "../../lib/helper/architecture";
import ReactPlayer from "react-player/lazy"
import { getAllDocs } from "../../lib/firebase/data/getData";
import Assistant, { Visibility } from "../../lib/firebase/types/Assistant";
import StoreSidebarLayout from "../../lib/components/StoreSidebar/StoreSidebarLayout";
import StoreCard from "../../lib/components/StoreCard/StoreCard";
import { Company } from "../../lib/firebase/types/Company";

const { Search } = Input;


export const getServerSideProps: GetServerSideProps = async () => {
  let assistants: Array<Assistant> = [];

  const assistantreq = await getAllDocs("Assistants");

  if(assistantreq.result){
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
  const dialogRef = useRef( null );
  const monologRef = useRef( null );
  const [open, setOpen] = useState<boolean>( !handleUndefinedTour( user.tour ).home );
  const [messageApi, contextHolder] = message.useMessage();
  const [ selectedCat, setSelectedCat ] = useState("all");
  const [ videoPopupVisible, setVideoPopupVisible ] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [ videoLink, setVideoLink ] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [play, setPlay] = useState(false);
  const [ searchValue, setSearchValue ] = useState<string>("");

  const videoplayer = useRef(null);



  useEffect( () => {
    if( !user.setupDone && user.setupDone != undefined ){
      router.push( "/setup" );
    }
    if( !role.canEditCompanyDetails ){
      router.push( "/" );
    }
  }, [router, user.setupDone] );


  const AssistantCardList = () => {
    let servicearr = props.assistants;

    if(selectedCat != "unpublished"){
      servicearr = props.assistants.filter((singleService: Assistant) => {
        return singleService.published == true && 
            (
              (singleService.visibility === Visibility.ALL) ||
                    (singleService.visibility === Visibility.SELECTED && singleService.selectedCompanies && singleService.selectedCompanies.includes(user.Company)) ||
                      (singleService.visibility === Visibility.PRIVATE && singleService.owner === user.Company)
            );
      });

      if(selectedCat != "all"){
        if(selectedCat != "favourites"){
          servicearr = servicearr.filter((singleService: Assistant) => {
            return singleService.category == selectedCat;
          });
        }else{
          servicearr = servicearr.filter((singleService: Assistant) => {
            if(user.services){
              return user.services.favourites.includes(singleService.uid);
            }
          });
        }
      }
    }else{
      servicearr.filter((singleService: Assistant) => {
        return singleService.published == false;
      });
    }

    const getRibbonText = (uid: string) => {
      if(uid == "excel" || uid == "dialog" || uid == "monolog" || uid == "translator" || uid == "plain"){
        return "Neu"
      }else{
        return undefined;
      }
    }

    return (
      <div className={styles.servicelist}>
        {servicearr.filter((singleService: Assistant) => {
          if(searchValue !== ""){
            return singleService.name.includes(searchValue);
          }else{
            return true;
          }
        }).map((singleService: Assistant, idx: number) => {
          return <StoreCard
            aid={singleService.uid}
            name={singleService.uid}
            key={idx}
            image={singleService.image}
            title={singleService.name}
            description={singleService.description}
            ribbonText={getRibbonText(singleService.uid)}
            router={router}
            published={singleService.published}
            used={(context.company.assistants !== undefined && context.company.assistants.includes(singleService.uid))}
            onAdd={async () => {
              if(context.company.assistants === undefined) {
                const comp: Company = context.company;
                comp.assistants = [singleService.uid];
                await updateData("Company", context.user.Company, comp);
                console.log("Assistant has been added!");
              }else{
                const comp: Company = context.company;
                comp.assistants.push(singleService.uid);
                await updateData("Company", context.user.Company, comp);
                console.log("Assistant has been added!");
              }

            }}
            onRemove={async () => {
              const comp: Company = context.company;
              comp.assistants = comp.assistants.filter((aid) => {
                return aid !== singleService.uid;
              })
              await updateData("Company", context.user.Company, comp);
              console.log("Assistant has been added!");
            }}
          />
        })}
      </div>
    );
  }


  return (
    <StoreSidebarLayout messageApi={messageApi} context={context} category={{ value: selectedCat, setter: setSelectedCat }}>
      {contextHolder}
      <div className={styles.main}>
        <div className={styles.greetingrow}>
          <div className={styles.greeting}>Verfügbare Agenten</div>
          <Search placeholder="Suchbegriff" allowClear onSearch={(value) => {
            setSearchValue(value)
          }} style={{ width: 200 }} />
        </div>

        <div className={styles.dividerrow}>
          <Divider />
        </div>

        <div className={styles.content}>
          <div className={styles.services}>
            <AssistantCardList />
          </div>

          <div className={styles.bannersection}></div>
        </div>

        <Modal className={styles.videopopup} footer={null} width={1000} open={videoPopupVisible} onCancel={() => {
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
            <ReactPlayer ref={videoplayer} url={videoLink} width='100%' height='60vh'/>
          </div>
        </Modal>
      </div>
    </StoreSidebarLayout>
  )
}