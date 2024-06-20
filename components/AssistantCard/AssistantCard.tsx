import { Badge, Button, Card, Dropdown, Modal, Space, Tooltip, Typography } from "antd";
import styles from "./assistantcard.module.scss";
import Icon, { CopyOutlined, DeleteOutlined, DownOutlined, EditOutlined } from "@ant-design/icons";
import Link from "next/link";
import type { MenuProps } from "antd";
import Play from "../../public/icons/play.svg";
import Heart from "../../public/icons/heart.svg";
import HeartFull from "../../public/icons/heartFull.svg";
import { useEffect, useState } from "react";
import { getAssistantImageUrl } from "../../firebase/drive/upload_file";
import { AssistantInputType, AssistantType, Block, FileReference, InputBlock } from "../../firebase/types/Assistant";
import deleteData from "../../firebase/data/deleteData";
import axios from "axios";
import { deleteAssistantImage } from "../../firebase/drive/delete";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import router from "next/router";

const { Paragraph } = Typography;

/**
 * Component using the Antd card component to present an assistant to the user
 * @param props.name Name of the assistant, used for fav-feature
 * @param props.image Link to the image of the assistant
 * @param props.title Title of the assistant
 * @param props.description Short explanatory text used to describe the assistants features
 * @param props.link Link to the assistant
 * @param props.fav Flag that indicates if the assistant is a favourite of the user
 * @param props.onFav Function to be called if the user favs this assistant
 * @param props.onDeFav Function to be called if the user defavs this assistant
 * @param props.onVideoClick Function to be called if the user clicks on the video button
 * @constructor
 */
