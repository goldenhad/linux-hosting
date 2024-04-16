import { COMPONENT_POSITIONS, ReactInfiniteCanvas, ReactInfiniteCanvasHandle } from "react-infinite-canvas";
import {useRef, useState} from "react";
import styles from "./editorcanvas.module.scss";
import { FloatButton } from "antd";
import { HomeOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { DndContext, useDroppable } from "@dnd-kit/core";


export default function EditorCanvas() {
  const canvasRef = useRef<ReactInfiniteCanvasHandle>();

  const BuildingblockWrapper = () => {
    return (
      <div className={styles.buildingblock} style={{ top: 200 }}>
              Neuer Baustein
      </div>
    );
  }


  function Droppable(props) {
    const { isOver, setNodeRef } = useDroppable({
      id: props.id
    });
    const style = {
      opacity: isOver ? 1 : 0.5
    };

    return (
      <div ref={setNodeRef} style={style}>
        {props.children}
      </div>
    );
  }

  return (
    <div className={styles.canvascontainer}>
      <ReactInfiniteCanvas
        ref={canvasRef}
        onCanvasMount={(mountFunc: ReactInfiniteCanvasHandle) => {
          mountFunc.fitContentToView({ scale: 2 });
        }}
        customComponents={[
          
        ]}
        renderScrollBar={false}
      >
          <div className={styles.buildingblock}>
              Neuer Block
          </div>
      </ReactInfiniteCanvas>
      <FloatButton.Group shape="square" style={{ right: 24 }}>
        <FloatButton icon={<HomeOutlined />} onClick={() => {
          canvasRef.current?.fitContentToView({ scale: 2 });
        }} />
        <FloatButton />
        <FloatButton.BackTop visibilityHeight={0} />
      </FloatButton.Group>
    </div>
  );
}