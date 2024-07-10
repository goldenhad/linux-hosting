import axios from 'axios';
import './style.scss'
import React, { PropsWithChildren, useEffect, useState } from 'react';
import { InputBlock } from 'Shared/Firebase/types/Assistant';
import Assistant from "./components/assistant"

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
        {/* <div className="container">
          <div className="arrowup">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path style={{"fill": "#fff"}} d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"/></svg>
          </div>
          <div className="content">
            <div className="message">
              <p>Technische Mängel in der Mobilversion, unzureichende Kommunikation und Reaktionszeiten, sowie mangelhafte Qualitätskontrolle. Technische Mängel in der Mobilversion.</p>
              <div className="time time-right">19:51</div>
            </div>
            <div className="message-small">
              <p># Protokoll: Feedbackgespräch zum Projekt GoLive<br/>
              ## Grundlegende Informationen</p>
              <ul>
                <li>Datum: 24.05.2024</li>
                <li>Uhrzeit: 12:30 Uhr</li>
                <li>Teilnehmer:
                <li>Testperson (TP)</li>
                <li>Testperson 2 (TP2)</li>
                </li>
              </ul>
              <p>### Unzufriedenheit mit dem GoLive</p>
              <ul>
                <li>TP2 äußert Unzufriedenheit:
                <li>Verschiedene technische Probleme wurden angesprochen, darunter nicht funktionierende Links, Probleme mit der Darstellung auf Smartphones und fehlende oder verspätete Rückmeldungen auf Anfragen und Fehlerberichte.</li>
                </li>
              </ul>
              <div className="time time-left">19:52</div>
            </div>
            <div className="message">
              <p>Technische Mängel in der Mobilversion, unzureichende Kommunikation und Reaktionszeiten, sowie mangelhafte Qualitätskontrolle.</p>
              <div className="time time-right">19:51</div>
            </div>
            <div className="message-small">
              <p># Protokoll: Feedbackgespräch zum Projekt GoLive<br/>
              ## Grundlegende Informationen</p>
            </div>
            <div className="message">
              <p>Technische Mängel in der Mobilversion, unzureichende Kommunikation und Reaktionszeiten, sowie mangelhafte Qualitätskontrolle. Technische Mängel in der Mobilversion.</p>
              <div className="time time-right">19:51</div>
            </div>
            <div className="message-small">
              <p># Protokoll: Feedbackgespräch zum Projekt GoLive<br/>
              ## Grundlegende Informationen</p>
              <ul>
                <li>Datum: 24.05.2024</li>
                <li>Uhrzeit: 12:30 Uhr</li>
                <li>Teilnehmer:
                <li>Testperson (TP)</li>
                <li>Testperson 2 (TP2)</li>
                </li>
              </ul>
              <p>### Unzufriedenheit mit dem GoLive</p>
              <ul>
                <li>TP2 äußert Unzufriedenheit:
                <li>Verschiedene technische Probleme wurden angesprochen, darunter nicht funktionierende Links, Probleme mit der Darstellung auf Smartphones und fehlende oder verspätete Rückmeldungen auf Anfragen und Fehlerberichte.</li>
                </li>
              </ul>
              <div className="time time-left">19:52</div>
            </div>
            <div className="message">
              <p>Technische Mängel in der Mobilversion, unzureichende Kommunikation und Reaktionszeiten, sowie mangelhafte Qualitätskontrolle.</p>
              <div className="time time-right">19:51</div>
            </div>
          </div>
          <div className="chat-input">
            <input type="text" placeholder="type here..." />
          </div>
        </div>
        <div className="sidebar">
          Service Dashboard
        </div> */}
        {
          assistants.length && <Assistant assistantsList={assistants} />
        }
      </div>
}

export default App;
