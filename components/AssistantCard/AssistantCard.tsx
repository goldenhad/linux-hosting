import { Card, Typography } from "antd";
import styles from "./assistantcard.module.scss";
import Icon from "@ant-design/icons";
import Link from "next/link";
import Play from "../../public/icons/play.svg";
import Heart from "../../public/icons/heart.svg";
import HeartFull from "../../public/icons/heartFull.svg";

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


  return (
    <div className={styles.servicebox}>
      <Card className={styles.servicecard} style={{ width: 300 }}>
        <div className={styles.serviceheadline}>
          <div className={styles.servicelogo}>
            {/* eslint-disable-next-line */}
            <img width={50} height={50} src={props.image} alt="logo" />
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
            <Icon component={HeartFull} onClick={props.onDeFav} className={`${styles.iconsvg} ${styles.active}`} viewBox='0 0 22 22'/>:
            <Icon component={Heart} onClick={props.onFav} className={styles.iconsvg} viewBox='0 0 22 22'/>}
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
