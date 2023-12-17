import { Card } from "antd";
import styles from "./assistantcard.module.scss";
import { HeartOutlined } from "@ant-design/icons";
import Link from "next/link";



const AssistantCard = ( props: {
    image: string,
    title: string,
    description: string,
    link: string 
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
        <div className={styles.servicedescription}>
          {props.description}
        </div>
      </Card>
      <div className={styles.servicefooter}>
        <HeartOutlined className={styles.fav}/>
        <Link href={props.link}>
          <span className={styles.assistantlink}>Zum Assistenten</span>
        </Link>
      </div>
    </div>
  );
}

export default AssistantCard;
