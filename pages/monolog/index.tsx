import { Card, Button, Form, Input, Select, Result, Skeleton, Typography, Alert, Divider, message } from 'antd';
import Icon from '@ant-design/icons';
import styles from './index.module.scss'
import { db } from '../../db';
import axios, { AxiosResponse } from 'axios';
import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import SidebarLayout from '../../components/Sidebar/SidebarLayout';
import { useAuthContext } from '../../components/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Usage } from '../../firebase/types/Company';
import { Profile } from '../../firebase/types/Profile';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { handleEmptyString, listToOptions } from '../../helper/architecture';
import ArrowRight from '../../public/icons/arrowright.svg';
import Info from '../../public/icons/info.svg';
import Clipboard from '../../public/icons/clipboard.svg';
import cookieCutter from 'cookie-cutter'
import updateData from '../../firebase/data/updateData';
const { Paragraph } = Typography;
const { TextArea } = Input;

const axiosTime = require('axios-time');

axiosTime(axios);


export interface InitialProps {
  Data: {
    currentMonth: number,
    currentYear: number,
  };
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



export default function Monologue(props: InitialProps) {
  const { login, user, company, role, parameters } = useAuthContext();
  const [ form ] = Form.useForm();
  const [ showAnswer, setShowAnswer ] = useState(false);
  const [ isAnswerVisible, setIsAnswerVisible ] = useState(false);
  const [ isLoaderVisible, setIsLoaderVisible ] = useState(false);
  const [ isAnswerCardVisible, setIsAnswerCardvisible ] = useState(false);
  const [ answer, setAnswer ] = useState("");
  const [ formDisabled, setFormDisabled ] = useState(false);
  const [ quotaOverused, setQuotaOverused ] =  useState(!false);
  const [messageApi, contextHolder] = message.useMessage();
  const [ tokens, setTokens ] = useState("");
  const [ promptError, setPromptError ] = useState(false);


  const updateField = (field: string, value: string) => {
    if(value && value != ""){
      form.setFieldValue(field, value);
    }
  }

  useEffect(() => {
    if(user.lastState.monolog){
      try{
        updateField('profile', user.lastState.monolog.profile);
        updateField('content', user.lastState.monolog.content);
        updateField('address', user.lastState.monolog.address);
        updateField('order', user.lastState.monolog.order);
        updateField('length', user.lastState.monolog.length);
      }catch(e){
        console.log(e);
      }
      
    }
  }, []);

  useEffect(() => {

    const createData = async () => {
      setQuotaOverused(false);
      console.log("Creating new Quota...");
      await updateDoc(doc(db, "Company", user.Company), { tokens: 0 });
    }

    if(company.tokens != undefined){
      if(company.tokens <= 0){
        setQuotaOverused(true);
      }else{
        setQuotaOverused(false);
      }
    }else{
      createData();
    }
      
  }, [company]);


  const generateAnswer = async (values: any) => {
    let profile = user.profiles.find((singleProfile: Profile) => {
      return singleProfile.name == values.profile;
    });

    if(profile) {
      try{
        setFormDisabled(true);
        setIsAnswerCardvisible(true);
        setIsLoaderVisible(true);
        setShowAnswer(true);
        setIsAnswerVisible(false);
        setPromptError(false);
        setTokens("");

        let cookieobject = {
          profile: values.profile,
          content: values.content,
          address: values.address,
          order: values.order,
          length: values.length
        }

        let newUser = user;
        newUser.lastState.monolog = cookieobject;
        await updateData('User', login.uid, newUser);
  
        let answer: AxiosResponse<any, any> & {timings: {elapsedTime: Number, timingEnd: Number, timingStart: Number}} = await axios.post('/api/prompt/monolog/generate', {
          personal: profile.settings.personal,
          content: values.content,
          address: values.address,
          style: profile.settings.stil,
          order: values.order,
          emotions: profile.settings.emotions,
          length: values.length
        });

        if(answer.data){
          setIsLoaderVisible(false);
          setIsAnswerVisible(true);
          setAnswer(answer.data.message);
          setTokens(answer.data.tokens);

          try{
            await axios.post("/api/stats", {tokens: answer.data.tokens, time: answer.timings.elapsedTime, type: "MONOLOG"});
          }catch(e){
            console.log(e);
            console.log("Timing logging failed!");
          }
  
          if(company.tokens - answer.data.tokens <= 0){
            company.tokens = 0;
          }else{
            company.tokens -= answer.data.tokens
          }

          let userusageidx = user.usedCredits.findIndex((val) => {return val.month == props.Data.currentMonth && val.year == props.Data.currentYear});
          if(userusageidx != -1){
            let usageupdates = user.usedCredits;
            usageupdates[userusageidx].amount += answer.data.tokens;
            await updateDoc(doc(db, "User", login.uid), { usedCredits: usageupdates});
          }else{
            let usageupdates = [];
            usageupdates.push({ month: props.Data.currentMonth, year: props.Data.currentYear, amount: answer.data.tokens });
            await updateDoc(doc(db, "User", login.uid), { usedCredits: usageupdates});
          }
        }
  
      }catch(e){
        console.log(e);
        setTokens("");
        setIsLoaderVisible(false);
        setPromptError(true);
      }
  
      setFormDisabled(false);
    }
    
  }

  const getProfiles = () => {
    let profileOptions =  user.profiles.map((singleProfile: Profile, idx: number) => {
      return {
        key: idx,
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
          <>
            <div className={styles.userinputform}>
              <Card title={"Eine neue E-Mail"} headStyle={{backgroundColor: "#F9FAFB"}} className={styles.userinputcardmain}>
                <Form.Item className={styles.formpart} label={<b>Profil</b>} name="profile">
                  <Select
                    showSearch
                    placeholder="Wähle ein Profil aus"
                    optionFilterProp="children"
                    onChange={(values: any) => {console.log(values)}}
                    onSearch={() => {}}
                    options={getProfiles()}
                    disabled={formDisabled || quotaOverused}
                    className={styles.formselect}
                    size='large'
                    />
                  </Form.Item>

                  <Form.Item className={styles.formpart} label={<b>Worum soll es in der E-Mail gehen?</b>} name="content">
                    <TextArea className={styles.forminput} rows={10} placeholder="Formuliere kurz den Inhalt der E-Mail?" disabled={formDisabled || quotaOverused}/>
                  </Form.Item>
              </Card>
              <Card title={"Einstellungen"} headStyle={{backgroundColor: "#F9FAFB"}} className={styles.userinputcardsub}>
                <Form.Item className={styles.formpart} label={<b>Ansprache</b>} name="address">
                    <Select placeholder="Bitte wähle die Form der Ansprache aus..." options={listToOptions(parameters.address)}
                    className={styles.formselect}
                    disabled={formDisabled || quotaOverused}
                    size='large'
                    />
                </Form.Item>

                <Form.Item className={styles.formpart} label={<b>Einordnung des Gesprächpartners</b>} name="order">
                    <Select placeholder="Wie ordnest du deinen Gesprächpartner ein?" options={listToOptions(parameters.motives)} mode="multiple" allowClear className={styles.formselect} size='large' disabled={formDisabled || quotaOverused}/>
                </Form.Item>

                <Form.Item className={styles.formpart} label={<b>Länge der Antwort</b>} name="length">
                  <Select placeholder="Wie lang soll die erzeuge Antwort sein?" options={listToOptions(parameters.lengths)} disabled={formDisabled || quotaOverused} className={styles.formselect} size='large'/>
                </Form.Item>
              </Card>
          </div>
          <div className={styles.formfootercontainer}>
            <div className={styles.tokenalert}>
              {
                (quotaOverused)? <Alert message={`Das Tokenbudget ist ausgeschöpft. Weitere Tokens, kannst du in der Kontoübersicht dazubuchen.`} type="error" />: <></>
              }
            </div>
            <div className={styles.generatebuttonrow}>
              <Button className={styles.submitbutton} htmlType='submit' type='primary' disabled={formDisabled || quotaOverused}>E-Mail generieren <Icon component={ArrowRight} className={styles.buttonicon} viewBox='0 0 20 20'/></Button>
            </div>
            
          </div>
          </>
        );
      }
    }
  }


  return (
    <>
      {contextHolder}
    <SidebarLayout capabilities={(role)? role.capabilities: {}} user={user} login={login}>
      <div className={styles.main}>
        <div className={styles.welcomemessage}>
          <h1>Willkommen zurück, {handleEmptyString(user.firstname)}</h1>
          <Divider className={styles.welcomeseperator} />
        </div>

        <div className={(!showAnswer)? styles.userinputformcontainer: styles.hiddencontainer} >
          <Form layout='vertical' onFinish={generateAnswer} onChange={() => {setIsAnswerCardvisible(false); setIsAnswerVisible(false); setIsLoaderVisible(false)}} form={form}>
            {getPrompt()}
          </Form>
        </div>
        <div className={(showAnswer)? styles.userinputformcontainer: styles.hiddencontainer} >
          <Card className={styles.answercard} title={"Antwort"} style={{ display: (isAnswerCardVisible)? 'block': 'none' }} headStyle={{backgroundColor: "#F9FAFB"}} extra={<div className={styles.clipboardextra} onClick={() => {navigator.clipboard.writeText(answer); messageApi.success("Antwort in die Zwischenablage kopiert.");}}><Icon component={Clipboard} className={styles.clipboardicon} viewBox='0 0 22 22' />In die Zwischenlage</div>}>
              {(isAnswerVisible)? <><div className={styles.answer}>{answer}</div><div className={styles.tokeninfo}><Icon component={Info} className={styles.infoicon} viewBox='0 0 22 22' /> Die Anfrage hat {tokens} Tokens verbraucht</div></>: <></>}
              {(isLoaderVisible)? <Skeleton active/>: <></>}
              {(promptError)? <Alert type='error' message="Bei der Generierung der Anfrage ist etwas schiefgelaufen. Bitte versuche es später erneut!" />: <></>}
          </Card>
          <div className={styles.formfootercontainer}>
            <div className={styles.generatebuttonrow}>
              <Button className={styles.backbutton} onClick={() => {setShowAnswer(false);}} type='primary'>Zurück <Icon component={ArrowRight} className={styles.buttonicon} viewBox='0 0 20 20'/></Button>
            </div>
          </div>
        </div>

        <style>
          {`span.ant-select-selection-placeholder{font-size: 14px !important; font-weight: normal !important}`}
        </style>
      </div>
    </SidebarLayout>
    </>
  )
}
