import { Card, Button, Form, Input, Select, Checkbox, Divider, Skeleton, Space, Alert, Typography, Tooltip } from 'antd';
import styles from './index.module.scss'
import { InfoCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useState } from 'react';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { CombinedUser } from '../helper/LoginTypes';
import SidebarLayout from '../components/SidebarLayout';
import { Prisma } from '@prisma/client';
import { Capabilities } from '../helper/capabilities';
import { JsonObject } from '@prisma/client/runtime/library';
const { Paragraph } = Typography;
const { TextArea } = Input;



export interface InitialProps {
  Data: {
    currentMonth: number,
    currentYear: number
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

      return {
          props: {
              InitialState: JSON.parse(
              Buffer.from(cookies.login, "base64").toString("ascii")
              ),
              Data: {
                currentMonth: datum.getMonth() + 1,
                currentYear: datum.getFullYear(),
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
  const [ tokens, setTokens ] = useState("");

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
    
    try{
      setFormDisabled(true);
      setIsAnswerCardvisible(true);
      setIsLoaderVisible(true);
      setIsAnswerVisible(false);
      setTokens("");

      let answer = await axios.post('/api/prompt/generate', {
        personal: values.personal,
        dialog: values.dialog,
        continue: values.continue,
        address: values.address,
        style: values.style,
        order: values.order,
        emotions: values.emotions,
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
          await axios.put(`/api/tokens/${props.InitialState.project.id}`, {
            amount: answer.data.tokens,
            month: props.Data.currentMonth,
            year: props.Data.currentYear
          });
        }
      }

      console.log(answer);
    }catch(e){
      console.log(e);
      setTokens("");
    }

    setFormDisabled(false);
  }

  return (
    <SidebarLayout capabilities={props.InitialState.role.capabilities as JsonObject}>
      <main className={styles.main}>
        <Space direction='vertical' size={"large"}>
          <Form layout='vertical' onFinish={generateAnswer} onChange={() => {setIsAnswerCardvisible(false); setIsAnswerVisible(false); setIsLoaderVisible(false)}} form={form}>
            <div className={styles.mrow}>
              <div className={styles.mcol}>
                <Card title={"Verlauf"}>
                  <Form.Item label={<b>Persönliche Informationen</b>} name="personal">
                    <TextArea placeholder="Wer sind sie, beschreiben Sie ihre Position..." disabled={formDisabled}/>
                  </Form.Item>

                  <Form.Item label={<b>Bisheriger Dialog</b>} name="dialog">
                    <TextArea rows={10} placeholder="Bisheriger Dialog..." disabled={formDisabled}/>
                  </Form.Item>

                  <Form.Item label={<b>Wie soll der Dialog fortgesetzt werden?</b>} name="continue">
                    <TextArea rows={5} placeholder="Formulieren Sie kurz, wie der Dialog fortgesetzt werden soll und was sie damit erreichen wollen?" disabled={formDisabled}/>
                  </Form.Item>

                  <div className={styles.submitrow}>
                    <Button className={styles.submitbutton} htmlType='submit' type='primary' disabled={formDisabled}>Antwort generieren</Button>

                  </div>
                </Card>
              </div>

              <div className={styles.mcol}>
                <Card title={"Einstellungen"}>
                  <Form.Item label={<b>Ansprache</b>} name="address">
                    <Select placeholder="Bitte wählen Sie die Form der Ansprache aus..." options={[
                      {label: "Du", value: "du", },
                      {label: "Sie", value: "sie", },
                    ]} disabled={formDisabled} />
                  </Form.Item>

                  <Form.Item label={<b>Allgemeine Stilistik</b>} name="style">
                    <Select placeholder="In welchem Stil soll geantwortet werden?" options={listToOptions(style)} mode="multiple" allowClear disabled={formDisabled}/>
                  </Form.Item>

                  <Form.Item label={<b>Einordnung des Gesprächpartners</b>} name="order">
                    <Select placeholder="Wie orden Sie ihren Gesprächpartner ein?" options={listToOptions(motive)} mode="multiple" allowClear disabled={formDisabled}/>
                  </Form.Item>

                  <Form.Item label={<b>Allgemeine Gemütslage</b>} name="emotions">
                    <Select placeholder="Wie ist ihre allgemeine Gemütslage zum bisherigen Mail-Dialog?" options={listToOptions(emotions)} mode="multiple" allowClear disabled={formDisabled}/>
                  </Form.Item>

                  <Form.Item label={<b>Länge der Antwort</b>} name="length">
                    <Select placeholder="Wie lang soll die erzeuge Antwort sein?" options={listToOptions(lengths)} disabled={formDisabled}/>
                  </Form.Item>
                </Card>
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
