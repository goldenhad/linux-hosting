import React, { Dispatch, ReactNode, SetStateAction, useEffect, useState } from "react";
import { LogoutOutlined } from "@ant-design/icons";
import Icon, { HistoryOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Avatar, ConfigProvider, Divider, Drawer, FloatButton, Layout, Menu, Popover } from "antd";
import Link from "next/link";
import { useRouter } from "next/router";
const { Header, Content, Footer, Sider } = Layout;
import { User } from "../../firebase/types/User";
import styles from "./sidebar.module.scss";
import Home from "../../public/icons/home.svg";
import Nav from "../../public/icons/nav.svg";
import Profiles from "../../public/icons/profiles.svg";
import Help from "../../public/icons/help.svg";
import CookieBanner from "../CookieBanner/CookieBanner";
import Stats from "../../public/icons/stat.svg";
import Settings from "../../public/icons/settings.svg";
import { getImageUrl } from "../../firebase/drive/upload_file";


type MenuItem = Required<MenuProps>["items"][number];



const SidebarLayout = ( props: { children: ReactNode, context: {user: User, login, role, profile}, hist?: Dispatch<SetStateAction<boolean>>} ) => {
  const [collapsed, setCollapsed] = useState( true );
  // eslint-disable-next-line
  const [ collapseWidth, setCollapseWidth ] = useState( 80 );
  // eslint-disable-next-line
  const [ breakpoint, setBreakpoint ] = useState( undefined );
  // eslint-disable-next-line
  const [ imageUrl, setImageUrl ] = useState( undefined );
  const router = useRouter();
  // eslint-disable-next-line
  const [ version, setVersion ] = useState( "" );

  const [ sidebaropen, setSidebarOpen ] = useState(false);

  const [ screenwidth, setScreenwidth ] = useState(window.innerWidth);

  useEffect( () => {
    const setProfileImage = async () => {
      if(props.context.login?.uid){
        const url = await getImageUrl( props.context.login.uid );
        setImageUrl( url );
      }
    }

    setProfileImage();
  }, [props.context.login] );


  useEffect(() => {
    if(screenwidth <= 1500 ){
      setBreakpoint("lg");
      setCollapseWidth(0);
      setCollapsed(true);
    }else{
      setCollapsed(true);
      setBreakpoint(undefined);
      setCollapseWidth(80);
    }
  }, [screenwidth]);

  useEffect(() => {
    const handleResize = () => {
      setScreenwidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);


  function getItem( label: React.ReactNode, key: React.Key, check: () => boolean, icon?: React.ReactNode, children?: MenuItem[] ): MenuItem {
    if( check() ){
      return {
        key,
        icon,
        children,
        label
      } as MenuItem;
    }else{
      return null;
    }
  }


  const items = [
    getItem( <Link href={"/"}>Home</Link>, "0", () => {
      return true 
    }, <Icon component={Home} className={styles.sidebariconsvg} viewBox='0 0 22 22'/> ),
    getItem( <Link href={"/profiles"}>Profile</Link>, "3", () => {
      return true 
    }, <Icon component={Profiles} className={styles.sidebariconsvg} viewBox='0 0 22 22'/> ),
    getItem( <Link href={"/usage"}>Nutzung</Link>, "2", () => {
      return true
    }, <Icon component={Stats} className={styles.sidebariconsvg} viewBox='0 0 22 22'/> ),
    getItem( <Link href={"/company"}>Firma</Link>, "1", () => {
      return props.context.role.isCompany 
    }, <Icon component={Settings} className={styles.sidebariconsvg} viewBox='0 0 22 22'/> )
  ];

  const footeritems = [];

  const getDefaultSelected = () => {
    let lastfound = -1;
    
    const patterns = [
      /(^\/$)|(\/assistants\/(a-zA-Z)*)/gm,
      /(^\/company$)/gm,
      /(\/usage)|(\/thankyou)/gm,
      /(^\/profiles$)/gm
    ];

    patterns.forEach((pattern, id) => {
      if( pattern.exec(router.pathname) !== null){
        lastfound = id;
      }
    })

    return lastfound.toString();
  }

  const profilemenu = (
    <div className={styles.avatarmenu}>
      <Link href={"/account"} className={styles.accountlink}>
        <div className={styles.profile}>
          <Avatar
            size={40}
            style={{ color: "#474747", backgroundColor: "#F2F4F7" }}
            src={props.context.profile.picture}
          >
            {(props.context.user?.email)? props.context.user.email.charAt(0):""}
          </Avatar>
          <div className={styles.profileinfo}>Mein Account</div>
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

  const MobileHeader = () => {
    if(screenwidth <= 1500){
      return(
        <Header className={styles.header}>
          <Link href={"/"} className={styles.headerlink}>
            {/*eslint-disable-next-line */}
            <img src="/small_logo.png" width={32} height={32} alt="Logo"/>
          </Link>
          <div className={styles.headerinteraction}>
            {(props.hist)? 
              <HistoryOutlined
                className={styles.histicon}
                onClick={() => {
                  props.hist(true); 
                }}
              />
              : <></>}
            <Icon
              component={Nav}
              className={styles.headericon}
              viewBox='0 0 40 40'
              onClick={() => {
                setSidebarOpen(!sidebaropen); 
              }}
            />
          </div>
        </Header>
      );
    }
  }
  
  if(screenwidth <= 1500){
    return (
      <ConfigProvider theme={{
        components: {
          Menu: {
            darkItemSelectedBg: "#344054",
            darkDangerItemSelectedColor: "#ffffff",
            darkItemBg: ""
          },
          Slider: {
            trackBg: "#1478FD",
            handleColor: "#1478FD"
          }
        }
      }}>
        <Layout className={styles.layout} hasSider={(screenwidth > 1500)}>
          <MobileHeader />
          <Drawer
            style={{ backgroundColor: "#101828" }}
            bodyStyle={{ backgroundColor: "#101828", padding: 0, display: "flex", flexDirection: "column", alignItems: "center", width: 80, borderColor: "#101828" }}
            placement="left"
            width={80}
            onClose={() => {
              setSidebarOpen(false)
            }}
            open={sidebaropen}
            closeIcon={null}
          >
            <div className={styles.mobilesidebarcontainer}>
              <div className={styles.logobox}>
                {/*eslint-disable-next-line */}
                <img src="/small_logo.png" width={41.15} height={40} alt="Logo"/>
              </div>
              <div className={styles.drawermenu}>
                <Menu className={styles.primarymenu} theme="dark" defaultSelectedKeys={[getDefaultSelected()]} mode="inline" items={items} />
              </div>
              <div className={styles.sidebarbottomcontainer}>
                <Menu className={styles.secondarymenu} theme="dark" defaultSelectedKeys={[getDefaultSelected()]} mode="inline" items={footeritems} />
                <div className={styles.avatarcontainer}>
                  <Popover placement="rightBottom" content={profilemenu} trigger="click">
                    <Avatar
                      size={40}
                      style={(props.context.profile.picture)? { color: "#474747" }: { color: "#474747", backgroundColor: "#F2F4F7" }}
                      src={props.context.profile.picture}
                    >
                      <>{(props.context.user?.email)? props.context.user.email.charAt(0).toUpperCase():""}</>
                    </Avatar>
                  </Popover>
                </div>
              </div>
            </div>
          </Drawer>
          <Sider
            width={80}
            className={`${styles.sidebar}`}
            breakpoint={breakpoint}
            collapsedWidth={collapseWidth}
            collapsed={collapsed}
            onCollapse={( value ) => {
              setCollapsed( value )
            }}
          >
            <Link href={"/"}>
              <div className={styles.logobox}>
                {/*eslint-disable-next-line */}
                <img src="/small_logo.png" width={41.15} height={40} alt="Logo"/>
              </div>
            </Link>
  
            <div className={styles.navigation}>
              
              <Menu className={styles.primarymenu} theme="dark" defaultSelectedKeys={[getDefaultSelected()]} mode="inline" items={items} />
  
              <div className={styles.sidebarbottomcontainer}>
                <Menu className={styles.secondarymenu} theme="dark" defaultSelectedKeys={[getDefaultSelected()]} mode="inline" items={footeritems} />
                <div className={styles.avatarcontainer}>
                  <Popover placement="rightBottom" content={profilemenu} trigger="click">
                    <Avatar
                      size={40}
                      style={(props.context.profile.picture)? { color: "#474747" }: { color: "#474747", backgroundColor: "#F2F4F7" }}
                      src={props.context.profile.picture}
                    >
                      {(props.context.user?.email)? props.context.user.email.charAt(0).toUpperCase():""}
                    </Avatar>
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
            <FloatButton
              className='sosbutton'
              icon={<Icon component={Help} className={styles.floaticon} viewBox='0 0 22 22' size={24} />}
              shape='square'
              description={"Hilfe"}
            />
            <Footer style={{ textAlign: "center", color: "lightgrey" }}>{version}</Footer>
          </Layout>
          <CookieBanner />
        </Layout>
      </ConfigProvider>
    );
  }else{
    return (
      <ConfigProvider theme={{
        components: {
          Menu: {
            darkItemSelectedBg: "#344054",
            darkDangerItemSelectedColor: "#ffffff"
          },
          Slider: {
            trackBg: "#1478FD",
            handleColor: "#1478FD"
          }
        }
      }}>
        <Layout className={styles.layout} hasSider={true}>
          <Sider
            width={80}
            className={`${styles.sidebar}`}
            breakpoint={breakpoint}
            collapsedWidth={collapseWidth}
            collapsed={collapsed}
            onCollapse={( value ) => {
              setCollapsed( value )
            }}
          >
            <Link href={"/"}>
              <div className={styles.logobox}>
                {/*eslint-disable-next-line */}
                <img src="/small_logo.png" width={41.15} height={40} alt="Logo"/>
              </div>
            </Link>
  
            <div className={styles.navigation}>
              
              <Menu className={styles.primarymenu} theme="dark" defaultSelectedKeys={[getDefaultSelected()]} mode="inline" items={items} />
  
              <div className={styles.sidebarbottomcontainer}>
                <Menu className={styles.secondarymenu} theme="dark" defaultSelectedKeys={[getDefaultSelected()]} mode="inline" items={footeritems} />
                <div className={styles.avatarcontainer}>
                  <Popover placement="rightBottom" content={profilemenu} trigger="click">
                    <Avatar
                      size={40}
                      style={(props.context.profile.picture)? { color: "#474747" }: { color: "#474747", backgroundColor: "#F2F4F7" }}
                      src={props.context.profile.picture}
                    >
                      {(props.context.user?.email)? props.context.user.email.charAt(0).toUpperCase():""}
                    </Avatar>
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
            <FloatButton
              className='sosbutton'
              icon={<Icon component={Help} className={styles.floaticon} viewBox='0 0 22 22' size={24} />}
              shape='square'
              description={"Hilfe"}
            />
            <Footer style={{ textAlign: "center", color: "lightgrey" }}>{version}</Footer>
          </Layout>
          <CookieBanner />
        </Layout>
      </ConfigProvider>
    );
  }
};
export default SidebarLayout;