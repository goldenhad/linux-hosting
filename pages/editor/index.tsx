import { GetServerSideProps } from "next";
import EditorSidebar from "../../components/Editor/EditorSidebar/EditorSidebar";
import React, { Suspense, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import getDocument from "../../firebase/data/getData";
import Assistant from "../../firebase/types/Assistant";


export interface EditorContextState {
    assistant: Assistant
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const aid = ctx.query.aid;
  let Assistant = null;
  let AID = null;

  if(aid){
    const AssistantReq = await getDocument("Assistants", aid);
    const ass = AssistantReq.result;
    AID = aid;

    if(ass){
      Assistant = ass.data();
    }
  }

  return { props: {
    assistant: Assistant,
    aid: AID
  } }
}



export default function Editor({ assistant, aid }){
  const [assState, setAssState] = useState(null)
    
  const EditorCanvas = dynamic(
    () => {
      return import("../../components/Editor/EditorCanvas/EditorCanvas").then((res) => res);
    }
  );

  useEffect(() => {
    console.log(aid);
  }, []);
  

  return(
    <EditorSidebar assistant={assistant} aid={aid}>
      <div style={{ width: "100%", height: "100vh" }}>
        <Suspense fallback={<div>Loading...</div>}>
          <EditorCanvas />
        </Suspense>
      </div>
    </EditorSidebar>
  );
}