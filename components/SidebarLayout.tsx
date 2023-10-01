import React, { ReactNode, useState } from 'react';
import Image from 'next/image';
import { TeamOutlined, LogoutOutlined, ApartmentOutlined, RobotOutlined, FolderOpenOutlined} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Breadcrumb, Layout, Menu, theme } from 'antd';
import Link from 'next/link';
import { CombinedUser } from '../helper/LoginTypes';
import { Capabilities, Crud } from '../helper/capabilities';
import { useRouter } from 'next/router';
import { JsonObject, JsonValue } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';
const { Header, Content, Footer, Sider } = Layout;
import logo from '../public/mailbuddy.png';

type MenuItem = Required<MenuProps>['items'][number];


const SidebarLayout = (props: { children: ReactNode, capabilities: any }) => {
  const [collapsed, setCollapsed] = useState(true);
  const { token: { colorBgContainer } } = theme.useToken();
  const router = useRouter();

  const rights = props.capabilities;

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
    getItem(<Link href={"/projects/list"}>Projekte</Link>, '2', () => { return rights.superadmin }, <FolderOpenOutlined />),
    getItem(<Link href={"/company"}>Firma</Link>, '2', () => { return !rights.superadmin }, <ApartmentOutlined />),
    getItem(<Link href={"/logout"}>Ausloggen</Link>, '4', () => { return true }, <LogoutOutlined />),
  ];

  const getDefaultSelected = () => {
    switch(router.pathname){
      case '/': 
        return '1';
      case '/projects/list':
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
          <Image style={{ borderRadius: 5 }} src={logo} width={50} height={50} alt="Logo"/>
        </div>
        <Menu theme="dark" defaultSelectedKeys={[getDefaultSelected()]} mode="inline" items={items} />
      </Sider>
      <Layout>
        
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
              background: "rgba(217, 217, 227, 0.01)",
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