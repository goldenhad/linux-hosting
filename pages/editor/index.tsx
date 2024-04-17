import { GetServerSideProps } from "next";
import EditorSidebar from "../../components/EditorSidebar/EditorSidebar";
import { COMPONENT_POSITIONS, ReactInfiniteCanvas, ReactInfiniteCanvasHandle } from "react-infinite-canvas";
import { Suspense, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { FloatButton } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";


export const getServerSideProps: GetServerSideProps = async (ctx) => {
  return { props: {} }
}

export default function Editor(){
    
  const EditorCanvas = dynamic(
    () => {
      return import("../../components/EditorCanvas/EditorCanvas").then((res) => res);
    }
  );  

  return(
    <EditorSidebar>
      <div style={{ width: "100%", height: "100vh" }}>
        <Suspense fallback={<div>Loading...</div>}>
          <EditorCanvas />
        </Suspense>
      </div>
    </EditorSidebar>
  );
}