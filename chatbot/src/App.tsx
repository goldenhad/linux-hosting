import axios from 'axios';
import './style.scss'
import React, { PropsWithChildren, useEffect, useState } from 'react';
import { InputBlock } from 'Shared/Firebase/types/Assistant';
import Assistant from "./components/Assistant";
import { default as upwardImage } from "../../public/upward-arrow.svg";

interface IProps {
    // props you want to pass to the component other than the children
}

const App: React.FC<PropsWithChildren<IProps>> = () => {

  const [assistants, setAssistants] = useState([]);

  useEffect(()=>{
    const getAllAssistants = async ()=>{
      const data = await axios.get("/api/assistant/getAll")

      let { message: assistantsList, errorcode } = data.data;

      if(assistantsList && assistantsList.length > 0){
        setAssistants(assistantsList);
      }
    }

    getAllAssistants()
  }, [])
  return <div className="fixed-chat">
        <div className="container">
          <div className="arrowup">
            <img src={upwardImage} />
          </div>
          {
            !!assistants.length && <Assistant assistantsList={assistants} />
          }
        </div>
      </div>
}

export default App;
