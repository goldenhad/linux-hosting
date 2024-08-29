import { Button, Card, Tag, TourProps, Tour, List, Collapse, Pagination, Modal, Tabs, message, Alert } from "antd";
import styles from "./usage.module.scss"
import { useEffect, useRef, useState } from "react";
import { GetServerSideProps } from "next";
import SidebarLayout from "../../lib/components/Sidebar/SidebarLayout";
import { convertToCurrency, handleUndefinedTour } from "../../lib/helper/architecture";
import { useAuthContext } from "../../lib/components/context/AuthContext";
import { getDocWhere } from "../../lib/firebase/data/getData";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  LeftOutlined,
  RightOutlined,
  DeleteOutlined,
  CreditCardOutlined
} from "@ant-design/icons";
import Link from "next/link";
import { Order, PaymentMethod, Usage } from "../../lib/firebase/types/Company";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from "chart.js";
import updateData from "../../lib/firebase/data/updateData";
import moment from "moment";
import { isMobile } from "react-device-detect";
import { logEvent } from "firebase/analytics";
import { analytics } from "../../db";
import axios from "axios";
import RechargeForm from "../../lib/components/RechargeForm/RechargeForm";
import { Elements } from "@stripe/react-stripe-js";
import getStripe from "../../lib/helper/stripe";
import AddCreditCardForm from "../../lib/components/AddCreditCardForm/AddCreditCardForm";
import UsageStatistic from "../../lib/components/UsageStatistic/UsageStatistic";
import { TokenCalculator, toGermanCurrencyString } from "../../lib/helper/price";
import { useRouter } from "next/router";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

// Defines the visible orders per page
const ordersperpage = 10;
// Gets the current year
const thisyear = new Date().getFullYear();

const stripePromise = getStripe();

/**
 * Get the url of the application
 */
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {
      redirect: process.env.NEXT_PUBLIC_BASEURL
    }
  };
};


/**
 * Displays the orders, the credit account and the usage statistic of the company
 * @constructor
 */
