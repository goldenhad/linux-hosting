import { Alert, Button, Card, Form, Input, Modal, Select, Space, Steps, Table, Tag, Typography, message } from 'antd';
import { SettingOutlined, DeleteOutlined } from '@ant-design/icons';
import styles from './list.profiles.module.scss'
import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import SidebarLayout from '../../components/Sidebar/SidebarLayout';
import { useRouter } from 'next/router';
const { Paragraph } = Typography;
const { TextArea } = Input;
import { useAuthContext } from '../../components/context/AuthContext';
import { Profile, ProfileSettings } from '../../firebase/types/Profile';
import updateData from '../../firebase/data/updateData';
import { arrayUnion } from 'firebase/firestore';
import { handleEmptyArray, handleEmptyString } from '../../helper/architecture';
require('dotenv').config();

const MAXPROFILES = 12;


export interface InitialProps {
  Data: { Profiles: Array<Profile & {parsedSettings: ProfileSettings}> };
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



export default function Profiles(props: InitialProps) {
    const { login, user, company, role } = useAuthContext();
    const [ isCreateModalOpen, setIsCreateModalOpen ]  = useState(false);
    const [ isEditModalOpen, setIsEditModalOpen ]  = useState(false);
    const [ isDeleteModalOpen, setIsDeleteModalOpen ]  = useState(false);
    const [ errMsg, setErrMsg ] = useState("");
    const [ profileToDelete, setProfileToDelete ] = useState(-1);
    const [ profileToEdit, setProfileToEdit ] = useState(-1);
    const [ isErrVisible, setIsErrVisible ] = useState(false);
    const [ tokenCount, setTokenCount ] = useState(0);
    const [ form ] = Form.useForm();
    const [ editForm ] = Form.useForm();
    const [current, setCurrent] = useState(0);

    const router = useRouter();

  
    const refreshData = () => {
      router.replace(router.asPath);
    }

    useEffect(() => {

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
  
    const setEditFields = (obj: {name: String, settings: ProfileSettings}) => {
      console.log(obj.settings)
      editForm.setFieldValue("name", obj.name);
      editForm.setFieldValue("personal", obj.settings.personal);
      editForm.setFieldValue("style", obj.settings.stil);
      editForm.setFieldValue("emotions", obj.settings.emotions);
      editForm.setFieldValue("tags", obj.settings.tags);
      if(obj.settings.tags){
        setTokenCount(obj.settings.tags.length);
      }
    }
  
    const deleteProfile = async () => {
      setIsDeleteModalOpen(false);
      try{
        if ( profileToDelete != -1 ){
          let profiles = user.profiles;
          profiles.splice(profileToDelete, 1);

          await updateData("User", login.uid, { profiles: profiles })
          editForm.setFieldsValue([]);
        }else{
          throw("Profile not defined");
        }
      }catch(e){
        console.log(e);
        setErrMsg("Beim Löschen ist etwas fehlgeschlagen bitte versuche es später erneut.");
        setIsErrVisible(true);
      }
  
      setErrMsg("");
      setIsErrVisible(false);
      
      setProfileToDelete(-1);
      refreshData();
    } 
  
    const editProfile = async (values: any) => {
      if (values.name){
        try {
          if ( profileToEdit != -1 ){
            let profiles = user.profiles;
            profiles[profileToEdit] = {name: values.name, settings: { personal: handleEmptyString(values.personal), stil: handleEmptyArray(values.style), emotions: handleEmptyArray(values.emotions), tags: handleEmptyArray(values.tags) }}
            await updateData("User", login.uid, { profiles: profiles })
            form.resetFields([]);
          }else{
            throw("Profile not defined");
          }
        }catch(e){
          setErrMsg("Beim Bearbeiten ist etwas fehlgeschlagen bitte versuche es später erneut.");
          setIsErrVisible(true);
        }

        refreshData();
        setErrMsg("");
        setIsErrVisible(false);
        setIsEditModalOpen(false);
        form.resetFields([]);
      }
    }
  
    const createProfile = async (values: any) => {

      if(values.name){
        try{
          await updateData("User", login.uid, { profiles: arrayUnion({name: values.name, settings: { personal: handleEmptyString(values.personal), stil: handleEmptyArray(values.style), emotions: handleEmptyArray(values.emotions), tags: handleEmptyArray(values.tags) }}) })
          form.setFieldsValue([]);
          setIsCreateModalOpen(false);
        }catch(e){
          setErrMsg("Beim Speichern ist etwas fehlgeschlagen bitte versuche es später erneut.");
          setIsErrVisible(true);
          setIsCreateModalOpen(true);
        }
    
        refreshData();
        setErrMsg("");
        setIsErrVisible(false);
        form.resetFields([]);
      }
    }

    const getTags = (tags: Array<String>) => {
      if(tags){
        return tags.map((element, tagid) => {
          return(
            <Tag key={tagid}>{element}</Tag>
          );
        });
      }
    }
    
    const getProfileDisplay = () => {
      if(user.profiles && user.profiles.length > 0){
        return (
          <>
            <Space wrap={true}>
              { user.profiles.map((singleProfile: Profile, idx) => {
                
                let settings: ProfileSettings = singleProfile.settings;

                return (
                  <Card
                      key={idx}
                      style={{
                        width: 300,
                        marginTop: 16,
                      }}
                      actions={[
                        <div onClick={() => {setProfileToEdit(idx); setEditFields({name: singleProfile.name, settings: settings}); setIsEditModalOpen(true);}}><SettingOutlined key="setting" /></div>,
                        <div onClick={() => {setProfileToDelete(idx); setIsDeleteModalOpen(true)}}><DeleteOutlined key="edit" /></div>,
                      ]}
                    >
                      <div className={styles.profilecard}>
                        <div className={styles.profilecard_title}>{singleProfile.name}</div>
                        <div className={styles.profilecard_tags}>
                          { getTags(settings.tags)}
                        </div>
                      </div>
                  </Card>
                );
              }) }
            </Space>
            <div className={styles.profilecounter}>{user.profiles? user.profiles.length : 0} von 12 erstellt</div>
          </>
        );
      }else{
        return <div className={styles.profilesempty}><h3>Noch keine Profile definiert</h3></div>
      }
    }


    const steps = [
      {
        step: 1,
        title: 'Persönliche Informationen',
        content: <div>
          <Paragraph>
            Beschreiben kurz wer du bist.
          </Paragraph>
          <Form.Item className={styles.formpart} name="personal">
              <TextArea className={styles.forminput} placeholder="Wer bist du, beschreibe dich..."/>
          </Form.Item>
        </div>,
      },
      {
        step: 2,
        title: 'Allgemeine Stilistik',
        content: <div>
          <Paragraph>
            Wie genau soll die allgemeine Stilistik der Antwort sein?
          </Paragraph>
          <Form.Item className={styles.formpart} name="style">
              <Select className={styles.formselect} placeholder="In welchem Stil soll geantwortet werden?" options={listToOptions(style)} mode="multiple" allowClear/>
          </Form.Item>
        </div>,
      },
      {
        step: 3,
        title: 'Allgemeine Gemütslage',
        content: <div>
          <Paragraph>
            Welche allgemeine Gemütslage soll in der Nachricht deutlich werden?
          </Paragraph>
          <Form.Item className={styles.formpart} name="emotions">
              <Select className={styles.formselect} placeholder="Wie ist ihre allgemeine Gemütslage zum bisherigen Mail-Dialog?" options={listToOptions(emotions)} mode="multiple" allowClear/>
          </Form.Item>
        </div>,
      },
      {
        step: 4,
        title: 'Abschließen',
        content: <div>
          <Paragraph>
            In diesem Bereich kannst du deinem Profil einen Namen geben und es mit Tags kategorisieren.
          </Paragraph>
          <Form.Item className={styles.formpart} name="name" rules={[{ required: true, message: 'Ein Name ist erforderlich!' }]}>
            <Input className={styles.forminput} placeholder='Name des Profils'></Input>
          </Form.Item>
          <Paragraph>
            Kategorisiere dein Profil über Tags
          </Paragraph>
          <Form.Item className={styles.formpart} name="tags">
              <Select
                className={styles.formselect}
                mode="tags"
                style={{ width: '100%' }}
                tokenSeparators={[',']}
                options={[]}
                placeholder={"Tippe, um Tags hinzuzufügen, die das Profil kategorisieren"}
              />
          </Form.Item>
        </div>
      }
    ];

    const items = steps.map((item) => ({ key: item.title, title: item.title }));

    return (
      <SidebarLayout capabilities={(role)? role.capabilities: {}} user={user} login={login}>
        <div className={styles.main}>
          <div className={styles.interactionrow}>
              <Button type='primary' onClick={() => {setIsCreateModalOpen(true)}} disabled={(user.profiles && user.profiles.length >= MAXPROFILES)}>+ Hinzufügen</Button>
          </div>
          <div className={styles.projecttable}>
            { getProfileDisplay() }
          </div>
  
          
          <Modal
            title={"Ein neues Profil anlegen"}
            open={isCreateModalOpen}
            width={"70%"}
            onCancel={() => {setIsCreateModalOpen(false)}}
            footer = {[]}
          >
            <Form 
                layout='vertical'
                onFinish={createProfile}
                form={form}
            >
                <Steps current={current} items={items} />
                
                {steps.map((item) => (
                  <div
                    className={`${styles.stepformcontent} ${
                      item.step !== current + 1 && styles.hidden
                    }`}
                  >
                    {item.content}
                  </div>
                ))}


                <div style={{ marginTop: 24 }}>
                {current < steps.length - 1 && (
                  <Button type="primary" onClick={() => setCurrent(current + 1)}>
                    Weiter
                  </Button>
                )}
                {current === steps.length - 1 && (
                  <Button type="primary" htmlType='submit'>
                    Speichern
                  </Button>
                )}
                {current > 0 && (
                  <Button style={{ margin: '0 8px' }} onClick={() => setCurrent(current - 1)}>
                    Zurück
                  </Button>
                )}
              </div>                
  
                
              <div className={styles.errorrow} style={{display: (isErrVisible)? "block": "none"}}>
               <Alert type='error' message={errMsg} />
              </div>
  
            </Form>
          </Modal>
          

          <Modal
            title="Profil bearbeiten"
            open={isEditModalOpen}
            onCancel={() => {setIsEditModalOpen(false)}}
            footer = {[]}
          >
            <Form 
                layout='vertical'
                onFinish={editProfile}
                form={editForm}
            >
                <Form.Item className={styles.formpart} label={<b>Profilname</b>} name="name" rules={[{ required: true, message: 'Ein Name ist erforderlich!' }]}>
                    <Input className={styles.forminput}  placeholder="Names des Profils..."/>
                </Form.Item>
  
                <Form.Item className={styles.formpart} label={<b>Persönliche Informationen</b>} name="personal">
                    <TextArea className={styles.forminput} placeholder="Wer bist du, beschreibe dich..."/>
                </Form.Item>

                <Form.Item className={styles.formpart} label={<b>Allgemeine Stilistik</b>} name="style">
                    <Select className={styles.formselect} placeholder="In welchem Stil soll geantwortet werden?" options={listToOptions(style)} mode="multiple" allowClear/>
                </Form.Item>

                <Form.Item className={styles.formpart} label={<b>Allgemeine Gemütslage</b>} name="emotions">
                    <Select className={styles.formselect} placeholder="Wie ist deine allgemeine Gemütslage?" options={listToOptions(emotions)} mode="multiple" allowClear/>
                </Form.Item>

                <Form.Item className={styles.formpart} label={<b>Tags {tokenCount}/4</b>} name="tags">
                  <Select
                    className={styles.formselect}
                    mode="tags"
                    style={{ width: '100%' }}
                    tokenSeparators={[',']}
                    onChange={(value) => {setTokenCount(value.length); console.log(value)}}
                    options={[]}
                    maxTagCount={5}
                    placeholder={"Tippe, um Tags hinzuzufügen, die das Profil kategorisieren"}
                  />
                </Form.Item>
  
                
              <div className={styles.errorrow} style={{display: (isErrVisible)? "block": "none"}}>
               <Alert type='error' message={errMsg} />
              </div>
  
              <div className={styles.finishformrow}>
                <Button type='primary' htmlType='submit'>Speichern</Button>
              </div>
  
            </Form>
          </Modal>
  
          <Modal
            title="Profil Löschen"
            open={isDeleteModalOpen}
            onCancel={() => {setIsDeleteModalOpen(false)}}
            footer = {[]}
          >
            <Paragraph>Willst du das Profil {(profileToDelete != -1 && user.profiles[profileToDelete]) ? user.profiles[profileToDelete].name: "UNDEFINED"} wirklich löschen?</Paragraph>
  
            <div className={styles.finishformrow}>
                <Space direction='horizontal'>
                  <Button type='default' onClick={() => {setIsDeleteModalOpen(false)}}>Abbrechen</Button>
                  <Button type='primary' onClick={() => {deleteProfile()}}>Löschen</Button>
                </Space>
              </div>
          </Modal>
        </div>
      </SidebarLayout>
    )
  }
  
