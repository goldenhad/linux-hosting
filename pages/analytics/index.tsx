import {
  Card, Modal, Popover,
  Table, Tag
} from "antd";
import styles from "./analytics.module.scss"
import { useEffect, useState } from "react";
import { GetServerSideProps } from "next";
import SidebarLayout from "../../components/Sidebar/SidebarLayout";
import { useRouter } from "next/router";
import { useAuthContext } from "../../components/context/AuthContext";
import { getAllDocs, getDocWhere } from "../../firebase/data/getData";


import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from "chart.js";
import { User } from "../../firebase/types/User";
import { toGermanCurrencyString } from "../../helper/price";
import { CodeOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { Line } from "react-chartjs-2";
import axios from "axios";
import moment from "moment";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

/**
 * Type of the props to be passed to the client from the server
 */
export interface InitialProps {
    Data: { currentMonth: number, currentYear: number; };
}

/**
 * Serverside code to execute before pageload
 */
export const getServerSideProps: GetServerSideProps = async () => {
  const datum = new Date();

  return {
    props: {
      Data: {
        currentMonth: datum.getMonth() + 1,
        currentYear: datum.getFullYear()
      }
    }
  };
};


export default function Company( props: InitialProps ) {
  const context = useAuthContext();
  const { login, user, company, role } = context;
  const [ companies, setCompanies ] = useState([]);
  const [ userCompanies, setUserCompanies ] = useState([]);
  const [ members, setMembers ] = useState([]);
  const [ memberModalOpen, setMemberModalOpen ] = useState(false);
  const [ companyToLoadMembersFrom, setCompanyToLoadMembersFrom ] = useState(-1);
  const [ membersLoading, setMembersLoading ] = useState(true);

  const router = useRouter();

  // Redirect users if they are not a company
  useEffect( () => {
    if( !role.canViewAnalytics ) {
      router.push( "/" );
    }
  }, [role.isCompany, router] );

  // Load the list of users belonging to the company
  useEffect( () => {
    /**
         * Async function to load users belonging to the company
         */
    const load = async () => {
      // Query the users from the database that belong to the same company as the user
      const { result, error } = await getAllDocs("Company");
      // eslint-disable-next-line
      const companies: Array<any> = [];
      const userComps: Array<any> = [];

      for (const obj of result) {
        if(obj.name != ""){
          const { result, error } = await getDocWhere("User", "Company", "==", obj.uid);
          const adminrecIdx = result.findIndex((user) => {
            return user.Role == "Company-Admin";
          });

          if(adminrecIdx != -1){
            const metadata = await axios.post("/api/account/metadata", { uid: result[adminrecIdx].id });
            obj.created = metadata.data.message.creationTime;
          }

          obj.members = result.length;
          companies.push(obj);
        }else{
          const { result, error } = await getDocWhere("User", "Company", "==", obj.uid);
          if(result.length > 0){
            if(result[0]){
              obj.user = result[0];
              userComps.push(obj);
            }
          }
        }
      }

      setCompanies(companies);
      setUserCompanies(userComps);
    }

    // Call the async function to load the user table
    load();
  }, [company, user.Company] );

  useEffect(() => {
    const load = async () => {
      // Query the users from the database that belong to the same company as the user
      const { result, error } = await getDocWhere("User", "Company", "==", companyToLoadMembersFrom);
      // eslint-disable-next-line

      const locmembers = [];

      for (const obj of result) {
        locmembers.push(obj);
      }

      setMembers(locmembers);
      setMembersLoading(false);
    }

    load();
  }, [companyToLoadMembersFrom]);


  const SparkLine = ({ obj }) => {
    const options = {
      responsive: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          display: false
        },
        y: {
          display: false
        }
      },
      elements: {
        line: {
          tension: 0.4
        }
      },
      tooltips: {
        enabled: false
      }
    };

    const labels = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "okt", "nov", "dez"];

    const datapoints = [];
    const currentYear = new Date().getFullYear();

    for(let i= 0; i < 12; i++){
      let val = 0;

      if(obj.usedCredits){
        const usgindx = obj.usedCredits.findIndex((usg) => {
          return usg.month == i && usg.year == currentYear;
        });

        if(usgindx != -1){
          val = obj.usedCredits[usgindx].amount;
        }
      }

      datapoints.push(val);
    }

    const data = {
      labels,
      datasets: [
        {
          fill: true,
          data: datapoints,
          borderColor: "rgb(100, 162, 235)",
          backgroundColor: "rgba(53, 162, 235, 1)",
          radius: 0,
          borderWidth: 0.4
        }
      ]
    };


    return(
      <div className={styles.usagechart}>
        <Line options={options} data={data} />
      </div>
    );
  }


  const companyCols = [
    {
      title: "Firma",
      dataIndex: "company",
      key: "company",
      render: ( _, obj, idx ) => {
        if(obj.name != ""){
          const Debuginfo = () => {
            return(
              <div className={styles.debuginfo}>
                  ID: {obj.uid}
              </div>
            );
          }

          let creationDate = "Nicht ermittelbar";
          if(obj.created){
            creationDate = moment(obj.created  ).format("DD.MM.YYYY");
          }

          return(
            <div key={idx} className={styles.company}>
              <div className={styles.details}>
                <div className={styles.name}>
                  {obj.name}
                  <Popover content={Debuginfo}>
                    <span className={styles.debug}><CodeOutlined/></span>
                  </Popover>
                </div>
                <div className={styles.metrics}>
                  <span className={styles.members}>Benutzer {obj.members}</span>
                </div>
                <div className={styles.metrics}>
                  <span className={styles.members}>Erstellt {creationDate}</span>
                </div>
              </div>
            </div>
          );
        }
      }
    },
    {
      title: "Token",
      dataIndex: "token",
      key: "token",
      render: ( _, obj, idx ) => {
        if(obj.tokens != undefined){
          return (<div className={styles.tokencell}>
            <span className={styles.token}>{toGermanCurrencyString(obj.tokens)}</span>
          </div>);
        }
      }
    },
    {
      title: "Aktionen",
      dataIndex: "actions",
      key: "actions",
      render: ( _, obj, idx ) => {
        return(
          <div className={styles.actionrow}>
            <div className={styles.singleaction} onClick={() => {
              setCompanyToLoadMembersFrom(obj.uid);
              setMembersLoading(true);
              setMemberModalOpen(true);
            }}><UnorderedListOutlined /></div>
          </div>
        );
      }
    }
  ];

  const singleUserCols = [
    {
      title: "User",
      dataIndex: "user",
      key: "user",
      render: ( _, obj, idx ) => {
        const Debuginfo = () => {
          return(
            <div className={styles.debuginfo}>
                ID: {obj.uid}<br />
                USERID: {obj.user.id}
            </div>
          );
        }

        if(obj.user != undefined){
          return(
            <div key={idx} className={styles.company}>
              <div className={styles.details}>
                <div className={styles.name}>
                  {obj.user.firstname} {obj.user.lastname}
                  <Popover content={Debuginfo}>
                    <span className={styles.debug}><CodeOutlined/></span>
                  </Popover>
                </div>
                <div className={styles.email}>
                  {obj.user.email}
                </div>
              </div>
            </div>
          );
        }
      }
    },
    {
      title: "Token",
      dataIndex: "token",
      key: "token",
      render: ( _, obj, idx ) => {
        if(obj.tokens != undefined){
          return (<div className={styles.tokencell}>
            <span className={styles.token}>{toGermanCurrencyString(obj.tokens)}</span>
          </div>);
        }
      }
    },
    {
      title: "Nutzung",
      dataIndex: "usage",
      key: "usage",
      render: ( _, obj, idx ) => {
        return <SparkLine obj={obj} />;
      }
    }
  ];

  const memberColumns = [
    {
      title: "User",
      dataIndex: "user",
      key: "user",
      render: ( _, obj, idx ) => {
        const DebugInfo = () => {
          return (
            <div className={styles.debuginfo}>
                USERID: {obj.id}
            </div>
          );
        }

        return (
          <div key={idx} className={styles.company}>
            <div className={styles.details}>
              <div className={styles.name}>
                {obj.firstname} {obj.lastname}
                <Popover content={DebugInfo}>
                  <span className={styles.debug}><CodeOutlined/></span>
                </Popover>
              </div>
              <div className={styles.email}>
                {obj.email}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      title: "Rolle",
      dataIndex: "role",
      key: "role",
      render: ( _, obj, idx ) => {
        switch (obj.Role){
        case "Company-Admin":
          return <Tag color="cyan">Admin</Tag>
        case "Company-Manager":
          return <Tag color="green">Manager</Tag>
        case "Mailagent":
          return <Tag color="magenta">Mailagent</Tag>
        case "Superadmin":
          return <Tag color="gold">Superadmin</Tag>
        }
      }
    },
    {
      title: "Nutzung",
      dataIndex: "usage",
      key: "usage",
      render: ( _, obj, idx ) => {
        return <SparkLine obj={obj} />;
      }
    }
  ];

  return (
    <SidebarLayout context={context}>
      <div className={styles.main}>
        <div className={styles.cardsection}>
          <Card className={styles.stats} title={"Statistiken"} bordered={true}>
          </Card>
        </div>

        <div className={styles.cardsection}>
          <Card className={styles.companies} title={"Firmen"} bordered={true}>
            <Table
              loading={false}
              dataSource={[...companies]}
              columns={companyCols}
              rowKey={( record: User & { id: string } ) => {
                return record.id
              }}
              scroll={{ x: true }}
            />

            <Modal width={"80%"} title="Benutzer" open={memberModalOpen} footer={null} onCancel={() => {
              setMemberModalOpen(false)
            }}>
              <Table
                loading={membersLoading}
                dataSource={members}
                columns={memberColumns}
                rowKey={( record: User & { id: string } ) => {
                  return record.id
                }}
                scroll={{ x: true }}
              />
            </Modal>
          </Card>
        </div>

        <div className={styles.cardsection}>
          <Card className={styles.singleusers} title={"Einfache Nutzer"} bordered={true}>
            <Table
              loading={false}
              dataSource={[...userCompanies]}
              columns={singleUserCols}
              rowKey={( record: User & { id: string } ) => {
                return record.id
              }}
              scroll={{ x: true }}
            />
          </Card>
        </div>
      </div>
    </SidebarLayout>
  );
}
