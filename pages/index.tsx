import { Card, Button, Form, Input, Select, Checkbox, Divider, Skeleton, Space, Alert, Typography } from 'antd';
import styles from './index.module.scss'
import axios from 'axios';
import { useState } from 'react';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { CombinedUser } from '../helper/LoginTypes';
import SidebarLayout from '../components/SidebarLayout';
import { Prisma } from '@prisma/client';
import { Capabilities } from '../helper/capabilities';
import { JsonObject } from '@prisma/client/runtime/library';
const { Paragraph } = Typography;



export interface InitialProps {
  Data: any;
  InitialState: CombinedUser;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  //Get the context of the request
  const { req, res } = ctx;
  //Get the cookies from the current request
  const { cookies } = req;

  //Check if the login cookie is set
  if (!cookies.login) {
      //Redirect if the cookie is not set
      res.writeHead(302, { Location: "/login" });
      res.end();

      return { props: { InitialState: {} } };
  } else {

      return {
          props: {
              InitialState: JSON.parse(
              Buffer.from(cookies.login, "base64").toString("ascii")
              ),
              Data: {}
          },
      };
  }
};


export default function Home(props: InitialProps) {
  

  return (
    <SidebarLayout capabilities={props.InitialState.role.capabilities as JsonObject}>
      <main className={styles.main}>
        
      </main>
    </SidebarLayout>
  )
}
