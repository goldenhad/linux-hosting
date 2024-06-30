import { Card } from "antd";
import styles from "./emtpycard.module.scss";
import { PlusCircleOutlined } from "@ant-design/icons";

/**
 * Component using the Antd card component to present an assistant to the user
 * @constructor
 */
const EmptyCard = () => {

  return (
    <a href={"/editor"}>
      <div className={styles.servicebox}>
        <Card className={styles.servicecard} style={{ width: 300 }}>
          <div className={styles.serviceheadline}>
            <div className={styles.servicelogo}>
              {/* eslint-disable-next-line */}
            </div>
            <div className={styles.servicetitle}>{}</div>
          </div>
          <div className={styles.servicedescription}>
            <PlusCircleOutlined className={styles.addicon}/>
            <div>Neuer Agent</div>
          </div>
        </Card>
      </div>
    </a>
  );
}

export default EmptyCard;
