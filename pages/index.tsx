import { Card, Button, Form, Input, Select, Result, Skeleton, Space, Typography, Alert } from 'antd';
import styles from './index.module.scss'
import { prisma } from '../db';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { CombinedUser } from '../helper/LoginTypes';
import SidebarLayout from '../components/SidebarLayout';
import { Profile, Quota, TokenUsage } from '@prisma/client';
import { JsonObject } from '@prisma/client/runtime/library';
import AES from 'crypto-js/aes';
import enc from 'crypto-js/enc-utf8';
import { ProfileSettings } from '../helper/ProfileTypes';
const { Paragraph } = Typography;
const { TextArea } = Input;



export interface InitialProps {
  Data: {
    currentMonth: number,
    currentYear: number,
    profiles: Array<Profile & {parsedSettings: ProfileSettings}>,
    usage: TokenUsage,
    quota: Quota
  };
  InitialState: CombinedUser;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  //Get the context of the request
  const { req, res } = ctx;
  //Get the cookies from the current request
  const { cookies } = req;

  //Check if the login cookie is set
  if (!cookies.login) {
      //Redirect if the cookie is not set
      res.writeHead(302, { Location: "/login" });
      res.end();

      return { props: { InitialState: {} } };
  } else {
      let datum = new Date();
      let loginobj = JSON.parse(Buffer.from(cookies.login, "base64").toString("ascii"));

      let profiles = await prisma.profile.findMany({
        where: {
          userId: loginobj.id,
        }
      });

      let parsedProfiles: Array<Profile & {parsedSettings: ProfileSettings} > = [];

      const pepper = process.env.PEPPER;

      profiles.forEach((profile: Profile) => {
          let decryptedBaseByte = AES.decrypt(profile.settings, profile.salt + pepper);
          let decryptedBase = decryptedBaseByte.toString(enc);
          let decryptedSettings = JSON.parse(decryptedBase);

          let singleParsed = {...profile, parsedSettings: decryptedSettings as ProfileSettings};

          parsedProfiles.push(singleParsed);
      });

      
      let usage = await prisma.tokenUsage.findFirst({
        where: {
          companyId: loginobj.company.id,
          month: datum.getMonth()+1,
          year: datum.getFullYear()
        }
      });

      if( !usage ){
        usage = await prisma.tokenUsage.create({
          data: {
            month: datum.getMonth()+1,
            year: datum.getFullYear(),
            amount: 0,
            companyId: loginobj.company.id
          }
        });
      }

      return {
          props: {
              InitialState: loginobj,
              Data: {
                currentMonth: datum.getMonth() + 1,
                currentYear: datum.getFullYear(),
                profiles: parsedProfiles,
                quota: loginobj.company.quota,
                usage: usage
              }
          },
      };
  }
};


