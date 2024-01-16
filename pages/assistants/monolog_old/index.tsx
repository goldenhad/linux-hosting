import { Form, TourProps } from "antd";
import { useAuthContext } from "../../../components/context/AuthContext";
import { Profile } from "../../../firebase/types/Profile";
import updateData from "../../../firebase/data/updateData";
import AssistantBase from "../../../components/AssistantBase/AssistantBase";
import MonologForm from "../../../components/AssistantForms/Monologform/Monologform";
import { useRef } from "react";
import { handleUndefinedTour } from "../../../helper/architecture";


const monologBasicState = {
  profile: "",
  content: "",
  address: "",
  order: "",
  style: "",
  emotions: "",
  length: ""
}

export default function Monologue( ) {
  const context = useAuthContext();
  const { role, login, user, company } = context;
  const [ form ] = Form.useForm();

  const profileRef = useRef( null );
  const continueRef = useRef( null );
  const addressRef = useRef( null );
  const classificationRef = useRef( null );
  const lengthRef = useRef( null );
  const generateRef = useRef( null );
  const styleref = useRef( null );
  const emotionsref = useRef( null );


  const steps: TourProps["steps"] = [
    {
      title: "E-Mail schreiben",
      description: "Das \"E-Mail schreiben\"-Feature von Siteware business ermöglicht es dir, aus einem kurz skizzierten Inhalt eine E-Mail zu generieren, "+
      "indem du verschiedene Parameter eingibst, um den Inhalt genauer zu definieren. Ich werde dir gleich die wichtigsten Parameter"+
      " genauer erklären, damit du das Tool optimal nutzen kannst.",
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
      title: "Wer schreibt die E-Mails?",
      description: "Hier hast du die Möglichkeit, ein Profil auszuwählen, das die Persönlichkeit widerspiegelt, "+
      "für die die E-Mail generiert wird. Bei deinem ersten Login habe ich bereits ein Hauptprofil für dich angelegt. "+
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
      title: "Worum geht es?",
      description: "In diesem Eingabefeld musst du kurz beschreiben, worum es in der Mail geht, die generiert werden soll. "+
      "Stichpunkte reichen oft aus. Beachte: Je präziser deine Formulierungen sind, desto genauer wird die Antwort, "+
      "aber unser Algorithmus hat dann weniger Freiraum für Formulierung und Tonalität. Experimentiere mit verschiedenen "+
      "Eingabestilen, um herauszufinden, was für dich am besten funktioniert und die passendsten Antworten generiert!",
      target: () => continueRef.current,
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
      title: "Wie sollen wir adressieren?",
      description: "Bitte wähle aus, in welcher Adressform du deine E-Mail gerne verfassen würdest.",
      target: () => addressRef.current,
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
      title: "Wie schätzt du den Schreibstil zwischen dir und deinem Gegenüber ein?",
      description: "In diesem Eingabefeld solltest du dich auf bis zu drei Aspekte festlegen, die den Schreibstil zwischen dir und "+
      "deinem Empfänger oder deiner Empfängerin konkret beschreiben. Deine Angaben bestimmen den allgemeinen Unterton deiner Nachricht. "+
      "Überlege dir, ob der Ton formell oder informell sein soll, ob du eine professionelle oder freundliche Atmosphäre schaffen möchtest, "+
      "und ob du Sachlichkeit oder eine persönliche Note bevorzugst. Diese Entscheidungen beeinflussen maßgeblich, wie deine Antwort wahrgenommen wird.",
      target: () => classificationRef.current,
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
      title: "Kurze Mitteilung oder eine ausführliche Erläuterung?",
      description: "Zum Abschluss musst du nur noch die Länge deiner Antwort festlegen.",
      target: () => lengthRef.current,
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
      description: "Durch Klicken auf den \"Antwort Generieren\"-Button wird nach einer kurzen Wartezeit eine E-Mail erzeugt. "+
      "Bitte bedenke, dass die wir deine Eingaben noch verarbeiten müssen, wodurch es gegebenenfalls zu kurzen Wartezeiten kommen kann.",
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
      address: values.address,
      style: values.style,
      order: values.order,
      emotions: values.emotions,
      length: values.length
    }

    return promptdata;
  }


  return (
    <AssistantBase
      context={context}
      name={"Monolog 3.5 Turbo"}
      laststate={"monolog_old"}
      basicState={monologBasicState}
      Tour={steps}
      form={form}
      promptFunction={promptFunction}
      routes={ { count: "/api/prompt/monolog_old/count", generate: "/api/prompt/monolog_old/generate" } }
      tourState={!handleUndefinedTour( user.tour ).monolog}
    >
      <MonologForm form={form} state={context} refs={{
        profileRef: profileRef,
        continueRef: continueRef,
        classificationRef: classificationRef,
        lengthRef: lengthRef,
        generateRef: generateRef,
        addressRef: addressRef,
        styleref: styleref,
        emotionsref: emotionsref
      }}/>
    </AssistantBase>
  )
}
