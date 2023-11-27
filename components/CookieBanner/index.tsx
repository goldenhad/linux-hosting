import { Button, Modal, Typography } from 'antd';
import React, { ReactNode, useEffect, useState } from 'react';
import styles from './cookiebanner.module.scss';
import cookieCutter from 'cookie-cutter'
import Link from 'next/link';

const { Paragraph } = Typography;

const CookieBanner = (props: {  }) => {
    const [ active, setActive ] = useState(false);
    const [ accepted, setAccepted ] = useState(false);

    useEffect(() => {
        if(cookieCutter.get('mailbuddy-opt-consent')){
            setAccepted(true);
            setActive(false);
        }else{
            setAccepted(false);
            setActive(true);
        }
    })

    const setOptIn = () => {
        const aYearFromNow = new Date();
        aYearFromNow.setFullYear(aYearFromNow.getFullYear() + 1);
        
        cookieCutter.set('mailbuddy-opt-consent', "1", { expires: aYearFromNow });
        setAccepted(true);
        setActive(false);
    }

    return (
        <Modal className={styles.cookiebanner} width={"50%"} title={"Dein Datenschutz, unsere Priorität!"} open={active} footer={null}>
            <Paragraph className={styles.infotext}>
                Damit Mailbuddy reibungslos für dich funktioniert, setzen wir technisch notwendige Cookies ein.
                Diese sind unerlässlich für die grundlegenden Funktionen unserer Website und ermöglichen es dir, unsere Dienste sicher und effizient zu nutzen.
                Ohne diese Cookies könnte Mailbuddy nicht funktionieren. Indem du Mailbuddy weiterhin nutzt, stimmst du der Verwendung dieser essenziellen Cookies zu. Weitere Details findest du in unserer <Link href={"/datenschutz"}>Datenschutzrichtlinie</Link>.
            </Paragraph>
            <div className={styles.acceptbuttonrow}>
                <Button onClick={() => {setOptIn()}} type='primary'>Akzeptieren</Button>
            </div>
        </Modal>
    );
}

export default CookieBanner;