export default function Home(props: InitialProps) {
  const [ form ] = Form.useForm();
  const [ isAnswerVisible, setIsAnswerVisible ] = useState(false);
  const [ isLoaderVisible, setIsLoaderVisible ] = useState(false);
  const [ isAnswerCardVisible, setIsAnswerCardvisible ] = useState(false);
  const [ answer, setAnswer ] = useState("");
  const [ formDisabled, setFormDisabled ] = useState(false);
  const [ currentUsage, setCurrentUsage ] = useState(props.Data.usage)
  const [ quotaOverused, setQuotaOverused ] =  useState(!false);
  const [ tokens, setTokens ] = useState("");

  useEffect(() => {
    console.log(props.Data);
    if(currentUsage.amount >= props.Data.quota.tokens){
      setQuotaOverused(true);
    }else{
      setQuotaOverused(false);
    }
  }, [currentUsage])

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

  const motive = [
    "Diplomatisch",
    "Respektvoll",
    "Kultiviert",
    "Bedächtig",
    "Persönlich",
    "Umgangssprachlich",
    "Unkonventionell",
    "Emphatisch"
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

  const lengths = [
    "So kurz wie möglich",
    "Sehr kurz",
    "Kurz",
    "Mittellang",
    "Detailliert",
    "Umfangreich und sehr detailliert"
  ];


  const listToOptions = (liste: Array<string>) => {
    const arr = liste.map(element => {
      return {
        value: element.toLowerCase(),
        label: element
      };
    });
  
    return arr;
  }

  const generateAnswer = async (values: any) => {

    console.log(values);

    let profile = props.Data.profiles.find((singleProfile: Profile) => {
      return singleProfile.name == values.profile;
    });

    if(profile) {
      try{
        setFormDisabled(true);
        setIsAnswerCardvisible(true);
        setIsLoaderVisible(true);
        setIsAnswerVisible(false);
        setTokens("");
  
        let answer = await axios.post('/api/prompt/generate', {
          personal: profile.parsedSettings.personal,
          dialog: values.dialog,
          continue: values.continue,
          address: profile.parsedSettings.salutation,
          style: profile.parsedSettings.stil,
          order: profile.parsedSettings.order,
          emotions: profile.parsedSettings.emotions,
          length: values.length
        });
  
        console.log(answer.data);
  
        if(answer.data){
          setIsLoaderVisible(false);
          setIsAnswerVisible(true);
          setAnswer(answer.data.message);
          setTokens(answer.data.tokens);
  
          let caps = props.InitialState.role.capabilities as JsonObject;
  
          if(!caps.superadmin){
            await axios.put(`/api/tokens/${props.InitialState.company.id}`, {
              amount: answer.data.tokens,
              month: props.Data.currentMonth,
              year: props.Data.currentYear
            });

            setCurrentUsage(currentUsage + answer.data.tokens)
          }
        }
  
        console.log(answer);
      }catch(e){
        console.log(e);
        setTokens("");
      }
  
      setFormDisabled(false);
    }
    
  }

  const getProfiles = () => {
    let profileOptions =  props.Data.profiles.map((singleProfile: Profile) => {
      return {
        key: singleProfile.id,
        value: singleProfile.name
      }
    });

    return profileOptions;
  }

  const getPrompt = () => {
    if(!props.Data.profiles){
      return (
        <Result
          title="Bitte definiere zuerst ein Profil"
          extra={
            <Button href='/profiles' type="primary" key="console">
              Profil erstellen
            </Button>
          }
        />
      );
    }else{
      return(
        <Card title={"Verlauf"}>
          <Form.Item label={<b>Profil</b>} name="profile">
                <Select
                showSearch
                placeholder="Wählen Sie ein Profil aus"
                optionFilterProp="children"
                onChange={(values: any) => {console.log(values)}}
                onSearch={() => {}}
                options={getProfiles()}
                disabled={formDisabled || quotaOverused}
              />
            </Form.Item>
            <Form.Item label={<b>Bisheriger Dialog</b>} name="dialog">
              <TextArea rows={10} placeholder="Bisheriger Dialog..." disabled={formDisabled || quotaOverused}/>
            </Form.Item>

            <Form.Item label={<b>Wie soll der Dialog fortgesetzt werden?</b>} name="continue">
              <TextArea rows={5} placeholder="Formulieren Sie kurz, wie der Dialog fortgesetzt werden soll und was sie damit erreichen wollen?" disabled={formDisabled || quotaOverused}/>
            </Form.Item>

            <Form.Item label={<b>Länge der Antwort</b>} name="length">
              <Select placeholder="Wie lang soll die erzeuge Antwort sein?" options={listToOptions(lengths)} disabled={formDisabled || quotaOverused}/>
            </Form.Item>

            <div className={styles.submitrow}>
              <Button className={styles.submitbutton} htmlType='submit' type='primary' disabled={formDisabled || quotaOverused}>Antwort generieren</Button>
            </div>
            <div className={styles.tokenalert}>
              {
                (quotaOverused)? <Alert message={`Ihr Tokenbudget ist ausgeschöpft. Ihr Budget setzt sich am 01.${props.Data.currentMonth+1}.${props.Data.currentYear} zurück. Wenn Sie weitere Tokens benötigen, können Sie diese in ihrem Konto dazubuchen.`} type="error" />: <></>
              }
            </div>
        </Card>
      );
    }
  }

  return (
    <SidebarLayout capabilities={props.InitialState.role.capabilities as JsonObject}>
      <main className={styles.main}>
        <Space direction='vertical' size={"large"}>
          <Form layout='vertical' onFinish={generateAnswer} onChange={() => {setIsAnswerCardvisible(false); setIsAnswerVisible(false); setIsLoaderVisible(false)}} form={form}>
            <div className={styles.mrow}>
              <div className={styles.mcol}>
                {getPrompt()}
              </div>

              
            </div>
          </Form>

          <Card title={"Antwort"} style={{ display: (isAnswerCardVisible)? 'block': 'none' }}>
              {(isAnswerVisible)? <div className={styles.answercol}><Paragraph>Die Anfrage hat {tokens} Tokens verbraucht.<pre>{answer}</pre></Paragraph><Button className={styles.clipboardbutton} onClick={() => {navigator.clipboard.writeText(answer)}}>In die Zwischenablage</Button></div>: <></>}
              {(isLoaderVisible)? <Skeleton active/>: <></>}
          </Card>
        </Space>
      </main>
    </SidebarLayout>
  )
}
