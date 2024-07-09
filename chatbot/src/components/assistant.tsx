import React, { useState } from "react";
import { Typography } from "antd";
import Assistant, { AssistantType, InputBlock } from "Shared/Firebase/types/Assistant";
import ChatAssistant from "./ChatAssistant";

// Defines the max amount of history states saved per user
export const MAXHISTITEMS = 10;

// Defines how long antd messages will be visible
export const MSGDURATION = 3;

const { Paragraph } = Typography;


export default function(props: { assistant: Assistant }) {

  const [ formDisabled] = useState( false );
  const [ historyState, setHistoryState ] = useState([]);

  
  const getAssistantForm = () => {
    console.log((props.assistant.blocks[0] as InputBlock).type);

    switch ((props.assistant.blocks[0] as InputBlock).type){
        case AssistantType.CHAT:
        return <ChatAssistant
            assistant={props.assistant}
            formDisabled={formDisabled}
            history={{ state: historyState, set: setHistoryState }}
        />;
        default: return null;
    }
  }


  return(
      <div>
        {getAssistantForm()}
      </div>
  );
}
