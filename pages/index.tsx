import { Card, Button, Form, Input, Select, Result, Skeleton, Space, Typography, Alert } from 'antd';
import styles from './index.module.scss'
import { db, prisma } from '../db';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { CombinedUser } from '../helper/LoginTypes';
import SidebarLayout from '../components/SidebarLayout';
import { Profile, Quota, TokenUsage } from '@prisma/client';
import { JsonObject } from '@prisma/client/runtime/library';
import AES from 'crypto-js/aes';
import enc from 'crypto-js/enc-utf8';
import { ProfileSettings } from '../helper/ProfileTypes';
import { useAuthContext } from '../components/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Company, Usage } from '../firebase/types/Company';
import updateData from '../firebase/data/updateData';
import { arrayUnion, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useAsyncEffect } from '../helper/useAsyncEffect';
import getData from '../firebase/data/getData';
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

  let datum = new Date();

  return {
    props: {
        Data: {
          currentMonth: datum.getMonth() + 1,
          currentYear: datum.getFullYear(),
        }
    },
  };

  
};


export default function Home(props: InitialProps) {
  const { login, user, company, role, quota } = useAuthContext();
  const [ form ] = Form.useForm();
  const [ isAnswerVisible, setIsAnswerVisible ] = useState(false);
  const [ isLoaderVisible, setIsLoaderVisible ] = useState(false);
  const [ isAnswerCardVisible, setIsAnswerCardvisible ] = useState(false);
  const [ answer, setAnswer ] = useState("");
  const [ formDisabled, setFormDisabled ] = useState(false);
  const [ quotaOverused, setQuotaOverused ] =  useState(!false);
  const [ tokens, setTokens ] = useState("");
  const [ comp, setComp ] = useState(company);

  
  const router = useRouter();

  useEffect(() => {
    console.log(company.Usage);
  }, [company])

  useEffect(() => {

    const createData = async () => {
      await updateDoc(doc(db, "Company", user.Company), { Usage: arrayUnion({ month: props.Data.currentMonth, year: props.Data.currentYear, amount: 0 }) });
    }
      

    let currentUsage = company.Usage.find((Usge: Usage) => {
      return Usge.month == props.Data.currentMonth && Usge.year == props.Data.currentYear;
    });

    if(currentUsage){
      if(currentUsage.amount < quota.tokens){
        setQuotaOverused(true);
      }else{
        setQuotaOverused(false);
      }
    }else{
      console.log("no usage")
      createData();
    }

    if (login == null) router.push("/login");
      
}, [login]);

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
    
        if(answer.data){
          setIsLoaderVisible(false);
          setIsAnswerVisible(true);
          setAnswer(answer.data.message);
          setTokens(answer.data.tokens);
  
          let caps = props.InitialState.role.capabilities as JsonObject;
  
          if(!caps.superadmin){
            
            await updateDoc(doc(db, "Company", user.Company), { Usage: arrayUnion({ month: props.Data.currentMonth, year: props.Data.currentYear, amount: company.Usage.find((val) => {return val.month == props.Data.currentMonth && val.year == props.Data.currentYear}) + answer.data.tokens }) });
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
    if(user){
      if(!(user.profiles?.length > 0)){
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
  }

  return (
    <SidebarLayout capabilities={(role)? role.capabilities: {}}>
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
