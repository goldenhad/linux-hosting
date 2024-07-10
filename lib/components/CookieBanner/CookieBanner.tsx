import { Button, List, Modal, Switch } from "antd";
import React, { useEffect, useState } from "react";
import styles from "./cookiebanner.module.scss";
import cookieCutter from "cookie-cutter"
import { isMobile } from "react-device-detect";

/**
 * Cookie banner used to resolve user cookie options 
 * @returns CookieBanner Component
 */
const CookieBanner = (  ) => {
  const [ active, setActive ] = useState( false );
  const [ activateAnalytics, SetActivateAnalyctics ] = useState(true);

  /**
   * Effect to check if the user has provided their consent already
   */
  useEffect( () => {
    if( cookieCutter.get( "mailbuddy-opt-consent" ) && cookieCutter.get( "mailbuddy-opt-analytics-consent" ) ){
      setActive( false );
    }else{
      setActive( true );
    }
  }, [] )

  /**
   * Set the cookie options depending on the user preferences
   */
  const setOptIn = () => {
    const aYearFromNow = new Date();
    aYearFromNow.setFullYear( aYearFromNow.getFullYear() + 1 );
        
    cookieCutter.set( "mailbuddy-opt-consent", "1", { expires: aYearFromNow } );
    if(activateAnalytics){
      cookieCutter.set( "mailbuddy-opt-analytics-consent", "1", { expires: aYearFromNow } );
    }else{
      cookieCutter.set( "mailbuddy-opt-analytics-consent", "0", { expires: aYearFromNow } );
    }
    setActive( false );
  }

  return (
    <Modal className={styles.cookiebanner} width={isMobile? "100%": "50%"} title={"Dein Datenschutz, unsere Priorität!"} open={active} footer={null}>
      <div className={styles.infotext}>
        Willkommen! Wir möchten dich informieren, dass unsere Webseite Cookies verwendet, um dir eine bessere Nutzererfahrung zu bieten.
        Unsere Cookies umfassen:<br /><br />
        <b>Technisch notwendige Cookies:</b> Diese sind essenziell für das reibungslose Funktionieren der Webseite,
         z.B. für Navigation und Zugriff auf sichere Bereiche.<br /><br />
        <b>Marketing-Cookies:</b> Diese werden verwendet, um Werbeinhalte zu personalisieren und die Effektivität unserer Werbung zu messen. Sie ermöglichen uns,
        Angebote besser auf deine Interessen abzustimmen.<br /><br />
        Deine Privatsphäre ist uns wichtig. Du hast unten die Möglichkeit,
        deine Cookie-Einstellungen zu verwalten und anzupassen. Bitte beachte, dass die Deaktivierung bestimmter Cookies deine Nutzungserfahrung beeinträchtigen kann.
      </div>
      <List className={styles.cookieoptions}>
        <List.Item>
          <span className={styles.cookiedescription}>Technisch notwendige Cookies:</span>
          <Switch defaultChecked disabled />
        </List.Item>
        <List.Item>
          <span className={styles.cookiedescription}>Marketing Cookies:</span>
          <Switch defaultChecked onChange={(checked: boolean) => {
            SetActivateAnalyctics(checked) 
          }} />
        </List.Item>
      </List>
      <div className={styles.acceptbuttonrow}>
        <Button onClick={() => {
          setOptIn()
        }} type='primary'>Speichern</Button>
      </div>
    </Modal>
  );
}

export default CookieBanner;
