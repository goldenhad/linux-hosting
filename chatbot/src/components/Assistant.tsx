import React, { useEffect, useState } from "react";
import { Select, SelectProps } from "antd";
import Assistant, { AssistantType, InputBlock } from "Shared/Firebase/types/Assistant";
import ChatAssistant from "./ChatAssistant";

// Defines the max amount of history states saved per user
export const MAXHISTITEMS = 10;

// Defines how long antd messages will be visible
export const MSGDURATION = 3;

export default function AssistantContainer(props: { assistantsList: Assistant[] }) {
  const [formDisabled] = useState(false);
  const [historyState, setHistoryState] = useState([]);
  const [assistants, setAssistants] = useState<SelectProps["options"]>([]);
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(true);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    const assistantsList = props.assistantsList;
    if (assistantsList && assistantsList.length > 0) {
      const list = props.assistantsList.map((assistant) => ({ value: assistant.uid, label: assistant.name }));
      setAssistants(list);
    }
  }, [props.assistantsList])

  const getAssistantForm = () => {

    if (selectedAssistant == null)
      return null;

    switch ((selectedAssistant.blocks[0] as InputBlock).type) {
    case AssistantType.CHAT: {
      return <ChatAssistant
        assistant={selectedAssistant}
        formDisabled={formDisabled}
        history={{ state: historyState, set: setHistoryState }}
      />;
    }
    default: return null;
    }
}

  const onAssistantSelect: SelectProps["onChange"] = (value: any) => {
    const { assistantsList } = props;

    const assistant = assistantsList.find((assistant) => assistant.uid === value);
    setSelectedAssistant(assistant as Assistant);
  };


  return (
    <div>
      <div style={{ color: "green" }}>Please Select a chatbot to get Answers from first</div>
      {!selectedAssistant && <Select
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
