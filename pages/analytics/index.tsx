import {
  Card,
  Table
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
  Title,
  Tooltip as ChartTooltip,
  Legend
} from "chart.js";
import { User } from "../../firebase/types/User";
import { toGermanCurrencyString } from "../../helper/price";
import { UnorderedListOutlined, UserOutlined } from "@ant-design/icons";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
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

  const router = useRouter();

  // Redirect users if they are not a company
  useEffect( () => {
    if( !role.canViewAnalytics ) {
      router.push( "/" );
    }
  }, [role.isCompany, router] );

  // Load the list of invited users to the company
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


  const companyCols = [
    {
      title: "Firma",
      dataIndex: "company",
      key: "company",
      render: ( _, obj, idx ) => {
        if(obj.name != ""){
          return(
            <div key={idx} className={styles.company}>
              <div className={styles.details}>
                <div className={styles.name}>
                  {obj.name}
                </div>
                <div className={styles.metrics}>
                  <span className={styles.members}>Mitarbeiter {"x"}</span>
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
            <div className={styles.singleaction}><UnorderedListOutlined /></div>
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
        if(obj.user != undefined){
          return(
            <div key={idx} className={styles.company}>
              <div className={styles.details}>
                <div className={styles.name}>
                  {obj.user.firstname} {obj.user.lastname}
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
