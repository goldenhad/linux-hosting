import { Button, Modal, QRCode, Spin, Typography } from "antd";
import Icon, { LoadingOutlined } from "@ant-design/icons";
import styles from "./recommendbox.module.scss"
import { useEffect, useState } from "react";
import axios from "axios";
import { User } from "../../firebase/types/User";
import HeartFull from "../../public/icons/heartFull.svg";
import { isMobile } from "react-device-detect";
import { MessageInstance } from "antd/es/message/interface";

const Paragraph = Typography;


/**
 * Component used so users can recommend siteware to their friends
 * @param props.user User object
 * @param props.messageApi MessageInstance used for communicating with the user 
 * @returns 
 */
const RecommendBox = (props: { user: User, messageApi: MessageInstance }) => {
  const [recommendModalOpen, setRecommendModalOpen] = useState(false);
  const [ recommendLink, setRecommendLink ] = useState( "" );
  const [ bannerVisible, setBannerVisible ] = useState(false);

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

    setBannerVisible(true);
    
    getRecommendLink();
    // eslint-disable-next-line
  }, [] );

  /**
   * Copies the generated shareable link to the clipboard of the user
   */
  const copyLink = () => {
    if( recommendLink != "" ){
      navigator.clipboard.writeText( recommendLink );
      props.messageApi.success( "Link in die Zwischenablage kopiert." );
    }
  }
  
  /**
   * Downloads the QR code of the shareable link
   */
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

  /**
   * Helper function to get the banner wrapper of the component
   * @returns Banner or empty component
   */
  const Banner = () => {
    if(bannerVisible){
      return(
        <div className={styles.recommendourapp} onClick={() => {
          setRecommendModalOpen(true);
        }}>
          <div className={styles.recommendlove}>
            <Icon component={HeartFull} className={`${styles.iconsvg}`} viewBox='0 -2 20 22'/>
          </div>
          <div className={styles.recommendexplanation} onClick={() => {
            if(isMobile){
              setRecommendModalOpen(true);
            }
          }}
          >
            <div className={styles.catchphrase}>Du liebst Siteware business?</div>
          </div>
        </div>
      );
    }else{
      return(<></>);
    }
  }


  return (
    <>
      <Banner />
      <Modal title="Lade deine Freunde ein!" open={recommendModalOpen} width={800} footer={null} onCancel={() => {
        setRecommendModalOpen(false);
      }}>
        <div className={styles.recommendContent}>
          <div className={styles.recommendtext}>
            <h3 className={styles.recommendHeadline}></h3>
            <Paragraph>
          Du hast jetzt die Gelegenheit, deine Freunde zu Siteware business einzuladen.
          Für jeden Freund, der sich erfolgreich registriert, schenken wir dir 200 Gratis-Credits als Dankeschön.
          Teile einfach diesen Link, um deine Freunde einzuladen:
            </Paragraph>
            <div className={styles.recommendLink}>
              {( recommendLink == "" )? <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />: <div onClick={() => {
                copyLink()
              }}>{recommendLink}</div>}
            </div>
            <p>Alternativ kannst du auch den QR-Code benutzen und deinen Freunden schicken</p>
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