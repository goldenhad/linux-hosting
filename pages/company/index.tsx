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
  Tour,
  Avatar,
  Statistic,
  message,
  Tooltip
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
  ClockCircleOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  EditOutlined,
  DeleteOutlined
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
import { getImageUrl } from "../../firebase/drive/upload_file";
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
  const [ memberToEdit, setMemberToEdit ] = useState( undefined );
  const [ editMemberModal, setEditMemberModal ] = useState( false );
  const [ memberToDelete, setMemberToDelete ] = useState( undefined );
  const [ deleteMemberModal, setDeleteMemberModal ] = useState( false );
  const [ userTableLoading, setUserTableLoading ] = useState( true );
  const [ deleteCounter, setDeleteCounter ] = useState( 0 );
  const [messageApi, contextHolder] = message.useMessage();
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
        description: "Falls weitere Mitglieder deiner Firma die Funktionen von Siteware business benötigen,"+
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
        "aktuelle Jahr mit Siteware business bereits verbraucht hat und wie viele Mails"+
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
        "Siteware business. Hier habt ihr die Möglichkeit, Rechnungen herunterzuladen und unterbrochene"+
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
            const invUser = inv;
            invUser.wasInvited = true;
            users.push( invUser );
          }
        } );
      }

      if( !error ){
        setUserTableData( users );
        setUserTableLoading( false );
      }else{
        setUserTableData( [] );
        setUserTableLoading( false );
      }      
    }

    load();
  }, [company, user.Company, deleteCounter] );


  /**
   * UseEffect for loading the profile pictures of the members in the table
   * This function was seperated from the loading of the table entries to
   * increase the loading speed of the data in the tables
   */
  useEffect( () => {
    const loadImages = async () => {
      const usersWithPictures = [];

      for( let i=0; i < userTableData.length; i++ ){
        const imageurl = await getImageUrl( userTableData[i].id );
        if( imageurl ){
          userTableData[i].profilepicture = imageurl;
        }
  
        usersWithPictures.push( userTableData[i] );
      }

      setUserTableData( usersWithPictures );
    }

    loadImages();
    // eslint-disable-next-line
  }, [userTableLoading] )


  /**
   * Handles the updating of the company date with the given form values
   * @param values Object containing the values needed for editing the company
   */
  async function editCompany ( values ) {
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

  /**
   * Checks the string to be one of the company roles
   * @param value String of the role
   * @returns Returns false if the given rolename is neither Mailagent, Company-Admin nor Company-Manager
   */
  function checkRoleString ( value: string ) {
    return value == "Mailagent" || value == "Company-Admin" || value == "Company-Manager";
  }

  /**
   * Function to return the company input fields depending on the current user role
   * @returns React-Component containing the form
   */
  function getCompanyInput() {
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
              <Input className={styles.forminput} placeholder="Name der Firma..." />
            </Form.Item>

            <div className={styles.addressrow}>
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
            </div>

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

  /**
   * Calculates if the the given username should be shown or a Tag value should be shown if the user was invited
   * @param username Username to show
   * @param wasInvited Value to test if the users invite is still pending
   * @returns Either the given username prefixed with "@" or a <Tag>
   */
  function displayUserName( username: string, wasInvited: boolean ) {
    if( !wasInvited ){
      return `@${username}`;
    }else{
      return <Tag icon={<ClockCircleOutlined />} color="warning">eingeladen</Tag>;
    }
  }

  const getRoleName = ( rolename: string ) => {
    switch( rolename ){
    case "Company-Admin":
      return "Admin";

    case "Company-Manager":
      return "Manager";

    default:
      return "Mailagent"
    }
  }

  let usercolumns = [];

  if(window.innerWidth <= 700){
    usercolumns = [
      {
        title: "Mitarbeiter",
        dataIndex: "member",
        key: "member",
        render: ( _, obj, idx ) => {
          let iconToDisplay = <></>;
          let colorToDisplay = "#00000";
  
          const Stats = () => {
            if( obj.username ){
              const usageidx = obj.usedCredits.findIndex( ( val ) => {
                return val.month == props.Data.currentMonth && val.year == props.Data.currentYear;
              });
    
              const lastUsageIdx = obj.usedCredits.findIndex( ( val ) => {
                let yearToSearch = props.Data.currentYear;
                let monthToSearch = props.Data.currentMonth - 1;
                if( monthToSearch == 0 ){
                  yearToSearch = yearToSearch - 1;
                  monthToSearch = 12;
                }
    
                return val.month == monthToSearch && val.year == yearToSearch;
              });
    
              if( usageidx != -1 && lastUsageIdx != -1 ) {
                const currentvalue = obj.usedCredits[usageidx].amount;
                const valueBefore = obj.usedCredits[lastUsageIdx].amount;
    
                if( valueBefore < currentvalue ){
                  iconToDisplay = <ArrowUpOutlined />;
                  colorToDisplay = "#3f8600";
                }else if( valueBefore > currentvalue ){
                  iconToDisplay = <ArrowDownOutlined />;
                  colorToDisplay = "#cf1322";
                }
              }else{
                iconToDisplay = <></>;
                colorToDisplay = "#00000";
              }
    
              let creditusage = 0;
              if(obj.usedCredits[usageidx]){
                creditusage = parseFloat((obj.usedCredits[usageidx].amount / 1000).toFixed(2));
              }
    
              return (
                <Statistic
                  value={creditusage}
                  precision={2}
                  valueStyle={{ color: colorToDisplay, fontSize: 14 }}
                  prefix={iconToDisplay}
                  suffix="Credits"
                  groupSeparator="."
                  decimalSeparator=","
                />
              )
            }else{          
              return (
                <Statistic
                  value={0.00}
                  precision={2}
                  valueStyle={{ color: colorToDisplay, fontSize: 14 }}
                  prefix={iconToDisplay}
                  suffix="Credits"
                  groupSeparator="."
                  decimalSeparator=","
                />
              )
            }
          }

          const UserActions = () => {
            if( obj.Role != "Company-Admin" && obj.id != login.uid ){
              return ( <div className={styles.useractions}>
                <Tooltip title={"Mitarbeiter bearbeiten"}>
                  <EditOutlined onClick={() => {
                    setMemberToEdit( idx );
                    setEditMemberModal( true )
                  }}
                  />
                </Tooltip>
                <Tooltip title={"Mitarbeiter löschen"}>
                  <DeleteOutlined onClick={() => {
                    setMemberToDelete( idx );
                    setDeleteMemberModal( true )
                  }}/>
                </Tooltip>
                
              </div> );
            }
          }
          
          return(
            <div className={styles.memberprofile}>
              <div className={styles.avatarcontainer}>
                <Avatar
                  size={40}
                  style={{ backgroundColor: "#f0f0f2", color: "#474747" }}
                  src={userTableData[idx].profilepicture}
                >
                  <>{handleEmptyString( obj.firstname ).toUpperCase().charAt( 0 )}{handleEmptyString( obj.lastname ).toUpperCase().charAt( 0 )}</>
                </Avatar>
              </div>
              <div className={styles.namecontainer}>
                <div>{obj.firstname + " " + obj.lastname}</div>
                <div className={styles.rolecontainer}>{getRoleName( obj.Role )}</div>
                <div className={styles.usernamecontainer}>{displayUserName( obj.username, obj.wasInvited )}</div>
                <Stats />
                <UserActions />
              </div>
            </div>
          );
        }
      }
    ];
  }else{
    usercolumns = [
      {
        title: "Mitarbeiter",
        dataIndex: "member",
        key: "member",
        render: ( _, obj, idx ) => {
          return(
            <div className={styles.memberprofile}>
              <div className={styles.avatarcontainer}>
                <Avatar
                  size={40}
                  style={{ backgroundColor: "#f0f0f2", color: "#474747" }}
                  src={userTableData[idx].profilepicture}
                >
                  <>{handleEmptyString( obj.firstname ).toUpperCase().charAt( 0 )}{handleEmptyString( obj.lastname ).toUpperCase().charAt( 0 )}</>
                </Avatar>
              </div>
              <div className={styles.namecontainer}>
                <div>{obj.firstname + " " + obj.lastname}</div>
                <div className={styles.rolecontainer}>{getRoleName( obj.Role )}</div>
                <div className={styles.usernamecontainer}>{displayUserName( obj.username, obj.wasInvited )}</div>
              </div>
            </div>
          );
        }
      },
      {
        title: "Credits diesen Monat",
        dataIndex: "usedCredits",
        key: "usedCredits",
        render: ( _, obj ) => {
          let iconToDisplay = <></>;
          let colorToDisplay = "#00000";
  
          if( obj.username ){
            const usageidx = obj.usedCredits.findIndex( ( val ) => {
              return val.month == props.Data.currentMonth && val.year == props.Data.currentYear;
            } );
  
            const lastUsageIdx = obj.usedCredits.findIndex( ( val ) => {
              let yearToSearch = props.Data.currentYear;
              let monthToSearch = props.Data.currentMonth - 1;
              if( monthToSearch == 0 ){
                yearToSearch = yearToSearch - 1;
                monthToSearch = 12;
              }
  
              return val.month == monthToSearch && val.year == yearToSearch;
            } );
  
            if( usageidx != -1 && lastUsageIdx != -1 ) {
              const currentvalue = obj.usedCredits[usageidx].amount;
              const valueBefore = obj.usedCredits[lastUsageIdx].amount;
  
              if( valueBefore < currentvalue ){
                iconToDisplay = <ArrowUpOutlined />;
                colorToDisplay = "#3f8600";
              }else if( valueBefore > currentvalue ){
                iconToDisplay = <ArrowDownOutlined />;
                colorToDisplay = "#cf1322";
              }
            }else{
              iconToDisplay = <></>;
              colorToDisplay = "#00000";
            }
  
            let creditusage = 0;
            if(obj.usedCredits[usageidx]){
              creditusage = parseFloat((obj.usedCredits[usageidx].amount / 1000).toFixed(2));
            }
  
            return (
              <Statistic
                value={creditusage}
                precision={2}
                valueStyle={{ color: colorToDisplay, fontSize: 14 }}
                prefix={iconToDisplay}
                suffix="Credits"
                groupSeparator="."
                decimalSeparator=","
              />
            )
          }else{          
            return (
              <Statistic
                value={0}
                precision={2}
                valueStyle={{ color: colorToDisplay, fontSize: 14 }}
                prefix={iconToDisplay}
                suffix="Credits"
                groupSeparator="."
                decimalSeparator=","
              />
            )
          }
        }
      },
      {
        title: "Aktionen",
        dataIndex: "actions",
        key: "actions",
        render: ( _, obj: User & { id: string }, indx: number ) => { 
          if( obj.Role != "Company-Admin" && obj.id != login.uid ){
            return ( <div className={styles.useractions}>
              <Tooltip title={"Mitarbeiter bearbeiten"}>
                <EditOutlined onClick={() => {
                  setMemberToEdit( indx );
                  setEditMemberModal( true )
                }}
                />
              </Tooltip>
              <Tooltip title={"Mitarbeiter löschen"}>
                <DeleteOutlined onClick={() => {
                  setMemberToDelete( indx );
                  setDeleteMemberModal( true )
                }}/>
              </Tooltip>
              
            </div> );
          }
        }
      }
    ];
  }

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
      setInviteErrMsg( "Ein Nutzer mit dieser E-Mail Adresse nutzt Siteware business bereits!" );
    }
  }


  const getRoleSelect = () => {
    if( memberToEdit != undefined ){
      const obj = userTableData[memberToEdit];

      let rolename = "Mailagent";
      rolename = getRoleName( obj.Role );

      if( obj.username ){
        if( obj.Role != "Company-Admin" &&
              user.email != obj.email &&
              ( user.Role == "Company-Admin" || user.Role == "Company-Manager" ) ){
          return (
            <div>
              <div>
                <Form layout="vertical">
                  <Form.Item label="Rolle" style={{ fontWeight: 700 }}>
                    <Select value={userTableData[memberToEdit].Role} style={{ width: "100%" }} options={[
                      { label: "Company-Manager", value: "Company-Manager" },
                      { label: "Mailagent", value: "Mailagent" }
                    ]}
                    onChange={async ( value ) => {
                      setUserTableLoading( true );
                      await updateData( "User", obj.id, { Role: checkRoleString( value )? value: "Mailagent" } );
                      const userdata = userTableData;
                      userdata[memberToEdit].Role = checkRoleString( value )? value: "Mailagent";
                      setUserTableData( userdata );
                      setUserTableLoading( false );
                    }} 
                    />
                  </Form.Item>
                </Form>
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
  }
    

  const getUserOverview = () => {
    if( role.isCompany && role.canEditCompanyDetails ){
      return(
        <div>
          <Card title={"Mitarbeiter"} bordered={true}>
            <Table
              loading={userTableLoading}
              dataSource={[...userTableData]}
              columns={usercolumns}
              rowKey={( record: User & { id: string } ) => {
                return record.id
              }}
              scroll={{ x: true }}
            />
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
                <div className={styles.finisinvite}>
                  <Button type='primary' htmlType='submit' onClick={undefined}>Einladen</Button>
                </div>
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
      {contextHolder}
      <div className={styles.main}>
        <div className={styles.companyoverview}>
          <Card className={styles.companysettings} title={"Ihre Firma"} bordered={true}>
            {getCompanyInput()}
          </Card>
        </div>
        <div ref={userRef} className={styles.companyusers}>
          {getUserOverview()}
        </div>
        <Modal title={`Mitarbeiter @${( userTableData[memberToEdit] )? userTableData[memberToEdit].username : "FEHLER"} bearbeiten`} open={editMemberModal} onOk={() => {
          return true
        }}
        onCancel={() => {
          setEditMemberModal( false )
        }}
        footer={null}
        >
          {getRoleSelect()}
        </Modal>
        <Modal
          title={`Mitarbeiter ${( userTableData[memberToDelete] )
            ?userTableData[memberToDelete].firstname + " " + userTableData[memberToDelete].lastname
            : "FEHLER"} löschen?`}
          open={deleteMemberModal}
          footer={null}
          onOk={() => {
            return true
          }}
          onCancel={() => {
            setDeleteMemberModal( false )
          }}>
          <div className={styles.deleteMemberRow}>
            <Button
              type="primary"
              danger
              onClick={async () => {
                if( !userTableData[memberToDelete].wasInvited ) {
                  try{
                    await axios.post( "/api/company/member", { id:  userTableData[memberToDelete].id } );
                    setDeleteMemberModal( false );
                    setDeleteCounter( deleteCounter + 1 );
                  } catch {
                    messageApi.open( {
                      type: "error",
                      content: "Beim löschen ist etwas schiefgelaufen. Bitte versuche es erneut!"
                    } );
                  }
                }else{
                  const cleaned = company.invitedUsers.filter( ( elm: InvitedUser ) => {
                    return elm.email != userTableData[memberToDelete].email;
                  } );

                  try{
                    await updateData( "Company", user.Company, { invitedUsers: cleaned } );

                    setDeleteMemberModal( false );
                    setDeleteCounter( deleteCounter + 1 );
                  }catch{
                    messageApi.open( {
                      type: "error",
                      content: "Beim löschen ist etwas schiefgelaufen. Bitte versuche es erneut!"
                    } );
                  }
                }
              }}
            >
              Mitarbeiter löschen
            </Button>
          </div>
        </Modal>
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
