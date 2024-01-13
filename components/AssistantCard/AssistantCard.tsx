import { Card, Typography } from "antd";
import styles from "./assistantcard.module.scss";
import Icon from "@ant-design/icons";
import Link from "next/link";
import Play from "../../public/icons/play.svg";
import Heart from "../../public/icons/heart.svg";
import HeartFull from "../../public/icons/heartFull.svg";
import { useEffect, useState } from "react";
import { getAssistantImage } from "../../firebase/drive/upload_file";

const { Paragraph } = Typography;

const AssistantCard = ( props: {
    image: string,
    title: string,
    description: string,
    link: string,
    fav?: boolean
    onFav?: () => void,
    onDeFav?: () => void,
    video: string
  } ) => {
  const [image, setImage] = useState("/base.svg");

  useEffect(() => {
    const loadImage = async () => {
      if(props.image){
        const url = await getAssistantImage(props.image);
        setImage(url);
      }else{
        setImage("/base.svg");
      }
    }

    loadImage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image]);


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
        <div className={styles.actions}>
          {(props.fav)?
            <Icon component={HeartFull} onClick={props.onDeFav} className={`${styles.iconsvg} ${styles.active}`} viewBox='0 0 22 25'/>:
            <Icon component={Heart} onClick={props.onFav} className={styles.iconsvg} viewBox='0 0 22 25'/>}
          <Link href={props.video} rel="noopener noreferrer" target="_blank">
            <Icon component={Play} className={styles.iconsvg} viewBox='0 0 22 22'/>
          </Link>
        </div>
        <Link href={props.link}>
          <span className={styles.assistantlink}>Zum Assistenten</span>
        </Link>
      </div>
    </div>
  );
}

export default AssistantCard;
