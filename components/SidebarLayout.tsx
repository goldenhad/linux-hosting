import React, { ReactNode, useState } from 'react';
import Image from 'next/image';
import { TeamOutlined, LogoutOutlined, AlignLeftOutlined, RobotOutlined} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Breadcrumb, Layout, Menu, theme } from 'antd';
import Link from 'next/link';
import { CombinedUser } from '../helper/LoginTypes';
import { Capabilities, Crud } from '../helper/capabilities';
import { useRouter } from 'next/router';
import { JsonObject, JsonValue } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';
const { Header, Content, Footer, Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];


const SidebarLayout = (props: { children: ReactNode, capabilities: JsonObject }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { token: { colorBgContainer } } = theme.useToken();
  const router = useRouter();

  const projectRights = props.capabilities.projects as JsonObject;
  const personRights = projectRights.persons as JsonObject;
  const creditRights = projectRights.credits as JsonObject;
  const userRights = props.capabilities.users as JsonObject;

  function getItem( label: React.ReactNode, key: React.Key, check: () => boolean, icon?: React.ReactNode, children?: MenuItem[] ): MenuItem {
    if( check() ){
      return {
        key,
        icon,
        children,
        label,
      } as MenuItem;
    }else{
      return null;
    }
  }


  const items = [
    getItem(<Link href={"/"}>Siteware Mailbuddy</Link>, '1', () => { return true }, <RobotOutlined />, ),
    getItem(<Link href={"/prompt"}>Prompt bearbeiten</Link>, '2', () => { return projectRights != undefined }, <AlignLeftOutlined />),
    getItem(<Link href={"/logout"}>Ausloggen</Link>, '4', () => { return true }, <LogoutOutlined />),
  ];

  const getDefaultSelected = () => {
    switch(router.pathname){
      case '/': 
        return '1';
      case '/prompt':
        return '2';
      case '/users':
        return '3';
      default:
        return '-1';
    }
  }

  return (
    <Layout
      style={{
        minHeight: '100vh',
      }}
    >
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 25, marginTop: 25 }}>
          <Image style={{ borderRadius: 5 }} src="/mailbuddy.png" width={50} height={50} alt="Logo"/>
        </div>
        <Menu theme="dark" defaultSelectedKeys={[getDefaultSelected()]} mode="inline" items={items} />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
          }}
        />
        <Content
          style={{
            height: "100vh",
            overflowY: "scroll"
          }}
        >
          <div
            style={{
              padding: 24,
              minHeight: "100vh",
              background: colorBgContainer,
            }}
          >
            {props.children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};
export default SidebarLayout;