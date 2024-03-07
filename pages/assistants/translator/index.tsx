import { Form, TourProps } from "antd";
import { useRef } from "react";
import { useAuthContext } from "../../../components/context/AuthContext";
import { Profile } from "../../../firebase/types/Profile";
import updateData from "../../../firebase/data/updateData";
import AssistantBase from "../../../components/AssistantBase/AssistantBase";
import { handleUndefinedTour } from "../../../helper/architecture";
import { Templates } from "../../../firebase/types/Settings";
import { parseTranslatorPrompt } from "../../../helper/prompt/templating";
import TranslatorForm from "../../../components/AssistantForms/TranslatorForm/TranslatorForm";


const translatorBasicState = {
  language: "",
  text: ""
}


export default function Dialogue( ) {
  const context = useAuthContext();
  const { login, user } = context;
  const [ form ] = Form.useForm();

  const textRef = useRef( null );
  const languageRef = useRef( null );
  const translateRef = useRef( null );

  const steps: TourProps["steps"] = [
    {
      title: "Übersetzer",
      description: "Das \"Übersetzer\"-Feature von Siteware-Business bietet Dir die Möglichkeit, Texte schnell und präzise in verschiedene Sprachen zu "+
      "übersetzen. Direkt in unsere Plattform integriert, ermöglicht es eine nahtlose internationale Kommunikation, ohne dass Du Dein Arbeitsumfeld verlassen musst. "+
      "Unser KI-gestütztes System garantiert dabei hohe Genauigkeit, indem es Kontext und Nuancen des Originaltexts berücksichtigt. Erweitere mit Siteware-Business "+
      "Deine globale Kommunikation und Zusammenarbeit effektiv.",
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
      title: "Was würdest du gerne übersetzen?",
      description: "Hier kannst Du deinen Text einfügen. Nachdem Du Deinen Text in dieses Feld eingegeben hast, kümmert sich unser KI-gestütztes System "+
      "um die Übersetzung in die von Dir gewählte Sprache. Es analysiert den Kontext und die Nuancen Deines Textes, um eine möglichst genaue und "+
      "verständliche Übersetzung zu gewährleisten. Dieses Eingabefeld ist Dein erster Schritt, um globale Barrieren zu überwinden und Deine Nachrichten, "+
      "Dokumente oder jegliche Textinhalte effektiv mit einem internationalen Publikum zu teilen.",
      target: () => textRef.current,
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
      title: "Welche Sprache darf es sein?",
      description: "Hier kannst Du die Ziel-Sprache festlegen, in die Dein Text übersetzt werden soll. "+
      "Dieses Feld bietet Dir eine Auswahl an verfügbaren Sprachen, aus der Du die gewünschte Option wählen kannst. ",
      target: () => languageRef.current,
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
      description: "Durch Klicken auf den \"Übersetzen\"-Button wird nach einer kurzen Wartezeit eine Übersetzung erzeugt. "+
      "Bitte bedenke, dass wir deine Eingaben noch verarbeiten müssen, wodurch es gegebenenfalls zu kurzen Wartezeiten kommen kann.",
      target: () => translateRef.current,
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
    const cleanedText = values.text.replace(/(<~).+?(~>)/gm, "");

    const promptdata = {
      language: values.language,
      text: cleanedText
    }

    const prompt = parseTranslatorPrompt(
      templates.translator,
      promptdata.language,
      promptdata.text
    );

    return { data: promptdata, prompt: prompt };
  }

  return(
    <AssistantBase
      context={context}
      name={"Übersetzer"}
      laststate={"translator"}
      basicState={translatorBasicState}
      Tour={steps}
      form={form}
      promptFunction={promptFunction}
      routes={ { generate: "/api/prompt/translator/generate" } }
      tourState={!handleUndefinedTour( user.tour ).translator}
      dontUseProfile={true}
    >
      <TranslatorForm form={form} state={context} refs={{
        textRef,
        languageRef,
        translateRef
      }}/>
    </AssistantBase>
  );
}