const AssistantCard = ( props: {
    aid: string,
    name: string,
    image: string,
    title: string,
    description: string,
    link: string,
    fav?: boolean,
    ribbonText: string,
    onFav?: () => void,
    onDeFav?: () => void,
    onVideoClick?: () => void,
    canEdit: boolean,
    published: boolean,
    blocks: Array<Block | InputBlock>,
    knowledeFiles: Array<FileReference>,
    router: AppRouterInstance
  } ) => {
  const [image, setImage] = useState("/base.svg");
  const [ deleteModalOpen, setDeleteModalOpen ] = useState(false);

  /**
   * Effect to load the provided assistant image.
   * If no image was provided use the base svg image
   */
  useEffect(() => {
    const loadImage = async () => {
      const url = await getAssistantImageUrl(props.aid);
      if(url){
        setImage(url);
      }else{
        setImage("/base.svg")
      }
    }

    loadImage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const FavButton = () => {
    if(props.published){
      if(props.fav){
        return (
          <Icon
            component={HeartFull}
            onClick={props.onDeFav}
            data-favname={`${props.name}-fav`}
            className={`${styles.iconsvg} ${styles.active}`}
            viewBox='0 0 22 25'
          />
        );
      }else{
        return (
          <Icon
            component={Heart}
            onClick={props.onFav}
            className={styles.iconsvg}
            data-favname={`${props.name}-fav`}
            viewBox='0 0 22 25'
          />
        );
      }
    }
  }
  
  const AssistantLink = () => {
    let valid = false;

    if(props.blocks.length > 0){
      const inpBlock = props.blocks[0] as InputBlock;
      const isValidChat = inpBlock.type == AssistantType.CHAT;
      const isValidQaQ = inpBlock.type == AssistantType.QAA && inpBlock.inputColumns.length > 0 &&
              inpBlock.inputColumns.every((col) => {
                return col.title != undefined && col.inputs.every((inp) => {
                  if(inp.type != undefined ){
                    if(inp.type == AssistantInputType.SELECT){
                      return inp.key != undefined && inp.name != undefined && inp.options.every((opt) => {
                        return opt.key != undefined && opt.value != undefined;
                      });
                    }else{
                      return inp.key != undefined && inp.name != undefined;
                    }
                  }

                  return false;
                })
              });

      valid = isValidQaQ || isValidChat
    }

    if(valid){
      return (
        <Link href={props.link} attribute-assistantname={`${props.name}-link`}>
          <span className={styles.assistantlink}>Zum Agenten</span>
        </Link>
      );
    }else{
      return (
        <Tooltip title={"Die Konfiguration ist aktuell noch fehlerhaft!"}>
          <span className={styles.brokenassistantlink}>Zum Agenten</span>
        </Tooltip>
      );
    }
  }

  const deleteAssistant = async () => {
    console.log("attempting delete");
    const knowledgeExistsReq = await axios.get(`/api/assistant/knowledge/exists?aid=${props.aid}`);

    if(knowledgeExistsReq.data.message){
      try{
        if (props.knowledeFiles != undefined && props.knowledeFiles.length > 0){
          for(const file of props.knowledeFiles){
            await axios.post("/api/assistant/knowledge/delete", { aid: props.aid, nodes: file.nodes });
          }
        }

        const imagedelete = await deleteAssistantImage(props.aid);
        console.log(imagedelete);
        await deleteData("Assistants", props.aid);
        setDeleteModalOpen(false);
        props.router.refresh();
      }catch (e){
        console.error("Fehler beim löschen des Konfigurators! ");
        console.log(e);
      }
    }else{
      await deleteData("Assistants", props.aid);
      setDeleteModalOpen(false);
      props.router.refresh();
    }
  }

  const CardDropDownItems: MenuProps["items"] = [
    {
      key: "1",
      label: (<a href={`/editor?aid=${props.aid}`}>Bearbeiten</a>),
      icon: <EditOutlined/>
    },
    {
      key: "2",
      label: "Duplizieren",
      icon: <CopyOutlined />,
      onClick: async () => {
        console.log("cloning...")
        // Clone the data in the database
        const dataCloneReq = await axios.post("/api/assistant/clone", { aid: props.aid });

        if(dataCloneReq.status == 200){
          const existsReq = await axios.get(`/api/assistant/knowledge/exists?aid=${props.aid}`);
          if(existsReq.data.message){
            const newAid = dataCloneReq.data.message;

            // Clone the vector storage
            await axios.post("/api/assistant/knowledge/copy", { newAid: newAid, oldAid: props.aid });
          }
        }

        router.reload();
      }
    },
    {
      key: "3",
      label: "Löschen",
      icon: <DeleteOutlined/>,
      onClick: () => {
        setDeleteModalOpen(true);
      }
    }
  ];

  const EditDropdown = () => {
    if(props.canEdit){
      return(
        <Dropdown menu={{ items: CardDropDownItems }}>
          <a onClick={(e) => e.preventDefault()}>
            <Space>
              <DownOutlined />
            </Space>
          </a>
        </Dropdown>
      );
    }else{
      return <></>;
    }
  }

  const AssCard = () => {
    return (
      <div className={styles.servicebox}>
        <Card className={styles.servicecard} style={{ width: 300 }}>
          <div className={styles.serviceheadline}>
            <div className={styles.servicelogo}>
              {/* eslint-disable-next-line */}
              <img width={50} height={50} src={image} alt="logo" />
            </div>
            <div className={styles.servicetitle}>{props.title}</div>
          </div>
          <Paragraph className={styles.servicedescription} ellipsis={ { rows: 4, expandable: true, symbol: "..." }}>
            {props.description}
          </Paragraph>
        </Card>
        <div className={styles.servicefooter}>
          <div className={styles.actions}>
            <FavButton />
            <div onClick={props.onVideoClick} className={styles.videobuttoncontainer}>
              <Icon component={Play} className={styles.iconsvg} viewBox='0 0 22 22'/>
            </div>
            <EditDropdown />
          </div>
          <AssistantLink />
        </div>
        <Modal
          title="Agenten löschen?"
          open={deleteModalOpen}
          onOk={async () => {
            setDeleteModalOpen(false);
          }}
          footer={
            <div className={styles.deletemodalbuttons}>
              <Button onClick={() => {
                setDeleteModalOpen(false);
              }}>Abbrechen</Button>
              <Button danger onClick={async () => {
                deleteAssistant();
              }}>Löschen</Button>
            </div>
          }
          onCancel={() => {
            setDeleteModalOpen(false);
          }}>
          <Paragraph>Möchtest du den Agenten wirklich löschen?</Paragraph>
        </Modal>
      </div>
    );
  }


  if(props.ribbonText){
    return (
      <Badge.Ribbon text={props.ribbonText} color="red">
        <AssCard />
      </Badge.Ribbon>
    );
  }else{
    return <AssCard />
  }
}

export default AssistantCard;
