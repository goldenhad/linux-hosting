import { Form, TourProps } from "antd";
import { useRef } from "react";
import { useAuthContext } from "../../../components/context/AuthContext";
import { Profile } from "../../../firebase/types/Profile";
import updateData from "../../../firebase/data/updateData";
import AssistantBase from "../../../components/AssistantBase/AssistantBase";
import BlogForm from "../../../components/AssistantForms/Blogform/Blogform";


const blogBasicState = {
  profile: "",
  content: "",
  order: "",
  length: ""
}

export default function Blog( ) {
  const context = useAuthContext();
  const { role, login, user, company } = context;
  const [ form ] = Form.useForm();


  const profileRef = useRef( null );
  const continueRef = useRef( null );
  const classificationRef = useRef( null );
  const lengthRef = useRef( null );
  const generateRef = useRef( null );


  const steps: TourProps["steps"] = [
    {
      title: "Ein neuer Blogbeitrag",
      description: "Mit dem \"Blogbeitrag schreiben\"-Feature von Siteware.Mail kannst du mithilfe verschiedener Parameter einen Blogbeitrag erstellen. "+
      "Ich werde dir nun die wichtigsten Parameter vorstellen, damit du das Tool optimal nutzen kannst.",
      nextButtonProps: {
        children: "Weiter"
      },
      prevButtonProps: {
        children: "Zurück"
      }
    },
    {
      title: "Wer ist der Autor?",
      description: "Wähle das Autorenprofil aus, das den Schreibstil und die Persönlichkeit für deinen Blogbeitrag repräsentiert. "+
      "Du kannst Profile erstellen oder bearbeiten, indem du zur Seitenleiste gehst und den Punkt \"Profil\" auswählst.",
      target: () => profileRef.current,
      nextButtonProps: {
        children: "Weiter"
      },
      prevButtonProps: {
        children: "Zurück"
      }
    },
    {
      title: "Thema des Blogbeitrags",
      description: "Beschreibe kurz das Thema deines Blogbeitrags. Stichpunkte reichen oft aus. Bedenke, dass präzise Formulierungen "+
      "zu genauen Antworten führen, während mehr Freiraum dem Algorithmus für Tonalität und Formulierung gibt. Experimentiere mit verschiedenen "+
      "Eingabestilen, um den besten Ansatz für dich zu finden.",
      target: () => continueRef.current,
      nextButtonProps: {
        children: "Weiter"
      },
      prevButtonProps: {
        children: "Zurück"
      }
    },
    {
      title: "Schreibstil definieren",
      description: "Gib bis zu drei Aspekte an, die die Einordnung des Lesers und damit den Schreibstil des Beitrags konkret beschreiben. Entscheide über Formalität, "+
      "Freundlichkeit, Professionalität und persönliche Note. Diese Entscheidungen beeinflussen maßgeblich die Wahrnehmung deiner Leser.",
      target: () => classificationRef.current,
      nextButtonProps: {
        children: "Weiter"
      },
      prevButtonProps: {
        children: "Zurück"
      }
    },
    {
      title: "Länge des Blogbeitrags",
      description: "Wähle die gewünschte Länge deines Blogbeitrags aus.",
      target: () => lengthRef.current,
      nextButtonProps: {
        children: "Weiter"
      },
      prevButtonProps: {
        children: "Zurück"
      }
    },
    {
      title: "Alles bereit",
      description: "Nach einem Klick auf den \"Blogbeitrag generieren\"-Button wird nach kurzer Wartezeit ein fertiger Blogbeitrag erstellt. "+
      "Beachte, dass deine Eingaben verarbeitet werden müssen, was zu kurzen Wartezeiten führen kann.",
      target: () => generateRef.current,
      nextButtonProps: {
        children: "Alles klar",
        onClick: async () => {
          const currState = user.tour;
          currState.blog = true;
          updateData("User", login.uid, { tour: currState });
        }
      },
      prevButtonProps: {
        children: "Zurück"
      }
    }
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const promptFunction = (values: Record<string, any>, profile: Profile) => {
    let companyinfo = "";
    if( role.isCompany ){
      companyinfo = `Ich arbeite für ${company.name}. Wir beschäftigen uns mit: ${company.settings.background}`;
    }

    // Remove any resemblance of our token parse chars from the user input
    const cleanedContet = values.content.replace(/(<~).+?(~>)/gm, "");

    // Create an object containing the promptdata
    const promptdata = {
      name: user.firstname + " " + user.lastname,
      personal: profile.settings.personal,
      company: companyinfo,
      content: cleanedContet,
      style: profile.settings.stil,
      order: values.order,
      emotions: profile.settings.emotions,
      length: values.length
    }

    return promptdata;
  }


  return (
    <AssistantBase
      context={context}
      name={"Blog Neu"}
      basicState={blogBasicState}
      Tour={steps}
      form={form}
      promptFunction={promptFunction}
      routes={ { count: "/api/prompt/blog/count", generate: "/api/prompt/blog/generate" } }
    >
      <BlogForm form={form} state={context} refs={{
        profileRef: profileRef,
        continueRef: continueRef,
        classificationRef: classificationRef,
        lengthRef: lengthRef,
        generateRef: generateRef
      }}/>
    </AssistantBase>
  )
}
