import axios from "axios";
import "./style.scss"
import React, { PropsWithChildren, useEffect, useState } from "react";
import { InputBlock } from "Shared/Firebase/types/Assistant";
import AssistantForm from "./components/Assistant";
import Assistant  from "Shared/Firebase/types/Assistant";
import { default as upwardImage } from "../../public/upward-arrow.svg";
import { default as chatbotImage } from "../../public/chat-bot.png";
import { default as expandImage } from "../../public/fullscreen.png";
import { default as crossImage } from "../../public/close.png";

interface IProps {
  // props you want to pass to the component other than the children
}

const App: React.FC<PropsWithChildren<IProps>> = () => {

  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [isMinimisedToIcon, setIsMinimisedToIcon] = useState(true);

  useEffect(() => {
    const getAllAssistants = async () => {
      const data = await axios.get("/api/assistant/getAll")

      const { message: assistantsList, errorcode } = data.data;
      const { AGENTID } = window.SITEWARE_CONFIG || {};
      const assistant: Assistant | null = assistantsList.find((item: Assistant )=> item.uid === AGENTID)
      console.log("assistant, AGENTID===>", assistant, AGENTID);
      if(assistant){
        setAssistants([assistant]);
      }else if (assistantsList && assistantsList.length > 0) {
        setAssistants(assistantsList);
      }
    }

    getAllAssistants()
  }, [])

  const handleExpand = () => {
    setExpanded(!expanded);

  }

  const minimsedHandle = () => {
    setIsMinimisedToIcon(!isMinimisedToIcon);
    setExpanded(false)
  }

  console.log("assistants.length", assistants.length);
  return (
    <>
      <div className={`${isMinimisedToIcon ? 'expand-icon' : 'd-none'}`} onClick={minimsedHandle}><img src={chatbotImage} /></div>
      <div className={`${isMinimisedToIcon ? 'd-none' : 'minimise-icon-show'}`}>
        <div className={`${expanded ? 'fixed-chat-expanded' : 'fixed-chat'} `}>
        <div className="d-flex icon-position" style={{justifyContent: "flex-end"}}>
            <div onClick={handleExpand}>
            <img src={expandImage} className="expand-icon-img" style={{padding: '0px 10px 0px 0px'}}/>
            </div>
            <div onClick={minimsedHandle}>
              
            <img src={crossImage} className="cross-icon-img" /></div>

          </div>
        <div className="container">
          
          {
            !!assistants.length && <AssistantForm assistantsList={assistants} />
          }
        </div>
        </div>
      </div>
    </>
  )
}

export default App;
