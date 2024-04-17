import { COMPONENT_POSITIONS, ReactInfiniteCanvas, ReactInfiniteCanvasHandle } from "react-infinite-canvas";
import { useEffect, useRef, useState } from "react";
import styles from "./editorcanvas.module.scss";
import { FloatButton } from "antd";
import { HomeOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { DndContext, DragOverlay, useDroppable } from "@dnd-kit/core";
import { useEditorContext } from "../EditorSidebar/EditorSidebar";
import {
  restrictToWindowEdges
} from "@dnd-kit/modifiers";
import EditorBlock from "../EditorBlock/EditorBlock";

export default function EditorCanvas() {
  const canvasRef = useRef<ReactInfiniteCanvasHandle>();
  const { isOver, setNodeRef } = useDroppable({
    id: "droppable"
  });
  const { activeId } = useEditorContext();
  const [ buldingBricks, setBuldingBricks ] = useState<Array<{ name: string }>>([ { name: "Neuer Block" } ])



  useEffect(() => {
    if(activeId){
      const localbricks = [...buldingBricks];
      localbricks.push({ name: activeId.toString() });
      setBuldingBricks(localbricks);
    }
  }, [activeId]);

  return (
    <div className={styles.canvascontainer}>
      <ReactInfiniteCanvas
        ref={canvasRef}
        onCanvasMount={(mountFunc: ReactInfiniteCanvasHandle) => {
          mountFunc.fitContentToView({ scale: 2 });
        }}
        panOnScroll={false}
        customComponents={[
          
        ]}
        renderScrollBar={false}
        minZoom={2}
        maxZoom={2}
      >
        {/*<div className={styles.buildingblock}>
              Neuer Block
        </div>*/}
        {/*<DragOverlay dropAnimation={{
          duration: 500,
          easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)"
        }} modifiers={[restrictToWindowEdges]}>
          {activeId ? (
            <BuildingblockWrapper />
          ): null}
        </DragOverlay>*/}
        <>
          {buldingBricks.map((brick, idx) => {


            return(<EditorBlock key={idx} name={brick.name} />);
          })}
        </>
      </ReactInfiniteCanvas>
      <FloatButton.Group shape="square" style={{ right: 24 }}>
        <FloatButton icon={<HomeOutlined />} onClick={() => {
          canvasRef.current?.fitContentToView({ scale: 2 });
        }} />
      </FloatButton.Group>
    </div>
  );
}