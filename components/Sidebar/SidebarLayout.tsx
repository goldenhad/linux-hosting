import React, { ReactNode, useEffect, useState } from 'react';
import { LogoutOutlined, ApartmentOutlined, RobotOutlined, FolderOpenOutlined, UserOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Avatar, Layout, Menu, theme } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/router';
const { Content, Footer, Sider } = Layout;
import {isMobile} from 'react-device-detect';
import { User } from '../../firebase/types/User';
import { handleEmptyString } from '../../helper/architecture';
import styles from './sidebar.module.scss';

type MenuItem = Required<MenuProps>['items'][number];



const SidebarLayout = (props: { children: ReactNode, capabilities: any, user: User, login: any}) => {
  const [collapsed, setCollapsed] = useState(true);
  const [ collapseWidth, setCollapseWidth ] = useState(undefined);
  const [ breakpoint, setBreakpoint ] = useState(undefined);
  const router = useRouter();
  const [ version, setVersion ] = useState("");

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
    getItem(<Link href={"/company"}>Firma</Link>, '3', () => { return true }, <ApartmentOutlined />),
    getItem(<Link href={"/profiles"}>Profile</Link>, '4', () => { return !rights.superadmin }, <UserOutlined />),
    getItem(<Link href={"/logout"}>Ausloggen</Link>, '5', () => { return true }, <LogoutOutlined />),
  ];

  const footeritems = [
    getItem(<Link href={"/"}>Help</Link>, '6', () => { return true }, <RobotOutlined />, ),
    getItem(<Link href={"/company"}>Einstellungen</Link>, '7', () => { return true }, <ApartmentOutlined />),
  ];

  const getDefaultSelected = () => {
    switch(router.pathname){
      case '/': 
        return '1';
      case '/companies/list/[[...search]]':
        return '2';
      case '/companies/edit/[id]':
          return '2';
      case '/company':
        return '3';
      case '/profiles':
        return '4';
      default:
        return '-1';
    }
  }

  


  return (
    <Layout className={styles.layout}>
      <Sider className={styles.sidebar} breakpoint={breakpoint} collapsedWidth={collapseWidth} collapsed={collapsed} onCollapse={(value) => {setCollapsed(value)}}>
        <div className={styles.logobox}>
          <img src="/small_logo.png" width={41.15} height={40} alt="Logo"/>
        </div>

        <div className={styles.navigation}>
          
          <Menu className={styles.primarymenu}  theme="dark" defaultSelectedKeys={[getDefaultSelected()]} mode="inline" items={items} />

          <div>
            <Menu className={styles.secondarymenu} theme="dark" defaultSelectedKeys={[getDefaultSelected()]} mode="inline" items={footeritems} />
            <Link href={'/account'}>
              <div className={styles.avatarcontainer}>
                <Avatar size={40} style={{ backgroundColor: '#f0f0f2', color: '#474747' }}>{handleEmptyString(props.user.firstname).toUpperCase().charAt(0)}{handleEmptyString(props.user.lastname).toUpperCase().charAt(0)}</Avatar>
              </div>
            </Link>
          </div>
        </div>
      </Sider>
      
      <Layout>
        <Content className={styles.layoutcontent}>
          <div className={styles.childrencontainer}>
            {props.children}
          </div>
        </Content>
        <Footer style={{ textAlign: 'center', color: "lightgrey" }}>{version}</Footer>
      </Layout>
    </Layout>
  );
};
export default SidebarLayout;