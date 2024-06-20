import { GetServerSideProps } from "next";
import EditorSidebar from "../../components/Editor/EditorSidebar/EditorSidebar";
import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import getDocument from "../../firebase/data/getData";
import Assistant, { Block, InputBlock, Visibility } from "../../firebase/types/Assistant";
import { addDataWithoutId } from "../../firebase/data/setData";
import { auth } from "../../firebase/admin";


export interface EditorContextState {
    assistant: Assistant
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const aid = ctx.query.aid;
  let Assistant = null;
  let AID = null;

  const token = await auth.verifyIdToken( ctx.req.cookies.token );

  if(token){
    const userid = token.uid;
    const userreq = await getDocument("User", userid);

    if(userreq.result){
      const userrepresentation = userreq.result.data();
      if(userrepresentation){
        if(userrepresentation.Role == "Superadmin" || userrepresentation.Role == "Marketing"){
          if(aid){
            const AssistantReq = await getDocument("Assistants", aid);
            const ass = AssistantReq.result;
            AID = aid;

            if(ass){
              Assistant = ass.data();
            }
          }else{
            const assistantToCreate = {
              name: "Neuer Assistent",
              image: "",
              category: "other",
              description: "",
              video: "",
              published: false,
              uid: "",
              owner: userrepresentation.Company,
              visibility: Visibility.PRIVATE,
              selectedCompanies: [],
              blocks: Array<Block | InputBlock>()
            }
            const createReq = await addDataWithoutId("Assistants", assistantToCreate);

            if(createReq.error){
              console.log(createReq.error.toString());
            }else{
              return {
                redirect: {
                  permanent: false,
                  destination: `/editor?aid=${createReq.result.id}`
                }
              }
            }
          }

          return { props: {
            assistant: Assistant,
            aid: AID
          } }
        }
      }
    }
  }

  return {
    redirect: {
      permanent: false,
      destination: "/"
    }
  }
  
}



export default function Editor({ assistant, aid }){
  const EditorCanvas = dynamic(
    () => {
      return import("../../components/Editor/EditorCanvas/EditorCanvas").then((res) => res);
    }
  );
  

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