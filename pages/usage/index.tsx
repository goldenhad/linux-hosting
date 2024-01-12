import { Button, Card, Tag, TourProps, Tour, Popover, List, Collapse, Pagination, Modal, Form, Input, Tabs } from "antd";
import styles from "./usage.module.scss"
import { useEffect, useRef, useState } from "react";
import { GetServerSideProps } from "next";
import SidebarLayout from "../../components/Sidebar/SidebarLayout";
import { convertToCurrency, handleUndefinedTour, normalizeTokens } from "../../helper/architecture";
import { useAuthContext } from "../../components/context/AuthContext";
import { getDocWhere } from "../../firebase/data/getData";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  MailOutlined,
  LeftOutlined,
  RightOutlined
} from "@ant-design/icons";
import Link from "next/link";
import { Order, Usage } from "../../firebase/types/Company";
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
import moment from "moment";
import { isMobile } from "react-device-detect";
import { logEvent, settings } from "firebase/analytics";
import { analytics } from "../../db";
import { getPDFUrl } from "../../helper/invoice";
import axios from "axios";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useRouter } from "next/router";
import RechargeForm from "../../components/RechargeForm/RechargeForm";
import { CardElement, Elements } from "@stripe/react-stripe-js";
import getStripe from "../../helper/stripe";
import { convertTokensToPrice, priceToIndex } from "../../helper/price";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

const months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const ordersperpage = 10;
const thisyear = new Date().getFullYear();
const stripePromise = getStripe();


export const getServerSideProps: GetServerSideProps = async () => {
    
  return {
    props: {
    }
  };
};



