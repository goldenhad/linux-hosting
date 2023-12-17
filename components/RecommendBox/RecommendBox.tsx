import { Button, Modal, QRCode, Spin, Typography } from "antd";
import { HeartFilled, LoadingOutlined, CloseOutlined } from "@ant-design/icons";
import styles from "./recommendbox.module.scss"
import { useEffect, useState } from "react";
import axios from "axios";
import { User } from "../../firebase/types/User";

const Paragraph = Typography;

const RecommendBox = (props: { user: User, messageApi }) => {
  const [recommendModalOpen, setRecommendModalOpen] = useState(false);
  const [ recommendLink, setRecommendLink ] = useState( "" );

  useEffect( () => {
    /**
     * Gets the recommend link from the api asynchronously
     * and sets the corresponding state 
     */
    async function getRecommendLink() {
      const encryptedLink = await axios.post( "/api/recommend", { from: props.user.Company } );
      if( encryptedLink.data.message != "" ){
        setRecommendLink( encryptedLink.data.message );
      }
    }
    
    getRecommendLink();
    // eslint-disable-next-line
  }, [] );

  const copyLink = () => {
    if( recommendLink != "" ){
      navigator.clipboard.writeText( recommendLink );
      props.messageApi.success( "Link in die Zwischenablage kopiert." );
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


  return (
    <>
      <div className={styles.recommendourapp}>
        <div className={styles.recommendlove}>
          <HeartFilled />
        </div>
        <div className={styles.recommendexplanation}>
          <h3>Du liebst Siteware.Business?</h3>
          <Paragraph>
                  Empfehle uns weiter und sichere Dir 200 GRATIS E-Mails!
          </Paragraph>
        </div>
        <div className={styles.openrecdrawerrow}>
          <Button type="primary" onClick={() => {
            setRecommendModalOpen(true);
          }}>Jetzt empfehlen</Button>
        </div>
        <div className={styles.xpopup}>
          <CloseOutlined />
        </div>
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
    </>
  );
}

export default RecommendBox;