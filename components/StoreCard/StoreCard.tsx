import { Badge, Button, Card, Dropdown, Modal, Space, Tooltip, Typography } from "antd";
import styles from "./storecard.module.scss";
import { useEffect, useState } from "react";
import { getAssistantImageUrl } from "../../firebase/drive/upload_file";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

const { Paragraph } = Typography;

/**
 * Component using the Antd card component to present an assistant to the user
 * @param props.name Name of the assistant, used for fav-feature
 * @param props.image Link to the image of the assistant
 * @param props.title Title of the assistant
 * @param props.description Short explanatory text used to describe the assistants features
 * @param props.link Link to the assistant
 * @param props.fav Flag that indicates if the assistant is a favourite of the user
 * @param props.onFav Function to be called if the user favs this assistant
 * @param props.onDeFav Function to be called if the user defavs this assistant
 * @param props.onVideoClick Function to be called if the user clicks on the video button
 * @constructor
 */
const StoreCard = (props: {
    aid: string,
    name: string,
    image: string,
    title: string,
    description: string,
    ribbonText: string,
    onAdd?: () => void,
    onRemove?: () => void,
    published: boolean,
    used: boolean,
    router: AppRouterInstance
  } ) => {
  const [image, setImage] = useState("/base.svg");

  /**
   * Effect to load the provided assistant image.
   * If no image was provided use the base svg image
   */
  useEffect(() => {
    const loadImage = async () => {
      const url = await getAssistantImageUrl(props.aid);
      if(url){
        setImage(url);
      }else{
        setImage("/base.svg")
      }
    }

    loadImage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const AssCard = () => {
    return (
      <div className={styles.servicebox}>
        <Card className={styles.servicecard} style={{ width: 300 }}>
          <div className={styles.serviceheadline}>
            <div className={styles.servicelogo}>
              {/* eslint-disable-next-line */}
              <img width={50} height={50} src={image} alt="logo" />
            </div>
            <div className={styles.servicetitle}>{props.title}</div>
          </div>
          <Paragraph className={styles.servicedescription} ellipsis={ { rows: 4, expandable: true, symbol: "..." }}>
            {props.description}
          </Paragraph>
        </Card>
        <div className={styles.servicefooter}>
          {(props.used)?
            <Button className={styles.storebutton} onClick={props.onRemove} danger={true}> Entfernen</Button>:
            <Button className={`${styles.storebutton} ${styles.addbutton}`} onClick={props.onAdd}> Hinzufügen +</Button>
          }
        </div>
      </div>
    );
  }


  if(props.ribbonText){
    return (
      <Badge.Ribbon text={"Neu"} color="red">
        <AssCard />
      </Badge.Ribbon>
    );
  }else{
    return <AssCard />
  }
}

export default StoreCard;