export default function Usage( ) {
  const context = useAuthContext();
  const { role, login, user, company, calculations, invoice_data } = context
  const [ users, setUsers ] = useState( [] );
  const [open, setOpen] = useState<boolean>( !handleUndefinedTour( user.tour ).usage );
  const [orderpage, setOrderPage] = useState(1);
  const [ visibleYear, setVisibleYear ] = useState(new Date().getFullYear());
  const [ lowerBound, setLowerBound ] = useState(1970);
  const { push } = useRouter();
  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);
  const [threshold, setThreshold] = useState(0);
  const [tokens, setTokens] = useState(0);


  const budgetRef = useRef( null );
  const statRef = useRef( null );
  const buyRef = useRef( null );
  const orderRef = useRef( null );

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
      description: "Hier findest du eine kurze und klare Übersicht darüber, wie viele Credits du über das aktuelle Jahr mit Siteware business bereits verbraucht hast.",
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
      description: "In dieser Tabelle findet ihr eine Übersicht deiner bisherigen Einkäufe bei Siteware business. Hier hast du die Möglichkeit, "+
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

  useEffect( () => {
    if(user){
      let min = Number.MAX_SAFE_INTEGER;

      user.usedCredits.forEach((credits: Usage) => {
        if (credits.year < min) {
          min = credits.year;
        }
      });

      setLowerBound(min);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  const calculateMails = () => {
    return Math.floor( company.tokens/calculations.tokensPerMail );
  }

  const orderState = (obj) => {
    switch( obj.state ){
    case "accepted":
      return(
        <Tag className={styles.statustag} icon={<CheckCircleOutlined />} color="success">
            abgeschlossen
        </Tag>
      );
    case "subscribed":
      return(
        <Tag className={styles.statustag} icon={<CheckCircleOutlined />} color="success">
            abgeschlossen
        </Tag>
      );
                  
    case "awaiting_payment":
      return(
        <Tag className={styles.statustag} icon={<ClockCircleOutlined />} color="warning">
            Wartestellung
        </Tag>
      );
    default:
      return(
        <Tag className={styles.statustag} icon={<CloseCircleOutlined />} color="error">
            abgebrochen
        </Tag>
      );
    }
  }

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

  const PurchaseInformation = () => {
    if(company.orders.length > 0){
      return(
        <>
          <Collapse items={getOrderItems()} /><div className={styles.orderpagination}>
            <Pagination onChange={(page: number) => {
              setOrderPage(page);
            } } defaultCurrent={1} pageSize={ordersperpage} total={company.orders.length} />
          </div>
        </>
      );
    }else{
      return(<div className={styles.nopurchase}>Noch keine Einkäufe</div>);
    }
  }

  const getOrderItems = () => {
    const items = [];
    const orderedorders = company.orders.toSorted((a: Order, b: Order) => {
      if(a.timestamp < b.timestamp){
        return 1;
      }else if(a.timestamp > b.timestamp){
        return -1;
      }else{
        return 0
      }
    });
    
    for(let i=(orderpage - 1); i  < ordersperpage; i++){
      if(i < company.orders.length){
        const order = orderedorders[i];
        const orderdate = new Date( order.timestamp * 1000 );
        const datestring = moment(orderdate).format("DD.MM.YYYY");

        items.push({
          key: i,
          label: <div className={styles.singleorder}>
            <div className={styles.ordertitle}>
              <span className={styles.orderdate}>{datestring}</span>
              {isMobile? <br/>: <></>}<span>{`Bestellung #${order.invoiceId}`}</span>
            </div>
            <div className={styles.orderstate}>{orderState(order)}</div>
          </div>,
          children: <div className={styles.orderoverview}>
            <div className={styles.orderdetails}>
              <h3>Details</h3>
              <List>
                <List.Item className={styles.singledetail}><div className={styles.description}>Bestellnummer:</div> <div>{order.invoiceId}</div></List.Item>
                <List.Item className={styles.singledetail}>
                  <div className={styles.description}>Art:</div>
                  <div>{(order.type == "plan")? "Abonnement": "Bestellung"}</div></List.Item>
                <List.Item className={styles.singledetail}><div className={styles.description}>Bezahlmethode:</div> <div>{order.method}</div></List.Item>
                <List.Item className={styles.singledetail}><div className={styles.description}>Betrag:</div> <div>{convertToCurrency(order.amount)}</div></List.Item>
                <List.Item className={styles.singledetail}>
                  <div className={styles.description}>Credits:</div> <div>{normalizeTokens(order.tokens).toFixed(0)}</div>
                </List.Item>
              </List>
            </div>

            <div className={styles.orderactions}>
              <h3>Aktionen</h3>
              <List>
                <List.Item className={styles.actiondetail}>
                  <div className={styles.description}>Rechnung herunterladen:</div>
                  <div style={{ overflow: "none" }}>
                    <FileTextOutlined style={{ fontSize: 20 }} onClick={() => {
                      getPDFUrl(role, user, company, order).download(`Siteware_business_invoice_${order.invoiceId}`)
                    }}/>
                    <div style={{ display: "none", overflow: "none" }}>
                    </div>
                  </div>
                </List.Item>
              </List>
            </div>
          </div>
        });
      }
    }
     
    return items;
  }

  const getBuyOptions = () => {
    if(company?.plan && company?.plan.state == "active"){
      return(
        <>
          <div className={styles.generatebuttonrow}>
            <Link href={"/upgrade"}>
              {( !company.unlimited )? <Button ref={buyRef} className={styles.backbutton} onClick={() => {
                logEvent(analytics, "buy_tokens", {
                  currentCredits: company.tokens
                });
              }} type='primary'>Weitere Credits kaufen</Button> : <></>}
            </Link>
          </div>
          <div className={styles.planwindow}>
            <div className={styles.plantitle}>
            Automatisches Nachladen ist aktiv
            </div>
            <div className={styles.planinfo}>
              Das automatische Auffüllen ist aktiv.
              Dein Konto wird automatisch um
              <span className={styles.creds}> {Math.round(normalizeTokens(company.plan.tokens))}</span> Credits aufgestockt, wenn dein Credit-Budget unter 
              <span className={styles.creds}> {company.plan.threshold}</span> Credits fällt.
            </div>
            <Button type="link" className={styles.planedit} onClick={() => {
              setRechargeModalOpen(true);
            }}>anpassen</Button>
            <Button onClick={async () => {
              await axios.post("/api/payment/createbilling", { 
                amount: invoice_data.prices[priceToIndex(convertTokensToPrice(company.plan?.tokens))],
                customer: company.customerId
              })
            }}>
              TEST
            </Button>
          </div>
        </>
      );
    }else{
      return(
        <>
          <div className={styles.generatebuttonrow}>
            <Link href={"/upgrade"}>
              {( !company?.unlimited )? <Button ref={buyRef} className={styles.backbutton} onClick={() => {
                logEvent(analytics, "buy_tokens", {
                  currentCredits: (company.tokens)? company.tokens: 0
                });
              }} type='primary'>Weitere Credits kaufen</Button> : <></>}
            </Link>
          </div>
          <div className={styles.planwindow}>
            <div className={styles.plantitle}>
            Automatisches Nachladen aktivieren
            </div>
            <div className={styles.planinfo}>
              Schalte die automatische Aufladung ein, damit dein Credit-Konto immer gefüllt bleibt.
            </div>
            <Button type="link" className={styles.planedit} onClick={() => {
              setRechargeModalOpen(true)
            }}>aktivieren</Button>
          </div>
        </>
      );
    }
  }

  const credittabsitems = [
    {
      key: "1",
      label: "Credit-Budget",
      children: <>
        
        <div className={styles.tokeninfocard}>
          <h2>
          Dein Credit-Budget
            <Popover content={getTokenDetailInformation} placement="bottom" title="Details">
              <span className={styles.tokeninformationicon}><InfoCircleOutlined /></span>
            </Popover>
          </h2>
          <div className={styles.quotarow}>
            <div className={styles.tokenbudget}>{( company?.unlimited )? "∞" : `${Math.floor(normalizeTokens(company.tokens))}`} Credits</div>
          </div>
        </div>
        {getBuyOptions()}
      </>
    },
    {
      key: "2",
      label: "Bezahlmethode",
      children: <>
        <div className={styles.tokeninfocard}>
          <h2>
            Deine Bezahlmethode
          </h2>
          <div className={styles.quotarow}>
            <Card className={styles.cardcard}>
              <Elements stripe={stripePromise}>
                <CardElement />
              </Elements>
            </Card>
            <h3>Noch keine Bezahlmethode hinzugefügt</h3>
            <Button>Jetzt Bezahlmethode hinzufügen</Button>
          </div>
        </div>
      </>
    }
  ]

  
  return (
    <SidebarLayout context={context}>
      <div className={styles.main}>
        <div className={styles.companyoverview}>
          <Card ref={budgetRef} className={styles.tokeninformation} title={"Credits"} bordered={true}>
            <Tabs items={credittabsitems}/>
            
          </Card>
          <Card ref={statRef} className={styles.tokenusage} title={"Credit-Verbrauch"} bordered={true}>
            <div className={styles.tokeninfocard}>
              <div className={styles.stattitlerow}>
                <h2>Verbrauch</h2>
                <div className={styles.switchyearrow}>
                  <Button className={`${styles.yearswitchbutton} ${styles.left}`} disabled={visibleYear <= lowerBound} onClick={() => {
                    if(visibleYear > lowerBound){
                      setVisibleYear(visibleYear - 1);
                    } 
                  }}><LeftOutlined /></Button>
                  <Button className={`${styles.yearswitchbutton} ${styles.right}`} disabled={visibleYear >= thisyear} onClick={() => {

                    if(visibleYear < thisyear ){
                      setVisibleYear(visibleYear + 1); 
                    }
                  }}><RightOutlined /></Button>
                </div>
              </div>
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
                          label: `Credits ${visibleYear}`,
                          data: months.map( ( label, idx ) => {
                            let sum = 0;
                            users.forEach( ( su: User ) => {
                              if(su.usedCredits){
                                su.usedCredits.forEach( ( usage: Usage ) => {
                                  if( usage.month == idx+1 && usage.year == visibleYear ){
                                    sum += parseFloat( ( usage.amount/1000 ).toFixed( 2 ) );
                                  }
                                });
                              }
                            })
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
          <PurchaseInformation />
        </Card>
        <Modal title="Automatisches Aufladen aktivieren" open={rechargeModalOpen} footer={null} onCancel={() => {
          setRechargeModalOpen(false)
        }}>
          <p className={styles.rechargeinformation}>
            Das automatische Nachladen sorgt dafür, dass dein Credit-Konto immer ausreichend gedeckt ist. 
            Du kannst einen bestimmten Wert festlegen, und sobald dein Credit-Budget unter diesen Wert fällt, bucht das System automatisch 
            neue Credits nach. So stellst du sicher, dass du immer genügend Credits zur Verfügung hast, ohne manuell nachladen zu müssen.
          </p>
          <Elements stripe={stripePromise}>
            <RechargeForm
              defaultstate={{ threshold: company.plan?.threshold, tokens: priceToIndex(convertTokensToPrice(company.plan?.tokens)) }}
              user={user}
              company={company}
              role={role}
              onCustomerApprove={() => {
                setRechargeModalOpen(false)
              }}
            />
          </Elements>
          
        </Modal>
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
