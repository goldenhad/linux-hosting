import { Button, Form, Input } from "antd";
import { Document, VectorStoreIndex } from "llamaindex";
import axios from "axios";
import { useState } from "react";

export default function LLamaTest() {
  const [ response, setResponse ] = useState("")
  const [ question, setQuestion ] = useState("");

  const query = async (values) => {
    await axios.post("/api/llama/query", { query: values.question, aid: "123" },  { onDownloadProgress: async (progressEvent) => {
      const dataChunk: string = progressEvent.event?.currentTarget.response;
      setResponse(dataChunk + "...");

    } });
  }

    
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <Form onFinish={(values) => { query(values) }}>
        <Form.Item name={"question"}>
          <Input placeholder={"deine Frage..."}></Input>
        </Form.Item>
          <Button htmlType={"submit"} >Query</Button>
      </Form>
      <code>
        {response}
      </code>
    </div>
  )
}