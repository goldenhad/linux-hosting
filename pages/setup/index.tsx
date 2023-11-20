import router from "next/router";
import { GetServerSideProps } from "next";
import { Component, useEffect, useState } from "react";
import { Alert, Button, Checkbox, Form, Input, Select, Steps, Typography } from 'antd';
import styles from './setup.module.scss'
import Head from "next/head";
import { useAuthContext } from "../../components/context/AuthContext";
import updateData from "../../firebase/data/updateData";
import { listToOptions } from "../../helper/architecture";
const { Paragraph } = Typography;
const { TextArea } = Input;


const style = [
    "Professionell",
    "Formell",
    "Sachlich",
    "Komplex",
    "Einfach",
    "Konservativ",
    "Modern",
    "Wissenschaftlich",
    "Fachspezifisch",
    "Abstrakt",
    "Klar",
    "Direkt",
    "Rhetorisch",
    "Ausdrucksstark"
  ];

  const emotions = [
    "Humorvoll",
    "Nüchtern",
    "Sentimental",
    "Objektiv",
    "Subjektiv",
    "Ehrfürchtig",
    "Emotionell",
    "Lebhaft",
    "Freundlich",
    "Höflich",
    "Selbstbewusst",
    "Sympathisch",
    "Kreativ",
    "Enthusiastisch",
    "Eloquent",
    "Prägnant",
    "Blumig",
    "Poetisch",
    "Pathetisch",
    "Scherzhaft",
    "Mystisch",
    "Ironisch",
    "Sarkastisch",
    "Despektierlich"
  ];


export const getServerSideProps: GetServerSideProps = async (ctx) => {
    //Get the context of the request
    const { req, res } = ctx
    //Get the cookies from the current request
    const {cookies} = req

    return { props: { InitialState: {} } }
}