export default function Usage() {
  const context = useAuthContext();
  const { role, login, user, company, calculations } = context
  const [ users, setUsers ] = useState( [] );
  const [open, setOpen] = useState<boolean>( !handleUndefinedTour( user.tour ).usage );
  const [orderpage, setOrderPage] = useState(1);
  const [ visibleYear, setVisibleYear ] = useState(new Date().getFullYear());
  const [ lowerBound, setLowerBound ] = useState(1970);
  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);
  const [ addPaymentOpen, setAddPaymentOpen ] = useState(false);
  const [ deletePaymentMethod, setDeletePaymentMethod ] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [ activeTab, setActiveTab ] = useState("1");
  const [ calculator ] = useState(new TokenCalculator(calculations));
  const router = useRouter();


  const budgetRef = useRef( null );
  const statRef = useRef( null );
  const buyRef = useRef( null );
  const orderRef = useRef( null );

  // Define the tutorial tour
  const steps: TourProps["steps"] = [
    {
      title: "Nutzung und Budget",
      description: "Willkommen in den Nutzungsinformationen. Hier kannst du dein Budget überprüfen und Statistiken zur "+
      "Nutzung unseres Tools einsehen. Außerdem hast du die Möglichkeit, weiteres Budget nachzubuchen und deine bisherigen Bestellungen einzusehen.",
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
      title: "Budget",
      description: "Hier wird dein aktuelles Budget angezeigt. Die angegebene Zahl gibt dir einen Überblick darüber, wie viel Budget"+
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
      description: "Solltest du den Bedarf haben, mehr E-Mails zu optimieren, kannst du zusätzliche E-Mail-Kapazitäten hier direkt erwerben.",
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
      description: "Hier findest du eine kurze und klare Übersicht darüber, wie viele Budget du über das aktuelle Jahr mit Siteware bereits verbraucht hast.",
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
      description: "In dieser Tabelle findest du eine Übersicht deiner bisherigen Einkäufe bei Siteware. Hier hast du die Möglichkeit, "+
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

  /**
   * Load the users belonging to the company
   */
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

  /**
   * Sets the earliest year of credit usage over all users
   */
  useEffect( () => {
    if(user && user.usedCredits){
      let min = Number.MAX_SAFE_INTEGER;

      user.usedCredits.forEach((credits: Usage) => {
        if (credits.year < min) {
          min = credits.year;
        }
      });

      setLowerBound(min);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /**
   * Resolve the tag display of the given Order
   * @param obj Order object
   */
  const orderState = (obj: Order) => {
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

  /**
   * Subcomponent to display a paginated collapse of orders, or a message if the company has no recorded orders
   * @constructor
   */
  const OrderList = () => {
    if(company.orders.length > 0){
      const orderitems = getOrderItems();

      return(
        <>
          <Collapse items={orderitems} /><div className={styles.orderpagination}>
            <Pagination onChange={(page: number) => {
              setOrderPage(page);
            } } defaultCurrent={orderpage} pageSize={ordersperpage} total={company.orders.length} />
          </div>
        </>
      );
    }else{
      return(<div className={styles.nopurchase}>Noch keine Einkäufe</div>);
    }
  }

  /**
   * Returns a collapsible compatible array of entries
   */
  const getOrderItems = () => {
    const items = [];

    // Sorts the list of orders by timestamp
    const orderedorders = company.orders.toSorted((a: Order, b: Order) => {
      if(a.timestamp < b.timestamp){
        return 1;
      }else if(a.timestamp > b.timestamp){
        return -1;
      }else{
        return 0
      }
    });

    // Calculate the offset of the order pagination
    const offset = (orderpage - 1) * ordersperpage;

    // Iterate over the orders currently visible in the page
    for(let i=0; i  < ordersperpage; i++){
      // Validate the index
      if(i + offset < company.orders.length){
        // Ge the order
        const order = orderedorders[i + offset];
        // Calculate the date from the timestamp
        const orderdate = new Date( order.timestamp * 1000 );
        // Convert the calculated date to a string
        const datestring = moment(orderdate).format("DD.MM.YYYY");

        // Add the JSX of the collapsible item to the array
        items.push({
          key: i + offset,
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
                  <div>{(order.type == "recharge")? "Automatisches Nachfüllen": "Bestellung"}</div></List.Item>
                <List.Item className={styles.singledetail}><div className={styles.description}>Bezahlmethode:</div> <div>{order.method}</div></List.Item>
                <List.Item className={styles.singledetail}><div className={styles.description}>Betrag:</div> <div>{convertToCurrency(order.amount)}</div></List.Item>
              </List>
            </div>

            {(order.state == "accepted")? <div className={styles.orderactions}>
              <h3>Aktionen</h3>
              <List>
                <List.Item className={styles.actiondetail}>
                  <div className={styles.description}>Rechnung herunterladen:</div>
                  <div style={{ overflow: "none" }}>
                    <Button onClick={async () => {
                      const invoiceurlreq = await axios.get(`/api/payment/invoice?orderid=${order.id}`);
                      if(invoiceurlreq.data.message){
                        const invoiceurl = invoiceurlreq.data.message
                        router.push(invoiceurl);
                      }
                    }}><FileTextOutlined /></Button>
                    <div style={{ display: "none", overflow: "none" }}>
                    </div>
                  </div>
                </List.Item>
              </List>
            </div>: <></>}
          </div>
        });
      }
    }
     
    return items;
  }

  /**
   * Display an information box depending on the state of the automatic reload feature
   */
  const getBuyOptions = () => {
    // Check wether the user is allowed to buy credits
    const userCanBuyCredits = !role.isCompany || role.canEditCompanyDetails || role.canSetupCompany;

    if(company?.paymentMethods?.length > 0){
      if(company?.plan && company?.plan.state == "active"){
        return(
          <>
            <div className={styles.generatebuttonrow}>
              <Link href={"/upgrade"}>
                {( !company.unlimited )? <Button ref={buyRef} className={styles.backbutton} onClick={() => {
                  logEvent(analytics, "buy_tokens", {
                    currentCredits: company?.tokens
                  });
                }} type='primary' disabled={!userCanBuyCredits}>Weiteres Budget dazubuchen</Button> : <></>}
              </Link>
            </div>
            <div className={styles.planwindow}>
              <div className={styles.plantitle}>
              Automatisches Nachladen ist aktiv
              </div>
              <div className={styles.planinfo}>
                Das automatische Nachladen ist aktiv.
                Dein Konto wird automatisch um <span className={styles.creds}>
                  {toGermanCurrencyString(calculator.indexToPrice(company.plan?.product))}</span> aufgestockt, wenn dein Budget unter 
                <span className={styles.creds}> {toGermanCurrencyString(company?.plan?.threshold)}</span> fällt.
              </div>
              {(!userCanBuyCredits)? <></>: <Button type="link" className={styles.planedit} onClick={() => {
                setRechargeModalOpen(true);
              }}>anpassen</Button>}
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
                }} type='primary' disabled={!userCanBuyCredits}>Weiteres Budget dazubuchen</Button> : <></>}
              </Link>
            </div>
            <div className={styles.planwindow}>
              <div className={styles.plantitle}>
              Automatisches Nachladen aktivieren
              </div>
              <div className={styles.planinfo}>
                Schalte die automatische Aufladung ein, damit dein Konto immer gefüllt bleibt.
              </div>
              <Button type="link" className={styles.planedit} onClick={() => {
                setRechargeModalOpen(true)
              }} disabled={!userCanBuyCredits}>aktivieren</Button>
            </div>
          </>
        );
      }
    }else{
      return(
        <>
          <div className={styles.generatebuttonrow}>
            <Link href={"/upgrade"}>
              {( !company?.unlimited )? <Button ref={buyRef} className={styles.backbutton} onClick={() => {
                logEvent(analytics, "buy_tokens", {
                  currentCredits: (company.tokens)? company.tokens: 0
                });
              }} type='primary' disabled={!userCanBuyCredits}>Weiteres Budget dazubuchen</Button> : <></>}
            </Link>
          </div>
          <div className={styles.planwindow}>
            <div className={styles.plantitle}>
            Automatisches Nachladen aktivieren
            </div>
            <div className={styles.planinfo}>
              Um das automatische Nachladen zu aktivieren musst du eine Bezahlmethode hinzufügen.
            </div>
            <Button type="link" className={styles.planedit} onClick={() => {
              setActiveTab("2")
            }} disabled={!userCanBuyCredits} >Jetzt hinzufügen</Button>
          </div>
        </>
      );
    }
  }

  /**
   * Function to call if the user requests to remove the saved payment method
   * @param method Id of the method to be removed
   */
  const removePaymentMethod = async (method: string) => {
    // Call the API and detach the payment method at stripe
    const detachoperation = await axios.post("/api/payment/detachPaymentMethod", {
      method: method
    });

    // If the API call to stripe was successfull...
    if(detachoperation.status == 200){
      const currentplan = company.plan;
      // check if a plan is in use by the company
      if(currentplan){
        // Set the plan of the company to inactive
        currentplan.state = "inactive";
        await updateData("Company", user.Company, { paymentMethods: [], plan: currentplan });
      }else{
        // If no plan is defined, just clear the payment methods
        await updateData("Company", user.Company, { paymentMethods: [] });
      }
      messageApi.success("Bezahlmethode erfolgreich entfernt!")
    }else{
      messageApi.error("Bezahlmethode konnte nicht entfernt werden!")
    }
  }

  /**
   * Display the defined payment methods of the company
   */
  const getSetups = () => {
    // Check the capabilities of the user
    const userCanBuyCredits = !role.isCompany || role.canEditCompanyDetails || role.canSetupCompany;

    if(company?.paymentMethods){
      if(company.paymentMethods.length > 0){
        return <>
          {company.paymentMethods.map((method: PaymentMethod, idx: number) => {
            return (
              <Card className={styles.paymentmethod} key={idx}>
                <div className={styles.container}>
                  <div className={styles.name}><CreditCardOutlined className={styles.cardicon}/>{method.name}</div>
                  <div className={styles.actions}>
                    {(!userCanBuyCredits)? <></>: <div onClick={async () => {
                      setDeletePaymentMethod(true);
                    }}><DeleteOutlined className={styles.trashicon} /></div>}
                  </div>
                </div>
              </Card>
            );
          })}
          {(company.paymentMethods[0].lastState == "error")?
            <Alert
              className={styles.paymenterror}
              showIcon
              banner
              type="error"
              message={"Die letzte Abbuchung von deiner Bezahlmethode ist fehlgeschlagen. Bitte prüfe deine Zahlungsdaten!"}
            />:
            <></>
          }
        </>
      }else{
        return(<div className={styles.addPayment}>
          <div className={styles.buttoncontainer}>
            <div className={styles.buttonrow}>
              <Button type="primary" onClick={() => {
                setAddPaymentOpen(true)
              }} disabled={!userCanBuyCredits}>Hinzufügen</Button>
            </div>
          </div>
        </div>  
        );
      }
    }else{
      return(<div className={styles.addPayment}>
        <div className={styles.buttoncontainer}>
          <div className={styles.buttonrow}>
            <Button type="primary" onClick={() => {
              setAddPaymentOpen(true)
            }} disabled={!userCanBuyCredits}>Hinzufügen</Button>
          </div>
        </div>
      </div>  
      );
    }
  }


  const credittabsitems = [
    {
      key: "1",
      label: "Budget",
      children: <>
        
        <div className={styles.tokeninfocard}>
          <h2>Dein Budget</h2>
          <div className={styles.quotarow}>
            <div className={styles.tokenbudget}>
              {(company)? toGermanCurrencyString(company.tokens): toGermanCurrencyString(0)}
            </div>
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
            {getSetups()}
          </div>
        </div>
      </>
    }
  ]
  
  return (
    <SidebarLayout context={context}>
      {contextHolder}
      <div className={styles.main}>
        <div className={styles.companyoverview}>
          <Card ref={budgetRef} className={styles.tokeninformation} title={"Budget"} bordered={true}>
            <Tabs items={credittabsitems} activeKey={activeTab} onChange={(key) => {
              setActiveTab(key)
            }}/>
            
          </Card>
          <Card ref={statRef} className={styles.tokenusage} title={"Budgetnutzung"} bordered={true}>
            <div className={styles.tokeninfocard}>
              <div className={styles.stattitlerow}>
                <h2>Nutzung</h2>
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
                <UsageStatistic visibleYear={visibleYear} users={users}/>
              </div>
            </div>
                        
          </Card>
        </div>
        <Card ref={orderRef} title={"Einkäufe"} bordered={true}>
          <OrderList />
        </Card>
        <Modal mask={true} title="Automatisches Aufladen aktivieren" open={rechargeModalOpen} footer={null} onCancel={() => {
          setRechargeModalOpen(false)
        }}>
          <p className={styles.rechargeinformation}>
            Das automatische Nachladen sorgt dafür, dass dein Konto immer ausreichend gedeckt ist. 
            Du kannst einen bestimmten Wert festlegen, und sobald dein Budget unter diesen Wert fällt, bucht das System automatisch 
            einen Betrag nach. So stellst du sicher, dass du immer genügend Budget zur Verfügung hast, ohne manuell nachladen zu müssen.
          </p>
          <Elements stripe={stripePromise}>
            <RechargeForm
              defaultstate={{ threshold: company.plan?.threshold, product: company.plan?.product }}
              user={user}
              company={company}
              role={role}
              calculations={calculations}
              onCustomerApprove={() => {
                setRechargeModalOpen(false)
              }}
            />
          </Elements>
        </Modal>

        <Modal title="Bezahlmethode hinzufügen" open={addPaymentOpen} footer={null} onCancel={() => {
          setAddPaymentOpen(false)
        }}>
          <p className={styles.rechargeinformation}>
            Füge jetzt eine Bezahlmethode hinzu. Die Karte kann jederzeit wieder entfernt werden.
          </p>
          <Elements stripe={stripePromise}>
            <AddCreditCardForm company={company} user={user} messageApi={messageApi} onSuccess={() => {
              setAddPaymentOpen(false)
            }}/>
          </Elements>
        </Modal>

        <Modal title="Bezahlmethode löschen" open={deletePaymentMethod} footer={null} onCancel={() => {
          setDeletePaymentMethod(false)
        }}>
          <p className={styles.rechargeinformation}>
            Soll die Bezahlmethode wirklich entfernt werden? Automatische Nachbuchungen werden damit deaktiviert!
          </p>
          
          <div className={styles.buttonrow}>
            <Button danger={true} onClick={() => {
              if(company.paymentMethods.length > 0){
                removePaymentMethod(company.paymentMethods[0].methodId);
                setDeletePaymentMethod(false);
              }
            }}>Bezahlmethode entfernen</Button>
          </div>
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
