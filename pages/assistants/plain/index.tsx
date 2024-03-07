import { Form, TourProps } from "antd";
import { useAuthContext } from "../../../components/context/AuthContext";
import { Profile } from "../../../firebase/types/Profile";
import updateData from "../../../firebase/data/updateData";
import AssistantBase from "../../../components/AssistantBase/AssistantBase";
import PlainForm from "../../../components/AssistantForms/Plainform/Plainform";
import { useRef } from "react";
import { handleUndefinedTour } from "../../../helper/architecture";
import { Templates } from "../../../firebase/types/Settings";


const plainBasicState = {
  content: ""
}

export default function Plain( ) {
  const context = useAuthContext();
  const { login, user } = context;
  const [ form ] = Form.useForm();

  const queryRef = useRef( null );
  const generateRef = useRef( null );


  const steps: TourProps["steps"] = [
    {
      title: "GPT-4",
      description: "Mit dem \" GPT-4 \" Assistanten hast du direkten Zugriff auf GPT-4. Es werden nur die "+
      "eingegebenen Informationen übermittelt",
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
      title: "Um was geht es?",
      description: "In diesem Feld kannst du direkt deine Anfrage an die KI formulieren",
      target: () => queryRef.current,
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
      description: "Durch Klicken auf den \"Antwort generieren\"-Button wird nach einer kurzen Wartezeit eine Antwort zu deiner Anfrage erzeugt. "+
      "Bitte bedenke, dass wir deine Eingaben noch verarbeiten müssen, wodurch es gegebenenfalls zu kurzen Wartezeiten kommen kann.",
      target: () => generateRef.current,
      nextButtonProps: {
        children: (
          "Alles klar"
        ),
        onClick: async () => {
          const currstate = user.tour;
          currstate.monolog = true;
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars
  const promptFunction = (values: Record<string, any>, profile: Profile, templates: Templates) => {
    // Remove any resemblance of our token parse chars from the user input
    const cleanedContent = values.content.replace(/(<~).+?(~>)/gm, "");

    // Create an object containing the promptdata
    const promptdata = {
      content: cleanedContent
    }

    return { data: promptdata, prompt: cleanedContent };
  }


  return (
    <AssistantBase
      context={context}
      name={"Plain"}
      laststate={"plain"}
      basicState={plainBasicState}
      Tour={steps}
      form={form}
      promptFunction={promptFunction}
      routes={ { generate: "/api/prompt/plain/generate" } }
      tourState={!handleUndefinedTour( user.tour ).plain}
      dontUseProfile={true}
    >
      <PlainForm form={form} state={context} refs={{
        queryRef: queryRef,
        generateRef: generateRef
      }}/>
    </AssistantBase>
  )
}