export default function Setup(){
    const { login, user, company, role } = useAuthContext();
    const [current, setCurrent] = useState(0);
    const [ setupForm ] = Form.useForm();

    useEffect(() => {
        // Check if the user already has profiles. In this Case the setup was not run yet;
        if(user.setupDone){
            router.push("/");
        }
    }, [])


    const getFormSteps = () => {        
        if(user.Role == "Company"){
            return [
                {   step: 0,
                    title: "Erzähl mir etwas über deine Firma!",
                    content: <div className={styles.singlestep}>
                        <Paragraph>Damit wir dir das bestmögliche Nutzererlebnis bieten können, benötigen wir ein paar Infos über dich. Das hilft uns, maßgeschneiderte Lösungen für dich zu erzeugen. Keine Sorge, deine Daten sind bei uns in sicheren Händen!</Paragraph>
                        <div className={styles.formpart}>
                            <Form.Item name="company">
                                <TextArea className={styles.forminput} rows={10} placeholder={"Beschreibe deine Firma und ihr Kerngeschäft."}></TextArea>
                            </Form.Item>
                        </div>
                    </div>
                },
                {
                    step: 1,
                    title: "Erzähl mir etwas über Dich!",
                    content: <div className={styles.singlestep}>
                        <Paragraph>Zusätzlich benötigen wir noch Informationen über dich.</Paragraph>
                        <div className={styles.formpart}>
                            <Form.Item name={"user"}>
                                <TextArea className={styles.forminput} rows={10} placeholder={"Beschreibe dich und was dich auszeichnet."}></TextArea>
                            </Form.Item>
                        </div>
                    </div>
                },
                {
                    step: 2,
                    title: "Wie schreibst du deine Mails?",
                    content: <div className={styles.singlestep}>
                        <Paragraph>Wir möchten mehr über deinen Schreibstil erfahren, damit Mailbuddy ihn perfekt imitieren kann. Das hilft uns, dir eine personalisierte und natürliche Erfahrung zu bieten.</Paragraph>
                        <div className={styles.formpart}>
                            <Form.Item name={"styles"} label={"Wir würdest du den Stil deiner E-Mails beschreiben?"}>
                                <Select options={listToOptions(style)} className={styles.formselect} size='large' mode="multiple" allowClear/>
                            </Form.Item>
                        </div>
                        <div className={styles.formpart}>
                            <Form.Item name={"emotions"} label={"Welche Gemütslage hast du dabei?"}>
                                <Select options={listToOptions(emotions)} className={styles.formselect} size='large' mode="multiple" allowClear/>
                            </Form.Item>
                        </div>
                    </div>
                },
                {
                    step: 3,
                    title: "Abschließen",
                    content: <div className={styles.singlestep}>
                        <Paragraph>
                        Du bist jetzt startklar für Mailbuddy! Alles, was du brauchst, ist einsatzbereit. Los geht's. Erlebe eine neue Dimension der E-Mail-Kommunikation!
                        </Paragraph>
                    </div>
                },
            ];
        }else{
            return [
                {
                    step: 0,
                    title: "Erzähl mir etwas über Dich!",
                    content: <div className={styles.singlestep}>
                        <Paragraph>Damit wir dir das bestmögliche Nutzererlebnis bieten können, benötigen wir ein paar Infos über deine Firma. Das hilft uns, maßgeschneiderte Lösungen für dich zu erzeugen. Keine Sorge, deine Daten sind bei uns in sicheren Händen!</Paragraph>
                        <div className={styles.formpart}>
                            <Form.Item name={"user"}>
                                <TextArea className={styles.forminput} rows={10} placeholder={"Beschreibe dich und was dich auszeichnet."}></TextArea>
                            </Form.Item>
                        </div>
                    </div>
                },
                {
                    step: 1,
                    title: "Wie schreibst du deine Mails?",
                    content: <div className={styles.singlestep}>
                        <Paragraph>Wir möchten mehr über deinen Schreibstil erfahren, damit Mailbuddy ihn perfekt imitieren kann. Das hilft uns, dir eine personalisierte und natürliche Erfahrung zu bieten.</Paragraph>
                        <div className={styles.formpart}>
                            <Form.Item name={"styles"} label={"Wir würdest du den Stil deiner E-Mails beschreiben?"}>
                                <Select options={listToOptions(style)} className={styles.formselect} size='large' mode="multiple" allowClear/>
                            </Form.Item>
                        </div>
                        <div className={styles.formpart}>
                            <Form.Item name={"emotions"} label={"Welche Gemütslage hast du dabei?"}>
                                <Select options={listToOptions(emotions)} className={styles.formselect} size='large' mode="multiple" allowClear/>
                            </Form.Item>
                        </div>
                    </div>
                },
                {
                    step: 2,
                    title: "Abschließen",
                    content: <div className={styles.singlestep}>
                        <Paragraph>
                        Du bist jetzt startklar für Mailbuddy! Alles, was du brauchst, ist einsatzbereit. Los geht's. Erlebe eine neue Dimension der E-Mail-Kommunikation!
                        </Paragraph>
                    </div>
                },
            ];
        }
    }
    
    const setupUser = async () => {
        let companyinfo = setupForm.getFieldValue("company");
        let userinfo = setupForm.getFieldValue("user");
        let userstyles = setupForm.getFieldValue("styles");
        let userEmotions = setupForm.getFieldValue("emotions");
        
        console.log([companyinfo, userinfo, userstyles, userEmotions]);

        if(companyinfo){
            await updateData("Company", user.Company, { settings: { background: companyinfo } });
        }

        if(userinfo){
            await updateData("User", login.uid, { profiles: [ { name: "Hauptprofil", settings: { personal: userinfo, emotions: userEmotions, stil: userstyles } } ], setupDone: true });
        }

        router.push("/");
    }

    return(
        <div>
            <div className={styles.logincontainer}>
                <div className={styles.logorow}>
                    <div className={styles.logobox}>
                        <img src={"/logo.svg"} alt="Logo" width={100}/>
                    </div>
                </div>

                <div className={styles.formContainer}>
                    <div className={styles.formtitle}>Willkommen bei Mailbuddy</div>
                    <div className={styles.formexplanation}>Wir müssen zuerst dein Konto einrichten</div>
                    
                    <div className={styles.stepcontainer}>
                        <Steps className={styles.stepbanner} current={current} items={getFormSteps()} />

                        <div className={styles.stepformcontent}>
                            <Form form={setupForm} onFinish={setupUser} layout="vertical">
                                {getFormSteps()[current].content}
                            </Form>
                        </div>


                        <div className={styles.continue}>
                            {current < getFormSteps().length - 1 && (
                            <Button type="primary" onClick={() => setCurrent(current + 1)}>
                                Weiter
                            </Button>
                            )}
                            {current === getFormSteps().length - 1 && (
                            <Button type="primary" onClick={() => setupUser()}>
                                Zu Mailbuddy
                            </Button>
                            )}
                            {current > 0 && (
                            <Button style={{ margin: '0 8px' }} onClick={() => setCurrent(current - 1)}>
                                Zurück
                            </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.copyrightfooter}>© Mailbuddy 2023</div>
        </div>
    );
}