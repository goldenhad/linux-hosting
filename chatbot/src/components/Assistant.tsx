import React, { useEffect, useState } from "react";
import { Typography, MenuProps, Select, SelectProps } from "antd";
import Assistant, { AssistantType, InputBlock } from "Shared/Firebase/types/Assistant";
import ChatAssistant from "./ChatAssistant";

// Defines the max amount of history states saved per user
export const MAXHISTITEMS = 10;

// Defines how long antd messages will be visible
export const MSGDURATION = 3;

const { Paragraph } = Typography;


export default function(props: { assistantsList: Assistant[] }) {
  const [ formDisabled] = useState( false );
  const [ historyState, setHistoryState ] = useState([]);
  const [assistants, setAssistants] = useState<SelectProps['options']>([]);
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null);

  useEffect(()=>{
    let { assistantsList } = props;
    if(assistantsList && assistantsList.length > 0){
      let list = props.assistantsList.map((assistant)=> ({ value: assistant.uid, label: assistant.name }));
      setAssistants(list);
    }
  }, [ props.assistantsList ])

  const getAssistantForm = () => {

    if(selectedAssistant == null) 
      return null;

    switch ((selectedAssistant.blocks[0] as InputBlock).type){
        case AssistantType.CHAT:
        return <ChatAssistant
            assistant={selectedAssistant}
            formDisabled={formDisabled}
            history={{ state: historyState, set: setHistoryState }}
        />;
        default: return null;
    }
  }

  const onAssistantSelect: SelectProps['onChange'] = (value: any) => {
    let { assistantsList } = props;
    
    let assistant = assistantsList.find(assistant=> assistant.uid === value);
    setSelectedAssistant(assistant as Assistant);
  };


  return(
      <div>
        <div style={{color: 'green'}}>Please Select a chatbot to get Answers from first</div>
        { !selectedAssistant && <Select
          showSearch
          placeholder="Select a Chatbot"
          optionFilterProp="label"
          onChange={onAssistantSelect}
          options={assistants}
        />}
        {getAssistantForm()}
      </div>
  );
}
