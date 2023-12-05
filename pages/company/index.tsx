import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  TourProps,
  Tour
} from "antd";
import styles from "./edit.company.module.scss"
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { GetServerSideProps } from "next";
import SidebarLayout from "../../components/Sidebar/SidebarLayout";
import { useRouter } from "next/router";
import { handleEmptyString, handleUndefinedTour } from "../../helper/architecture";
import { useAuthContext } from "../../components/context/AuthContext";
import { getDocWhere } from "../../firebase/data/getData";
import updateData from "../../firebase/data/updateData";
import {
  ClockCircleOutlined
} from "@ant-design/icons";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from "chart.js";
import { User } from "../../firebase/types/User";
import { InvitedUser } from "../../firebase/types/Company";
const { TextArea } = Input;

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

export interface InitialProps {
  Data: { currentMonth: number, currentYear: number; paypalURL: string; };
}

export const getServerSideProps: GetServerSideProps = async () => {
  const datum = new Date();
  
  return {
    props: {
      Data: {
        currentMonth: datum.getMonth() + 1,
        currentYear: datum.getFullYear(),
        paypalURL : process.env.PAYPALURL
      }
    }
  };
};


export default function Company( props: InitialProps ) {
  const context = useAuthContext();
  const { login, user, company, role } = context;
  const [ errMsg, setErrMsg ] = useState( [] );
  const [ isErrVisible, setIsErrVisible ] = useState( false );
  const [ inviteErrMsg, setInviteErrMsg ] = useState( "" );
  const [ isInviteErrVisible, setIsInviteErrVisible ] = useState( false );
  const [ editSuccessfull, setEditSuccessfull ] = useState( false );
  const [ userTableData, setUserTableData ] = useState( [] );
  const [ inviteUserModalOpen, setInviteUserModalOpen ] = useState( false );
  const [ inviteForm ] = Form.useForm();
  const [ form ] = Form.useForm();
  const [ userTableLoading, setUserTableLoading ] = useState( true );
  const router = useRouter();
  const [open, setOpen] = useState<boolean>( !handleUndefinedTour( user.tour ).company );

  const companyRef = useRef( null );
  const backgroundRef = useRef( null );
  const budgetRef = useRef( null );
  const buyRef = useRef( null );
  const orderRef = useRef( null );
  const userRef = useRef( null );
  const inviteRef = useRef( null );


  let steps: TourProps["steps"] = [];

  if( role.canEditCompanyDetails ){
    steps = [
      {
        title: "Firmeneinstellungen",
        description: "Willkommen in den Firmeneinstellungen! Hier kannst du alle relevanten Details " +
                "und Hintergründe zu deinem Unternehmen finden. Die wichtigsten Informationen zu den " +
                "Firmeneinstellungen werde ich dir jetzt kurz erklären!",
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
        title: "Informationen",
        description: "Hier werden die Informationen zu deiner Firma angezeigt. Du hast die Möglichkeit, " + 
                "diese Daten zu bearbeiten und Änderungen für alle Mitarbeiter deiner Firma vorzunehmen.",
        target: () => companyRef.current,
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
        title: "Hintergrundinfos zu ihrer Firma",
        description: "Hier hast du die Möglichkeit, die Hintergrundinformationen zu deiner Firma zu bearbeiten. " +
        "Diese Informationen fließen in deine Anfragen an unsere KI mit "+
        "ein und beeinflussen somit die generierten Inhalte.",
        target: () => backgroundRef.current,
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
        title: "Mitglieder deiner Firma",
        description: "In dieser Tabelle findest du eine Auflistung aller Mitglieder deiner Firma."+
        " Du hast die Möglichkeit, Statistiken zu den von den einzelnen Mitgliedern geschriebenen Mails einzusehen und"+
        " Einstellungen zu den Rollen und Berechtigungen der Mitglieder vorzunehmen.",
        target: () => userRef.current,
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
        title: "Weitere Teammitglieder einladen",
        description: "Falls weitere Mitglieder deiner Firma die Funktionen von Siteware.Mail benötigen,"+
        " hast du hier die Möglichkeit, sie direkt einzuladen.",
        target: () => inviteRef.current,
        nextButtonProps: {
          children: (
            "Alles klar"
          ),
          onClick: async () => {
            const currstate = user.tour;
            currstate.company = true;
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
  }else{
    steps = [
      {
        title: "Firmeneinstellungen",
        description: "Willkommen in den Firmeneinstellungen! Hier kannst du alle relevanten Details und Hintergründe"+
        " zu deinem Unternehmen finden. Die wichtigsten Informationen zu den Firmeneinstellungen werde"+
        " ich dir jetzt kurz erklären!",
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
        title: "Informationen",
        description: "Hier werden die Informationen zu deiner Firma angezeigt. Beachte bitte,"+
        " dass die Eingabemöglichkeit für dich deaktiviert ist. Falls du Änderungen an den Firmeninformationen"+
        " vornehmen möchtest, musst du einen Firmen-Admin kontaktieren.",
        target: () => companyRef.current,
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
        title: "Statistik zur Nutzung",
        description: "Hier findest du eine kurze und klare Übersicht darüber, wie viele Mails deine Firma über das "+
        "aktuelle Jahr mit Siteware.Mail bereits verbraucht hat und wie viele Mails"+
        " noch auf eurem Konto verfügbar sind.",
        target: () => budgetRef.current,
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
        title: "Ihr wollt noch mehr E-Mails optimieren?",
        description: "Solltet ihr den Bedarf haben, mehr E-Mails zu optimieren,"+
        " könnt ihr zusätzliche E-Mail-Kapazitäten hier direkt erwerben.",
        target: () => buyRef.current,
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
        title: "Eure bisherigen Einkäufe",
        description: "In der untenstehenden Tabelle findet ihr eine Übersicht eurer bisherigen Einkäufe bei "+
        "Siteware.Mail. Hier habt ihr die Möglichkeit, Rechnungen herunterzuladen und unterbrochene"+
        " Einkäufe abzuschließen.",
        target: () => orderRef.current,
        nextButtonProps: {
          children: (
            "Alles klar"
          ),
          onClick: async () => {
            const currstate = user.tour;
            currstate.company = true;
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
  }

  useEffect( () => {
    if( !role.isCompany ) {
      router.push( "/" );
    }
  }, [role.isCompany, router] );

  useEffect( () => {
    if ( login == null ) router.push( "/login" );

    form.setFieldValue( "companyname", company.name );
    form.setFieldValue( "companystreet", company.street );
    form.setFieldValue( "companycity", company.city );
    form.setFieldValue( "companypostalcode", company.postalcode );
    form.setFieldValue( "companycountry", company.country );
    form.setFieldValue( "companybackground", company.settings.background );
  }, [company.city, company.country, company.name, company.postalcode, company.settings.background, company.street, form, login, router] );

  useEffect( () => {
    const load = async () => {
      const { result, error } = await getDocWhere( "User", "Company", "==", user.Company );
      // eslint-disable-next-line
      let users: Array<any> = [];
      users = result;

      if( company.invitedUsers ){
        company.invitedUsers.forEach( ( inv: InvitedUser ) => {
          if( users ){
            users.push( inv );
          }
        } );
      }
      

      if( !error ){
        setUserTableData( result );
        setUserTableLoading( false );
      }else{
        setUserTableData( [] );
      }
    }

    load();
  }, [company, user.Company] )


  const editCompany = async ( values ) => {
    const comp = company;
    comp.name = handleEmptyString( values.companyname );
    comp.street = handleEmptyString( values.companystreet );
    comp.city = handleEmptyString( values.companycity );
    comp.postalcode = handleEmptyString( values.companypostalcode );
    comp.country = handleEmptyString( values.companycountry );
    comp.settings.background = handleEmptyString( values.companybackground );

    try{
      await updateData( "Company", user.Company, comp );

      setErrMsg( [] );
      setIsErrVisible( false );
      setEditSuccessfull( true );
    } catch( e ) {
      setErrMsg( ["Speichern fehlgeschlagen!"] );
      setIsErrVisible( true );
    }
  }

  const checkRoleString = ( value: string ) => {
    return value == "Mailagent" || value == "Company-Admin" || value == "Company-Manager";
  }

  const getCompanyInput = () => {
    if( role.canEditCompanyDetails ){
      return (
        <div ref={companyRef}>
          <Form 
            layout='vertical'
            onFinish={editCompany}
            onChange={() => {
              setIsErrVisible( false ), setEditSuccessfull( false )
            }}
            form={form}
          >

            <Form.Item
              label="Firmenname"
              name="companyname"
              className={styles.formpart}
            >
              <Input className={styles.forminput} style={{ width: "50%" }} placeholder="Name der Firma..." />
            </Form.Item>

            <Space direction='horizontal' wrap>
              <Form.Item
                label="Straße"
                name="companystreet"
                className={styles.formpart}
              >
                <Input className={styles.forminput} placeholder="Musterstraße 1..." />
              </Form.Item>

              <Form.Item
                label="Ort"
                name="companycity"
                className={styles.formpart}
              >
                <Input className={styles.forminput} placeholder="Musterstadt..." />
              </Form.Item>

              <Form.Item
                label="Plz"
                name="companypostalcode"
                className={styles.formpart}
              >
                <Input className={styles.forminput} placeholder="123456"/>
              </Form.Item>

              <Form.Item
                label="Land"
                name="companycountry"
                className={styles.formpart}
              >
                <Select
                  className={styles.formselect}
                  options={[
                    {
                      value: "de",
                      label: "Deutschland"
                    }
                  ]}
                  style={{ width: 150 }}
                />
              </Form.Item>
            </Space>

            <div ref={backgroundRef}>
              <Form.Item
                label="Background der Firma"
                name="companybackground"
                className={styles.formpart}
              >
                <TextArea className={styles.forminput} rows={10} placeholder="Was ist das Kerngeschäft der Firma?"/>
              </Form.Item>
            </div>

            <div className={styles.errorrow} style={{ display: ( isErrVisible )? "block": "none" }}>
              <Alert type='error' message={errMsg} />
            </div>

            <div className={styles.successrow} style={{ display: ( editSuccessfull )? "block": "none" }}>
              <Alert type='success' message="Speichern erfolgreich!" />
            </div>

            <div className={styles.finishformrow}>
              <Button className={styles.savebutton} type='primary' htmlType='submit'>Speichern</Button>
            </div>

          </Form>
        </div>
      );
    }else{
      return (
        <div ref={companyRef}>
          <Form 
            layout='vertical'
            onFinish={undefined}
            form={form}
          >

            <Form.Item
              label="Firmenname"
              name="companyname"
            >
              <Input disabled/>
            </Form.Item>

            <Space direction='horizontal' wrap>
              <Form.Item
                label="Straße"
                name="companystreet"
              >
                <Input disabled/>
              </Form.Item>

              <Form.Item
                label="Ort"
                name="companycity"
              >
                <Input disabled/>
              </Form.Item>

              <Form.Item
                label="Plz"
                name="companypostalcode"
              >
                <Input disabled/>
              </Form.Item>

              <Form.Item
                label="Land"
                name="companycountry"
              >
                <Select
                  options={[
                    {
                      value: "de",
                      label: "Deutschland"
                    }
                  ]}
                  disabled
                />
              </Form.Item>
            </Space>

            <Form.Item
              label="Background der Firma"
              name="companybackground"
            >
              <TextArea rows={10} disabled/>
            </Form.Item>

          </Form>
        </div>
      );
    }
  }


  const usercolumns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: ( _, obj ) => {
        return obj.firstname + " " + obj.lastname;
      }
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username"
    },
    {
      title: "Token diesen Monat",
      dataIndex: "usedCredits",
      key: "usedCredits",
      render: ( _, obj ) => {
        if( obj.username ){
          const usageidx = obj.usedCredits.findIndex( ( val ) => {
            return val.month == props.Data.currentMonth && val.year == props.Data.currentYear
          } );
          if( usageidx != -1 ){
            return obj.usedCredits[usageidx].amount;
          }else{
            return "0";
          }
        }
      }
    },
    {
      title: "Rolle",
      dataIndex: "Role",
      key: "Role",
      render: ( _, obj: User & { id: string }, idx: number ) => {
        let rolename = "Mailagent";
        switch( obj.Role ){
        case "Company-Admin":
          rolename = "Admin";
          break;
        case "Company-Manager":
          rolename = "Manager";
          break;
        default:
          rolename = "Mailagent"
          break;
        }

        if( obj.username ){
          if( obj.Role != "Company-Admin" &&
            user.email != obj.email &&
            ( user.Role == "Company-Admin" || user.Role == "Company-Manager" ) ){
            return (
              <div>
                <div>
                  <Select value={userTableData[idx].Role} style={{ width: 200 }} options={[
                    { label: "Company-Manager", value: "Company-Manager" },
                    { label: "Mailagent", value: "Mailagent" }
                  ]}
                  onChange={async ( value ) => {
                    setUserTableLoading( true );
                    await updateData( "User", obj.id, { Role: checkRoleString( value )? value: "Mailagent" } );
                    const userdata = userTableData;
                    userdata[idx].Role = checkRoleString( value )? value: "Mailagent";
                    setUserTableData( userdata );
                    setUserTableLoading( false );
                  }} 
                  />
                </div>
              </div>
            );
          }else{
            return (
              <div>
                <div>
                  {rolename}
                </div>
              </div>
            );
          }
        }else{
          return obj.Role;
        }
      }
    },
    {
      title: "Status",
      dataIndex: "state",
      key: "state",
      render: ( _, obj: User & { id: string } ) => { 
        if( !obj.username ){
          return <Tag icon={<ClockCircleOutlined />} color="warning">eingeladen</Tag>
        }
      }
    }
  ];

  const inviteUser = async ( values ) => {
    try{
      await axios.post( "/api/company/invite", {
        email: values.email,
        companyId: user.Company,
        companyname: company.name,
        firstname: values.firstname,
        lastname: values.lastname,
        role: values.role,
        invitedbyname: `${user.firstname} ${user.lastname}`
      } );

      let invusers = [];
      if( company.invitedUsers ){
        invusers = company.invitedUsers;
      }

      invusers.push( { email: values.email, firstname: values.firstname, lastname: values.lastname, Role: values.role } );

      await updateData( "Company", user.Company, { invitedUsers: invusers } );
            
      setIsInviteErrVisible( false );
      setInviteErrMsg( "" );
      inviteForm.resetFields( ["email", "firstname", "lastname"] );
      setInviteUserModalOpen( false );
    }catch( e ){
      setIsInviteErrVisible( true );
      setInviteErrMsg( "Ein Nutzer mit dieser E-Mail Adresse nutzt Siteware.Mail bereits!" );
    }
  }

    

  const getUserOverview = () => {
    if( role.isCompany && role.canEditCompanyDetails ){
      return(
        <div>
          <Card title={"Nutzer"} bordered={true} headStyle={{ backgroundColor: "#F9FAFB" }}>
            <Table
              loading={userTableLoading}
              dataSource={[...userTableData]} columns={usercolumns}
              rowKey={( record: User & { id: string } ) => {
                return record.id
              }}/>
            <div className={styles.inviteuserrow}>
              <Button ref={inviteRef} type='primary' onClick={() => {
                setInviteUserModalOpen( true )
              }}>Nutzer einladen</Button>
            </div>
          </Card>

          <Modal title="Nutzer einladen" open={inviteUserModalOpen} onCancel={() => {
            setInviteUserModalOpen( false )
          }} footer = {[]}>
                        
            <Form layout='vertical' onFinish={inviteUser} form={inviteForm} onChange={() => {
              setIsInviteErrVisible( false ); setInviteErrMsg( "" )
            }}>
              <Form.Item className={styles.formpart} label={<b>E-Mail</b>} name="email" rules={[{ required: true, message: "Eine E-Mail ist erforderlich!" }]}>
                <Input className={styles.forminput} placeholder="max@mustermann.de"/>
              </Form.Item>

              <Form.Item className={styles.formpart} label={<b>Vorname</b>} name="firstname" rules={[{ required: true, message: "Eine Vorname ist erforderlich!" }]}>
                <Input className={styles.forminput} placeholder="Max"/>
              </Form.Item>

              <Form.Item className={styles.formpart} label={<b>Nachname</b>} name="lastname" rules={[{ required: true, message: "Eine Nachname ist erforderlich!" }]}>
                <Input className={styles.forminput} placeholder="Mustermann"/>
              </Form.Item>

              <Form.Item className={styles.formpart} label={<b>Rolle</b>} name="role" rules={[{ required: true, message: "Eine Rolle ist erforderlich!" }]}>
                <Select className={styles.formselect} value={"Mailagagent"} options={[
                  { label: "Company-Manager", value: "Company-Manager" },
                  { label: "Mailagent", value: "Mailagent" }
                ]} 
                />
              </Form.Item>
                            
              <div className={styles.errorrow} style={{ display: ( isInviteErrVisible )? "block": "none" }}>
                <Alert type='error' message={inviteErrMsg} />
              </div>

              <div className={styles.finishformrow}>
                <Space direction='horizontal'>
                  <Button type='default' onClick={() => {
                    setInviteUserModalOpen( false )
                  }}>Abbrechen</Button>
                  <Button type='primary' htmlType='submit' onClick={undefined}>Einladen</Button>
                </Space>
              </div>
            </Form>
          </Modal>
        </div>
                
      );
    }else{
      return <></>;
    }
  }
  
  return (
    <SidebarLayout context={context}>
      <div className={styles.main}>
        <div className={styles.companyoverview}>
          <Card className={styles.companysettings} title={"Ihre Firma"} headStyle={{ backgroundColor: "#F9FAFB" }} bordered={true}>
            {getCompanyInput()}
          </Card>
        </div>
        <div ref={userRef} className={styles.companyusers}>
          {getUserOverview()}
        </div>
        <Tour open={open} onClose={async () => {
          const currstate = user.tour;
          currstate.company = true;
          updateData( "User", login.uid, { tour: currstate } );
          setOpen( false );
        }} steps={steps} />
      </div>
    </SidebarLayout>
  );
}
