import { Card, Button, Form, Input, Select, Result, Skeleton, Space, Typography, Alert, Divider } from 'antd';
import Icon from '@ant-design/icons';
import styles from './index.module.scss'
import { db } from '../db';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import SidebarLayout from '../components/Sidebar/SidebarLayout';
import { useAuthContext } from '../components/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Usage } from '../firebase/types/Company';
import { Profile } from '../firebase/types/Profile';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { handleEmptyString } from '../helper/architecture';
import ArrowRight from '../public/icons/arrowright.svg';
import Link from 'next/link';
const { Paragraph } = Typography;
const { TextArea } = Input;



export interface InitialProps {
  Data: {
    currentMonth: number,
    currentYear: number,
  };
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  //Get the context of the request
  const { req, res } = ctx;
  //Get the cookies from the current request
  const { cookies } = req;

  let datum = new Date();

  return {
    props: {
        Data: {
          currentMonth: datum.getMonth() + 1,
          currentYear: datum.getFullYear(),
        }
    },
  };

  
};


export default function Home(props: InitialProps) {
  const { login, user, company, role } = useAuthContext();


  return (
    <SidebarLayout capabilities={(role)? role.capabilities: {}} user={user} login={login}>
      <div className={styles.main}>
        <div className={styles.greetingrow}>
          <div className={styles.greeting}>Willkommen {user.firstname}</div>
          <div className={styles.greeting_subtitle}>Wie kann ich dir heute helfen?</div>
        </div>

        <div className={styles.optioncontainer}>
          <div className={styles.optionrow}>
            <Link href={"/dialog"}>
                  <div className={styles.option}>
                    <div className={styles.option_title}>Mail-Dialog fortsetzen</div>
                  </div>
                </Link>

                <Link href={"/monolog"}>
                  <div className={styles.option}>
                    <div className={styles.option_title}>E-Mail schreiben</div>
                  </div>
              </Link>
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
}
