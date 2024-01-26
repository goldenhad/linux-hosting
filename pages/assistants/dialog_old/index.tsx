import { Form, TourProps } from "antd";
import { useRef } from "react";
import { useAuthContext } from "../../../components/context/AuthContext";
import { Profile } from "../../../firebase/types/Profile";
import updateData from "../../../firebase/data/updateData";
import AssistantBase from "../../../components/AssistantBase/AssistantBase";
import DialogForm from "../../../components/AssistantForms/Dialogform/Dialogform";
import { handleUndefinedTour } from "../../../helper/architecture";
import { Templates } from "../../../firebase/types/Settings";
import { parseDialogPrompt } from "../../../helper/prompt";


const dialogBasicState = {
  profile: "",
  dialog: "",
  continue: "",
  address: "",
  order: "",
  style: "",
  emotions: "",
  length: ""
}


export default function Dialogue( ) {
  const context = useAuthContext();
  const { role, login, user, company } = context;
  const [ form ] = Form.useForm();

  const profileRef = useRef( null );
  const dialogRef = useRef( null );
  const continueRef = useRef( null );
  const addressRef = useRef( null );
  const classificationRef = useRef( null );
  const lengthRef = useRef( null );
  const generateRef = useRef( null );
  const styleref = useRef( null );
  const emotionsref = useRef( null );

  const steps: TourProps["steps"] = [
    {
      title: "Dialog forsetzen",
      description: "Mit dem \"E-Mail Dialog-Fortsetzen-Feature\" von Siteware business kannst du deine E-Mail-Konversationen "+
      "einfach und effizient fortsetzen. Ich werde dir gleich die wichtigsten Parameter genauer erklären, damit du das Tool optimal nutzen kannst.",
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
      title: "Worum ging es bisher?",
      description: "In dieses Eingabefeld musst du den bisherigen E-Mail-Verlauf einfügen, für den eine Antwort generiert werden soll. "+
      "Ein Tipp: Es ist oft nicht nötig, den gesamten Dialog einzufügen. Manchmal reicht es aus, nur die letzte Mail oder die letzten zwei Mails "+
      "einzugeben, um den Inhalt und den Stil der Konversation zu erfassen.",
      target: () => dialogRef.current,
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
      title: "Wie soll es weitergehen?",
      description: "Hier solltest du kurz den Inhalt beschreiben, um den es in der Antwort gehen soll. Stichpunkte reichen oft aus. "+
      "Beachte: Je präziser deine Formulierungen sind, desto genauer wird die Antwort, aber unser Algorithmus hat dann weniger Freiraum für "+
      "Formulierung und Tonalität. Experimentiere mit verschiedenen Eingabestilen, um herauszufinden, was für dich am besten funktioniert und die "+
      "passendsten Antworten generiert!",
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
      description: "In diesem Eingabefeld solltest du dich auf bis zu drei Aspekte festlegen, die den Schreibstil zwischen dir und deinem Empfänger"+
      " oder deiner Empfängerin konkret beschreiben. Deine Angaben bestimmen den allgemeinen Unterton deiner Nachricht. Überlege dir, ob der "+
      "Ton formell oder informell sein soll, ob du eine professionelle oder freundliche Atmosphäre schaffen möchtest, und ob du Sachlichkeit "+
      "oder eine persönliche Note bevorzugst. Diese Entscheidungen beeinflussen maßgeblich, wie deine Antwort wahrgenommen wird.",
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

    const cleanedDialog = values.dialog.replace(/(<~).+?(~>)/gm, "");
    const cleanedContinue = values.continue.replace(/(<~).+?(~>)/gm, "");

    const promptdata = {
      name: user.firstname + " " + user.lastname,
      personal: profile.settings.personal,
      company: companyinfo,
      dialog: cleanedDialog,
      continue: cleanedContinue,
      address: values.address,
      style: values.style,
      order: values.order,
      emotions: values.emotions,
      length: values.length
    }

    const prompt = parseDialogPrompt(
      templates.dialog,
      promptdata.name,
      promptdata.company,
      promptdata.personal,
      promptdata.dialog,
      promptdata.continue,
      promptdata.address,
      promptdata.style,
      promptdata.order,
      promptdata.emotions,
      promptdata.length
    )

    return { data: promptdata, prompt: prompt };
  }

  return(
    <AssistantBase
      context={context}
      name={"Dialog"}
      laststate={"dialog"}
      basicState={dialogBasicState}
      Tour={steps}
      form={form}
      promptFunction={promptFunction}
      routes={ { generate: "/api/prompt/dialog_old/generate" } }
      tourState={!handleUndefinedTour( user.tour ).dialog}

    >
      <DialogForm form={form} state={context} refs={{
        profileRef: profileRef,
        continueRef: continueRef,
        classificationRef: classificationRef,
        lengthRef: lengthRef,
        generateRef: generateRef,
        addressRef: addressRef,
        dialogRef: dialogRef,
        styleref: styleref,
        emotionsref: emotionsref
      }}/>
    </AssistantBase>
  );
}
