import { Form, TourProps } from "antd";
import { useRef } from "react";
import { useAuthContext } from "../../../components/context/AuthContext";
import { Profile } from "../../../firebase/types/Profile";
import updateData from "../../../firebase/data/updateData";
import AssistantBase from "../../../components/AssistantBase/AssistantBase";
import { handleUndefinedTour } from "../../../helper/architecture";
import ExcelForm from "../../../components/AssistantForms/ExcelForm/Excelform";
import { Templates } from "../../../firebase/types/Settings";
import { parseExcelPrompt } from "../../../helper/prompt";


const excelBasicState = {
  profile: "",
  question: ""
}


export default function Dialogue( ) {
  const context = useAuthContext();
  const { role, login, user, company } = context;
  const [ form ] = Form.useForm();

  const profileRef = useRef( null );
  const generateRef = useRef( null );
  const questionRef = useRef( null );

  const steps: TourProps["steps"] = [
    {
      title: "Excel Hilfe",
      description: "Das \"Excel-Hilfe\"-Feature von Siteware business bietet dir eine persönliche und zielgerichtete Unterstützung"+
      " für alle deine Anliegen rund um Microsoft Excel. Egal, ob du eine spezifische Frage hast, Hilfe bei komplexen Formeln benötigst"+
      " oder Unterstützung bei der Datenaufbereitung suchst, dieses Feature steht dir zur Seite. Du kannst deine Fragen eingeben"+
      " und erhältst maßgeschneiderte Antworten und Anleitungen, die genau auf deine Bedürfnisse und dein aktuelles Problem zugeschnitten"+
      " sind.",
      nextButtonProps: {
        children: (
          "Weiter"
        )
      },
      prevButtonProps: {
        children: (
          "Zurück"
        )
      }
    },
    {
      title: "Wer stellt die Frage?",
      description: "Hier hast du die Möglichkeit, ein Profil auszuwählen, das die Persönlichkeit widerspiegelt, "+
      "die die Frage stellt. Bei deinem ersten Login habe ich bereits ein Hauptprofil für dich angelegt. "+
      "Falls du weitere Profile anlegen oder dein Hauptprofil bearbeiten möchtest, kannst du dies direkt in der Seitenleiste unter dem Punkt \"Profil\" tun.",
      target: () => profileRef.current,
      nextButtonProps: {
        children: (
          "Weiter"
        )
      },
      prevButtonProps: {
        children: (
          "Zurück"
        )
      }
    },
    {
      title: "Wie lautet deine Frage?",
      description: "In diesem Eingabefeld kannst du deine Frage zu Microsoft Excel stellen."+
      " Egal ob es um Formeln, Funktionen, Tabellengestaltung oder Datenanalyse geht – gib einfach dein Anliegen"+
      " ein und erhalte maßgeschneiderte Anleitungen und Antworten, die speziell auf dich und deine Bedürfnisse zugeschnitten sind.",
      target: () => questionRef.current,
      nextButtonProps: {
        children: (
          "Weiter"
        )
      },
      prevButtonProps: {
        children: (
          "Zurück"
        )
      }
    },
    {
      title: "Alles bereit",
      description: "Durch Klicken auf den \"Antwort generieren\"-Button wird nach einer kurzen Wartezeit eine Antwort erzeugt. "+
      "Bitte bedenke, dass wir deine Eingaben noch verarbeiten müssen, wodurch es gegebenenfalls zu kurzen Wartezeiten kommen kann.",
      target: () => generateRef.current,
      nextButtonProps: {
        children: (
          "Alles klar"
        ),
        onClick: async () => {
          const currstate = user.tour;
          currstate.dialog = true;
          updateData( "User", login.uid, { tour: currstate } )
        }
      },
      prevButtonProps: {
        children: (
          "Zurück"
        )
      }
    }
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const promptFunction = (values: Record<string, any>, profile: Profile, templates: Templates) => {
    let companyinfo = "";
    if( role.isCompany ){
      companyinfo = `Ich arbeite für ${company.name}. Wir beschäftigen uns mit: ${company.settings.background}`;
    }

    const cleanedQuestion = values.question.replace(/(<~).+?(~>)/gm, "");

    const promptdata = {
      name: user.firstname + " " + user.lastname,
      personal: profile.settings.personal,
      company: companyinfo,
      question: cleanedQuestion
    }

    const prompt = parseExcelPrompt(
      templates.excel,
      promptdata.name,
      promptdata.company,
      promptdata.personal,
      promptdata.question
    );

    return { data: promptdata, prompt: prompt };
  }

  return(
    <AssistantBase
      context={context}
      name={"Excel Hilfe"}
      laststate={"excel"}
      basicState={excelBasicState}
      Tour={steps}
      form={form}
      promptFunction={promptFunction}
      routes={ { generate: "/api/prompt/excel/generate" } }
      tourState={!handleUndefinedTour( user.tour ).excel}

    >
      <ExcelForm form={form} state={context} refs={{
        profileRef,
        questionRef,
        generateRef
      }}/>
    </AssistantBase>
  );
}
