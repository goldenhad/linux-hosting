import { Alert, Button, Card, Form, Input, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import { SettingOutlined, DeleteOutlined } from '@ant-design/icons';
import styles from './list.profiles.module.scss'
import axios from 'axios';
import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { prisma } from '../../db'
import { CombinedUser } from '../../helper/LoginTypes';
import SidebarLayout from '../../components/SidebarLayout';
import { JsonObject } from '@prisma/client/runtime/library';
import { useRouter } from 'next/router';
const { Paragraph } = Typography;
const { TextArea } = Input;
import bcrypt from 'bcrypt';
import AES from 'crypto-js/aes';
import enc from 'crypto-js/enc-utf8';
import { useAuthContext } from '../../components/context/AuthContext';
import { Profile, ProfileSettings } from '../../firebase/types/Profile';
import getDocument from '../../firebase/data/getData';
import updateData from '../../firebase/data/updateData';
import { arrayUnion } from 'firebase/firestore';
require('dotenv').config();

const MAXPROFILES = 12;


export interface InitialProps {
  Data: { Profiles: Array<Profile & {parsedSettings: ProfileSettings}> };
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



export default function Profiles(props: InitialProps) {
    const { login, user, company, role, quota } = useAuthContext();
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
  
    const setEditFields = (obj: {name: String, settings: ProfileSettings}) => {
      editForm.setFieldValue("name", obj.name);
      editForm.setFieldValue("personal", obj.settings.personal);
      editForm.setFieldValue("address", obj.settings.salutation);
      editForm.setFieldValue("style", obj.settings.stil);
      editForm.setFieldValue("order", obj.settings.order);
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
            profiles[profileToEdit] = {name: values.name, settings: { personal: values.personal, salutation: values.address, stil: values.style, order: values.order, emotions: values.emotions, tags: values.tags }}
            await updateData("User", login.uid, { profiles: profiles })
            editForm.setFieldsValue([]);
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
        editForm.resetFields([]);
      }
    }
  
    const createProfile = async (values: any) => {
  
      if(values.name){
        try{

          await updateData("User", login.uid, { profiles: arrayUnion({name: values.name, settings: { personal: values.personal, salutation: values.address, stil: values.style, order: values.order, emotions: values.emotions, tags: values.tags }}) })
          form.setFieldsValue([]);
        }catch(e){
          setErrMsg("Beim Speichern ist etwas fehlgeschlagen bitte versuche es später erneut.");
          setIsErrVisible(true);
        }
    
        refreshData();
        setErrMsg("");
        setIsErrVisible(false);
        setIsCreateModalOpen(false);
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
                        <div onClick={() => {setProfileToEdit(idx); setIsEditModalOpen(true); setEditFields({name: singleProfile.name, settings: settings})}}><SettingOutlined key="setting" /></div>,
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

    return (
      <SidebarLayout capabilities={(role)? role.capabilities: {}}>
        <div className={styles.main}>
          <div className={styles.interactionrow}>
              <Button type='primary' onClick={() => {setIsCreateModalOpen(true)}} disabled={(user.profiles && user.profiles.length >= MAXPROFILES)}>+ Hinzufügen</Button>
          </div>
          <div className={styles.projecttable}>
            { getProfileDisplay() }
          </div>
  
          <Modal
            title="Profil hinzufügen"
            open={isCreateModalOpen}
            onCancel={() => {setIsCreateModalOpen(false)}}
            footer = {[]}
          >
            <Form 
                layout='vertical'
                onFinish={createProfile}
                form={form}
            >
                <Form.Item label={<b>Profilname</b>} name="name" rules={[{ required: true, message: 'Ein Name ist erforderlich!' }]}>
                    <Input placeholder="Names des Profils..."/>
                </Form.Item>
  
                <Form.Item label={<b>Persönliche Informationen</b>} name="personal">
                    <TextArea placeholder="Wer sind sie, beschreiben Sie ihre Position..."/>
                </Form.Item>
  
                <Form.Item label={<b>Ansprache</b>} name="address">
                    <Select placeholder="Bitte wählen Sie die Form der Ansprache aus..." options={[
                        {label: "Du", value: "du", },
                        {label: "Sie", value: "sie", },
                    ]}/>
                </Form.Item>

                <Form.Item label={<b>Allgemeine Stilistik</b>} name="style">
                    <Select placeholder="In welchem Stil soll geantwortet werden?" options={listToOptions(style)} mode="multiple" allowClear/>
                </Form.Item>

                <Form.Item label={<b>Einordnung des Gesprächpartners</b>} name="order">
                    <Select placeholder="Wie orden Sie ihren Gesprächpartner ein?" options={listToOptions(motive)} mode="multiple" allowClear/>
                </Form.Item>

                <Form.Item label={<b>Allgemeine Gemütslage</b>} name="emotions">
                    <Select placeholder="Wie ist ihre allgemeine Gemütslage zum bisherigen Mail-Dialog?" options={listToOptions(emotions)} mode="multiple" allowClear/>
                </Form.Item>

                <Form.Item label={<b>Tags</b>} name="tags">
                  <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    tokenSeparators={[',']}
                    options={[]}
                    placeholder={"Tippen Sie, um Tags hinzuzufügen, die Ihr Profil kategorisieren"}
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
                <Form.Item label={<b>Profilname</b>} name="name" rules={[{ required: true, message: 'Ein Name ist erforderlich!' }]}>
                    <Input placeholder="Names des Profils..."/>
                </Form.Item>
  
                <Form.Item label={<b>Persönliche Informationen</b>} name="personal">
                    <TextArea placeholder="Wer sind sie, beschreiben Sie ihre Position..."/>
                </Form.Item>
  
                <Form.Item label={<b>Ansprache</b>} name="address">
                    <Select placeholder="Bitte wählen Sie die Form der Ansprache aus..." options={[
                        {label: "Du", value: "du", },
                        {label: "Sie", value: "sie", },
                    ]}/>
                </Form.Item>

                <Form.Item label={<b>Allgemeine Stilistik</b>} name="style">
                    <Select placeholder="In welchem Stil soll geantwortet werden?" options={listToOptions(style)} mode="multiple" allowClear/>
                </Form.Item>

                <Form.Item label={<b>Einordnung des Gesprächpartners</b>} name="order">
                    <Select placeholder="Wie orden Sie ihren Gesprächpartner ein?" options={listToOptions(motive)} mode="multiple" allowClear/>
                </Form.Item>

                <Form.Item label={<b>Allgemeine Gemütslage</b>} name="emotions">
                    <Select placeholder="Wie ist ihre allgemeine Gemütslage zum bisherigen Mail-Dialog?" options={listToOptions(emotions)} mode="multiple" allowClear/>
                </Form.Item>

                <Form.Item label={<b>Tags {tokenCount}/4</b>} name="tags">
                  <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    tokenSeparators={[',']}
                    onChange={(value) => {setTokenCount(value.length); console.log(value)}}
                    options={[]}
                    maxTagCount={5}
                    placeholder={"Tippen Sie, um Tags hinzuzufügen, die Ihr Profil kategorisieren"}
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
            <Paragraph>Wollen sie das Profil {(profileToDelete != -1 && user.profiles[profileToDelete]) ? user.profiles[profileToDelete].name: "UNDEFINED"} wirklich löschen?</Paragraph>
  
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
  
