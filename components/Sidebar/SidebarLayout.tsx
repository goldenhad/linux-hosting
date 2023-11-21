import React, { ReactNode, useEffect, useState } from 'react';
import { LogoutOutlined, ApartmentOutlined, RobotOutlined, FolderOpenOutlined, UserOutlined } from '@ant-design/icons';
import Icon from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Avatar, ConfigProvider, Divider, FloatButton, Layout, Menu, Popover, theme } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/router';
const { Content, Footer, Sider } = Layout;
import { User } from '../../firebase/types/User';
import { handleEmptyString } from '../../helper/architecture';
import styles from './sidebar.module.scss';
import Home from '../../public/icons/home.svg';
import Main from '../../public/icons/main.svg';
import Company from '../../public/icons/company.svg';
import Profiles from '../../public/icons/profiles.svg';
import Help from '../../public/icons/help.svg';
import CookieBanner from '../CookieBanner';

type MenuItem = Required<MenuProps>['items'][number];



const SidebarLayout = (props: { children: ReactNode, capabilities: any, user: User, login: any}) => {
  const [collapsed, setCollapsed] = useState(true);
  const [ collapseWidth, setCollapseWidth ] = useState(undefined);
  const [ breakpoint, setBreakpoint ] = useState(undefined);
  const router = useRouter();
  const [ version, setVersion ] = useState("");

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
    getItem(<Link href={"/"}>Home</Link>, '1', () => { return true }, <Icon component={Home} className={styles.sidebariconsvg} viewBox='0 0 22 22'/>, ),
    getItem(<Link href={"/dialog"}>Dialog</Link>, '2', () => { return true }, <Icon component={Main} className={styles.sidebariconsvg} viewBox='0 0 22 22'/>),
    getItem(<Link href={"/monolog"}>Monolog</Link>, '5', () => { return true }, <Icon component={Main} className={styles.sidebariconsvg} viewBox='0 0 22 22'/>),
    getItem(<Link href={"/company"}>Firma</Link>, '3', () => { return props.user.Role == "Company" || props.user.Role == "mailagent"  }, <Icon component={Company} className={styles.sidebariconsvg} viewBox='0 0 22 22'/>),
    getItem(<Link href={"/usage"}>Nutzung</Link>, '3', () => { return props.user.Role != "Company" && props.user.Role != "mailagent"  }, <Icon component={Company} className={styles.sidebariconsvg} viewBox='0 0 22 22'/>),
    getItem(<Link href={"/profiles"}>Profile</Link>, '4', () => { return true }, <Icon component={Profiles} className={styles.sidebariconsvg} viewBox='0 0 22 22'/>),
  ];

  const footeritems = [
  ];

  const getDefaultSelected = () => {
    switch(router.pathname){
      case '/': 
        return '1';
      case '/companies/list/[[...search]]':
        return '2';
      case '/dialog':
          return '2';
      case '/monolog':
        return '5';
      case '/company':
        return '3';
      case '/usage':
        return '3';
      case '/order/invoice/[id]':
        return '3';
      case '/upgrade':
        return '3';
      case '/thankyou':
        return '3';
      case '/profiles':
        return '4';
      default:
        return '-1';
    }
  }


  const profilemenu = (
    <div className={styles.avatarmenu}>
      <Link href={"/account"} className={styles.accountlink}>
        <div className={styles.profile}>
          <Avatar size={40} style={{ backgroundColor: '#f0f0f2', color: '#474747' }}>{handleEmptyString(props.user.firstname).toUpperCase().charAt(0)}{handleEmptyString(props.user.lastname).toUpperCase().charAt(0)}</Avatar>
          <div className={styles.profileinfo}>{handleEmptyString(props.user.firstname)} {handleEmptyString(props.user.lastname)}</div>
        </div>
      </Link>
      <Divider className={styles.menudivider} />
      <div className={styles.iconlink}>
        <Link href="/logout" className={styles.linkwrapper}>
          <LogoutOutlined />
          <div className={styles.iconlinktext}>Ausloggen</div>
        </Link>
        
      </div>
      
    </div>
  );

  
  return (
    <ConfigProvider theme={{
      components: {
        Menu: {
          darkItemSelectedBg: '#344054',
          darkDangerItemSelectedColor: '#ffffff'
        }
      }
    }}>
      <Layout className={styles.layout} hasSider={true}>
        <Sider className={styles.sidebar} breakpoint={breakpoint} collapsedWidth={collapseWidth} collapsed={collapsed} onCollapse={(value) => {setCollapsed(value)}}>
          <div className={styles.logobox}>
            <img src="/small_logo.png" width={41.15} height={40} alt="Logo"/>
          </div>

          <div className={styles.navigation}>
            
            <Menu className={styles.primarymenu} theme="dark" defaultSelectedKeys={[getDefaultSelected()]} mode="inline" items={items} />

            <div>
              <Menu className={styles.secondarymenu} theme="dark" defaultSelectedKeys={[getDefaultSelected()]} mode="inline" items={footeritems} />
              <div className={styles.avatarcontainer}>
                <Popover placement="rightBottom" content={profilemenu} trigger="click">
                  <Avatar size={40} style={{ backgroundColor: '#f0f0f2', color: '#474747' }}>{handleEmptyString(props.user.firstname).toUpperCase().charAt(0)}{handleEmptyString(props.user.lastname).toUpperCase().charAt(0)}</Avatar>
                </Popover>
              </div>
            </div>
          </div>
        </Sider>
        
        <Layout>
          <Content className={styles.layoutcontent}>
            <div className={styles.childrencontainer}>
              {props.children}
            </div>
          </Content>
          <FloatButton className='sosbutton' icon={<Icon component={Help} className={styles.floaticon} viewBox='0 0 22 22' size={24} />} shape='square' description={"Hilfe"}/>
          <Footer style={{ textAlign: 'center', color: "lightgrey" }}>{version}</Footer>
        </Layout>
        <CookieBanner />
      </Layout>
    </ConfigProvider>
  );
};
export default SidebarLayout;