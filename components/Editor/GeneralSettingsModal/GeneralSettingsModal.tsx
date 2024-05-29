import { Avatar, Button, Form, Input, List, message, Modal, Popover, Select, Upload } from "antd";
import styles from "./generalsettingsmodal.module.scss";
import UploadAssistantIcon from "../UploadAssistantIcon/UploadAssistantIcon";
import React, { useEffect, useState } from "react";
import { FileTextOutlined, InfoCircleOutlined, UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import updateData from "../../../firebase/data/updateData";
import { UploadProps } from "antd/es/upload";
import { AssistantState } from "../EditorSidebar/EditorSidebar";
import { getAssistantImageUrl } from "../../../firebase/drive/upload_file";

const { TextArea } = Input;


const MAXFILEUPLOADED = 5;

export default function GeneralSettingsModal(props: {
    open: boolean,
    setOpen: any,
    settForm: any,
    aid: string,
    messageApi: any,
    assistantState: AssistantState,
    setAssistantState: any,
    assistant: any
}) {
  const [ predefinedImage, setPredefinedImage ] = useState("");
  const [ uplaodedFiles, setUploadedFiles ] = useState(0);

  useEffect(() => {
    const loadAssistantImage = async () => {
      const url = await getAssistantImageUrl(props.aid);
      setPredefinedImage(url);
    }

    loadAssistantImage();
  }, []);
  
  const uploadprops: UploadProps = {
    name: "file",
    action: "/api/assistant/knowledge/upload",
    headers: {
      authorization: "authorization-text"
    },
    data: {
      aid: props.aid
    },
    async onChange(info) {
      if (info.file.status !== "uploading") {
        console.log(info.file, info.fileList);
        setUploadedFiles(uplaodedFiles + 1);
      }
      if (info.file.status === "done") {
        const knowledgeFiles = (props.assistantState.knowledgeFiles)? props.assistantState.knowledgeFiles: [];
        info.fileList.forEach((file) => {
          if(file.response.errorcode == 0){
            const fileRef = {
              name: "",
              nodes: []
            };
            fileRef.name = file.name;
            fileRef.nodes = file.response.message;

            knowledgeFiles.push(fileRef);
          }
        });

        const assState = { ...props.assistantState };
        assState.knowledgeFiles = knowledgeFiles;
        props.setAssistantState(assState);

        try{
          const updateReq = await updateData("Assistants", props.aid, { knowledgeFiles: knowledgeFiles });
          if(!updateReq.error){
            console.log(updateReq);
            message.success(`${info.file.name} wurde erfolgreich zur Wissensbasis hinzugefügt!`);
          }else{
            throw Error("Assistant could not be updated");
          }
        }catch (e){
          message.error(`Upload der Datei ${info.file.name} fehlgeschlagen!`);
        }
      } else if (info.file.status === "error") {
        message.error(`Upload der Datei ${info.file.name} fehlgeschlagen!`);
      }
    }
  };
  
  const KnowledgeButton = () => {
    const UploadButton = () => {
      return (
        <div className={styles.uploadcontainer}>
          <Upload disabled={uplaodedFiles >= MAXFILEUPLOADED} {...uploadprops} maxCount={MAXFILEUPLOADED} multiple={true} accept={".txt,.pdf,.md"}>
            <div className={styles.uploadbuttonrow}>
              <Button disabled={uplaodedFiles >= MAXFILEUPLOADED} className={styles.uploadbutton} icon={<UploadOutlined/>} type={"default"}>Dokumente hochladen</Button>
            </div>
          </Upload>
        </div>
      );

      
    };

    if (props.assistantState.knowledgeFiles?.length > 0){
      const knowledgeData = props.assistantState.knowledgeFiles.map((fileRef, idx) => {
        return {
          index: idx,
          title: fileRef.name,
          nodes: fileRef.nodes
        }
      });

      setUploadedFiles(props.assistantState.knowledgeFiles.length);

      return (
        <>
          <List
            itemLayout="horizontal"
            dataSource={knowledgeData}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button key={"del"} onClick={async () => {
                    const delReq = await axios.post("/api/assistant/knowledge/delete", { aid: props.aid, nodes: item.nodes });
                    if(delReq.status == 200){
                      const ass = props.assistant;
                      ass.knowledgeFiles.splice(item.index, 1);

                      console.log(item.index);
                      console.log(ass.knowledgeFiles)

                      try{
                        const updateReq = await updateData("Assistants", props.aid, ass);
                        if(!updateReq.error){
                          console.log(updateReq);

                          const assState = { ...props.assistantState }
                          assState.knowledgeFiles = ass.knowledgeFiles;
                          props.setAssistantState(assState);

                          props.messageApi.success("Dokument erfolgreich entfernt!");
                        }else{
                          throw Error("Assistant could not be updated");
                        }
                      }catch (e){
                        props.messageApi.error("Fehler beim Löschen des Dokuments! Bitte versuche es später erneut.")
                      }
                    }else{
                      props.messageApi.error("Fehler beim Löschen des Dokuments! Bitte versuche es später erneut.")
                    }
                  }} danger>Löschen</Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<FileTextOutlined />} />}
                  title={<b>{item.title}</b>}
                />
              </List.Item>
            )}
          />
          <UploadButton />
        </>
      );
    }else{
      return (
        <UploadButton />
      );
    }
  }
  
  
  return(
    <Modal
      width={"40%"}
      title="Einstellungen"
      open={props.open} onOk={() => {
        props.setOpen(true)
      }} onCancel={() => {
        props.setOpen(false)
      }}
      footer={<Button type={"primary"} onClick={() => props.setOpen(false)} >Fertig</Button>}
    >
      <Form form={props.settForm} layout={"vertical"}>
        <Form.Item label={<b>Assistant-Thumbnail</b>}>
          <div className={styles.assimage}>
            <UploadAssistantIcon
              aid={props.aid}
              imageUrl={predefinedImage}
              messageApi={props.messageApi}
            />
          </div>
        </Form.Item>

        <Form.Item initialValue={props.assistantState.category} name={"category"} label={<b>Kategorie</b>}>
          <Select
            placeholder={"Bitte wähle eine Kategorie"}
            options={[
              { value: "productivity", label: "Produktivität" },
              { value: "content", label: "Content-Erstellung" },
              { value: "other", label: "Sonstige" }
            ]} ></Select>
        </Form.Item>

        <Form.Item initialValue={props.assistantState.description} name={"description"} label={<b>Beschreibung</b>}>
          <TextArea rows={7} placeholder={"Beschreibe deinen Assistenten kurz"} />
        </Form.Item>



        <Form.Item name={"knowledgeupload"} label={
          <>
            <b>Wissensbasis {uplaodedFiles}/{MAXFILEUPLOADED}</b>
            <div className={styles.infoicon} >
              <Popover overlayClassName={styles.infopopup} showArrow={true} title={"Informationen zur Wissensbasis"} content={
                <div>
                  Siteware kann Dokumente einlesen, verarbeiten und als Kontext für deinen Assistenten bereitstellen.
                  Achte darauf die Daten ggf. so zu strukturieren, dass sie für die KI verständlich sind.
                  Darüber hinaus solltest du darauf achten, in der Wissensbasis keine sensiblen Daten zu speichern.
                  Diese könnten sonst durch die KI preisgegeben werden.
                </div>
              } >
                <InfoCircleOutlined />
              </Popover>
            </div>
          </>
        }>
          <KnowledgeButton />
        </Form.Item>
      </Form>
    </Modal>
  );
}