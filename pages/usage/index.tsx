import { Button, Card, Tooltip, Table, Tag, TourProps, Tour, Popover, List } from "antd";
import styles from "./usage.module.scss"
import { useEffect, useRef, useState } from "react";
import { GetServerSideProps } from "next";
import SidebarLayout from "../../components/Sidebar/SidebarLayout";
import { convertToCurrency, handleUndefinedTour } from "../../helper/architecture";
import { useAuthContext } from "../../components/context/AuthContext";
import { getDocWhere } from "../../firebase/data/getData";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  MailOutlined
} from "@ant-design/icons";
import Link from "next/link";
import { Usage } from "../../firebase/types/Company";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { User } from "../../firebase/types/User";
import updateData from "../../firebase/data/updateData";
import Invoice from "../../components/invoice/invoice";
import { useReactToPrint } from "react-to-print";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

const months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];


export interface InitialProps {
  Data: { paypalURL: string; };
}

export const getServerSideProps: GetServerSideProps = async () => {
    
  return {
    props: {
      Data: {
        paypalURL : process.env.PAYPALURL
      }
    }
  };
};



export default function Usage( props: InitialProps ) {
  const context = useAuthContext();
  const { login, user, company, calculations } = context
  const [ users, setUsers ] = useState( [] );
  const [open, setOpen] = useState<boolean>( !handleUndefinedTour( user.tour ).usage );

  const budgetRef = useRef( null );
  const statRef = useRef( null );
  const buyRef = useRef( null );
  const orderRef = useRef( null );

  const componentRef = useRef( null );

  const steps: TourProps["steps"] = [
    {
      title: "Nutzung und Credit-Budget",
      description: "Willkommen in den Nutzungsinformationen. Hier kannst du dein Credit-Budget überprüfen und Statistiken zur "+
      "Nutzung unseres Tools einsehen. Außerdem hast du die Möglichkeit, weitere Credits zu kaufen und deine bisherigen Bestellungen einzusehen.",
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
      title: "Credit-Budget",
      description: "Hier wird dein aktuelles Credit-Budget angezeigt. Die angegebene Zahl gibt dir einen Überblick darüber, wie viele Credits"+
      " du noch zur Verfügung hast.",
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
      description: "Solltet du den Bedarf haben, mehr E-Mails zu optimieren, kannst du zusätzliche E-Mail-Kapazitäten hier direkt erwerben.",
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
      title: "Statistik",
      description: "Hier findest du eine kurze und klare Übersicht darüber, wie viele Credits du über das aktuelle Jahr mit Siteware.Mail bereits verbraucht hast.",
      target: () => statRef.current,
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
      title: "Deine bisherigen Einkäufe",
      description: "In dieser Tabelle findet ihr eine Übersicht deiner bisherigen Einkäufe bei Siteware.Mail. Hier hast du die Möglichkeit, "+
      "Rechnungen herunterzuladen und unterbrochene Einkäufe abzuschließen.",
      target: () => orderRef.current,
      nextButtonProps: {
        children: (
          "Alles klar"
        ),
        onClick: async () => {
          const currstate = user.tour;
          currstate.usage = true;
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

  useEffect( () => {
    const load = async () => {
      const { result, error } = await getDocWhere( "User", "Company", "==", user.Company );
      if( !error ){
        //console.log(result);
        setUsers( result );
      }else{
        setUsers( [] );
      }
    }

    load();
  }, [company, user.Company] );


  const calculateMails = () => {
    return Math.floor( company.tokens/calculations.tokensPerMail );
  }

  const handlePrint = useReactToPrint( {
    content: () => componentRef.current
  } );

  const purchasecolumns = [
    {
      title: "Bestellung",
      dataIndex: "order",
      key: "order",
      render: ( _, obj ) => {
        const orderState = () => {
          switch( obj.state ){
          case "completed":
            return(
              <Tag icon={<CheckCircleOutlined />} color="success">
                  abgeschlossen
              </Tag>
            );
                        
          case "awaiting_payment":
            return(
              <Tag icon={<ClockCircleOutlined />} color="warning">
                  Wartestellung
              </Tag>
            );
          default:
            return(
              <Tag icon={<CloseCircleOutlined />} color="error">
                  abgebrochen
              </Tag>
            );
          }
        }

        return(
          <div className={styles.singleorderrow}>
            <div className={styles.orderid}>#{obj.id}</div>
            <div className={styles.orderdate}>{new Date( obj.timestamp * 1000 ).toLocaleString( "de",{ timeZone:"Europe/Berlin", timeZoneName: "short" } )}</div>
            <div className={styles.orderstate}>{orderState()}</div>
          </div>
        );
      }
    },
    {
      title: "Details",
      dataIndex: "details",
      key: "details",
      render: ( _, obj ) => {
        return <span className={styles.detailsinfo}>{convertToCurrency(obj.amount)} ({Math.floor( obj.tokens/1000 )} Credits)</span>
      }
    },
    {
      title: "Aktionen",
      dataIndex: "actions",
      key: "actions",
      render: ( _, obj ) => {
        if( obj.state == "awaiting_payment" ){
          return (
            <div className={styles.actionrow}>
              <div className={styles.singleaction}>
                <Link href={`${props.Data.paypalURL}/checkoutnow?token=${obj.id}`}>
                  <Tooltip title={"Einkauf fortsetzen"}>
                    <ShoppingCartOutlined style={{ fontSize: 20 }}/>
                  </Tooltip>
                </Link>
              </div>
            </div>
          );
        }else{
          return (
            <div className={styles.actionrow}>
              <div className={styles.singleaction}>
                <Tooltip title={"Rechnung herunterladen"}>
                  <FileTextOutlined style={{ fontSize: 20 }} onClick={handlePrint}/>
                  <div style={{ display: "none" }}>
                    <Invoice company={company} user={user} order={obj} ref={componentRef}></Invoice>
                  </div>
                </Tooltip>
              </div>
            </div>
          );
        }
      }
    }
  ];

  const getTokenDetailInformation = () => {
    return(
      <div>
        <p>Entspricht:</p>
        <List>
          <List.Item><span className={styles.listarrow}><MailOutlined /></span>~{calculateMails()} Mails</List.Item>
        </List>
      </div>
    );
  }

  
  return (
    <SidebarLayout context={context}>
      <div className={styles.main}>
        <div className={styles.companyoverview}>
          <Card ref={budgetRef} className={styles.tokeninformation} title={"Credits"} bordered={true}>
            <div className={styles.tokeninfocard}>
              <h2>
                Dein Credit-Budget
                <Popover content={getTokenDetailInformation} placement="bottom" title="Details">
                  <span className={styles.tokeninformation}><InfoCircleOutlined /></span>
                </Popover>
              </h2>
              <div className={styles.quotarow}>
                <div className={styles.tokenbudget}>{( company.unlimited )? "∞" : `${Math.floor( company.tokens/1000 )}`} Credits</div>
              </div>
            </div>
            <div className={styles.generatebuttonrow}>
              <Link href={"/upgrade"}>
                {( !company.unlimited )? <Button ref={buyRef} className={styles.backbutton} type='primary'>Weitere Credits kaufen</Button> : <></>}
              </Link>
            </div>
          </Card>
          <Card ref={statRef} className={styles.tokenusage} title={"Credit-Verbrauch"} bordered={true}>
            <div className={styles.tokeninfocard}>
              <h2>Verbrauch</h2>
              <div className={styles.usageinfo}>
                                
                <div className={styles.barcontainer}>
                  <Bar
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "top" as const
                        },
                        title: {
                          display: false,
                          text: "Chart.js Bar Chart"
                        }
                      }
                    }}
                    data={{
                      labels:  months,
                      datasets: [
                        {
                          label: "Credits",
                          data: months.map( ( label, idx ) => {
                            let sum = 0;
                            users.forEach( ( su: User ) => {
                              su.usedCredits.forEach( ( usage: Usage ) => {
                                if( usage.month == idx+1 && usage.year == new Date().getFullYear() ){
                                  sum += parseFloat( ( usage.amount/1000 ).toFixed( 2 ) );
                                }
                              } );
                            } )
                            return sum;
                          } ),
                          backgroundColor: "rgba(16, 24, 40, 0.8)"
                        }
                      ]
                    }}
                  />
                </div>

              </div>
            </div>
                        
          </Card>
        </div>
        <Card ref={orderRef} title={"Einkäufe"} bordered={true}>
          <Table rowKey="id" scroll={{ x: true }} dataSource={company.orders} columns={purchasecolumns} />
        </Card>
        <Tour open={open} onClose={async () => {
          const currstate = user.tour;
          currstate.usage = true;
          updateData( "User", login.uid, { tour: currstate } );
          setOpen( false );
        }} steps={steps} />
      </div>
    </SidebarLayout>
  );
}
