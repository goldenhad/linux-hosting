import React, { Dispatch, ReactNode, SetStateAction, useEffect, useState } from "react";
import { LogoutOutlined } from "@ant-design/icons";
import Icon, { CloseOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Avatar, Badge, ConfigProvider, Divider, Drawer, FloatButton, Layout, List, Menu, Popover } from "antd";
import Link from "next/link";
import { useRouter } from "next/router";
const { Header, Content, Sider } = Layout;
import { User } from "../../firebase/types/User";
import styles from "./homesidebar.module.scss";
import Home from "../../public/icons/home.svg";
import Profiles from "../../public/icons/profiles.svg";
import Help from "../../public/icons/help.svg";
import Heart from "../../public/icons/heart.svg";
import Nav from "../../public/icons/nav.svg";
import Stats from "../../public/icons/stat.svg";
import Settings from "../../public/icons/settings.svg";
import CookieBanner from "../CookieBanner/CookieBanner";
import { getImageUrl } from "../../firebase/drive/upload_file";
import { isMobile } from "react-device-detect";

type MenuItem = Required<MenuProps>["items"][number];



const HomeSidebarLayout = ( props: { 
  children: ReactNode,
  context: {user: User, login, role, profile}
  category: { value: string, setter: Dispatch<SetStateAction<string>>}
}) => {
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

  useEffect( () => {
    const setProfileImage = async () => {
      const url = await getImageUrl( props.context.login.uid );
      setImageUrl( url );
    }

    setProfileImage();
  }, [props.context.login] );

  
  useEffect(() => {
    if(isMobile || window.innerWidth < 992){
      setBreakpoint("lg");
      setCollapseWidth(0);
      setCollapsed(true);
    }else{
      setCollapsed(true);
      setBreakpoint(undefined);
      setCollapseWidth(80);
    }
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
    getItem( <Link href={"/"}>Home</Link>, "1", () => {
      return true 
    }, <Icon component={Home} className={styles.sidebariconsvg} viewBox='0 0 22 22'/> ),
    getItem( <Link href={"/profiles"}>Profile</Link>, "4", () => {
      return true 
    }, <Icon component={Profiles} className={styles.sidebariconsvg} viewBox='0 0 22 22'/> ),
    getItem( <Link href={"/usage"}>Nutzung</Link>, "3", () => {
      return true
    }, <Icon component={Stats} className={styles.sidebariconsvg} viewBox='0 0 22 22'/> ),
    getItem( <Link href={"/company"}>Firma</Link>, "5", () => {
      return props.context.role.isCompany 
    }, <Icon component={Settings} className={styles.sidebariconsvg} viewBox='0 0 22 22'/> )
  ];

  const footeritems = [];

  const getDefaultSelected = () => {
    switch( router.pathname ){
    case "/": 
      return "1";
    case "/companies/list/[[...search]]":
      return "2";
    case "/dialog":
      return "1";
    case "/monolog":
      return "1";
    case "/company":
      return "5";
    case "/usage":
      return "3";
    case "/order/invoice/[id]":
      return "3";
    case "/upgrade":
      return "3";
    case "/thankyou":
      return "3";
    case "/profiles":
      return "4";
    default:
      return "-1";
    }
  }

  const profilemenu = (
    <div className={styles.avatarmenu}>
      <Link href={"/account"} className={styles.accountlink}>
        <div className={styles.profile}>
          <Avatar
            size={40}
            style={{ color: "#474747" }}
            src={props.context.profile.picture}
          >
            {(props.context.user.email)? props.context.user.email.charAt(0):""}
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
  
  const isselected = (name: string) => {
    if(name == props.category.value){
      return styles.selectedcat;
    }
  }

  const MobileHeader = () => {
    if(isMobile || window.innerWidth < 992){
      return(
        <Header className={styles.header}>
          <Link href={"/"} className={styles.headerlink}>
            {/*eslint-disable-next-line */}
            <img src="/small_logo.png" width={32} height={32} alt="Logo"/>
          </Link>
          <Icon
            component={Nav}
            className={styles.headericon}
            viewBox='0 0 40 40'
            onClick={() => {
              setSidebarOpen(!sidebaropen); 
            }}
          />
        </Header>
      );
    }
  }

  if(isMobile || window.innerWidth < 992){
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
        <Layout className={styles.layout} hasSider={!(isMobile || window.innerWidth < 992)}>
          <MobileHeader />
          <Drawer
            bodyStyle={{ backgroundColor: "#101828", padding: 0, display: "flex", flexDirection: "row", alignItems: "center" }}
            placement="left"
            width={"100%"}
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
                      style={{ color: "#474747" }}
                      src={props.context.profile.picture}
                    >
                      {(props.context.user.email)? props.context.user.email.charAt(0):""}
                    </Avatar>
                  </Popover>
                </div>
              </div>
            </div>
            <div className={styles.homesidebarcontainer_mobile}>
              <div className={styles.homesidebar}>
                <div className={styles.title}>Assistenten</div>
                <List className={styles.assistantlist} split={false}>
                  <List.Item className={`${styles.assistantlink} ${isselected("all")}`} onClick={() => {
                    props.category.setter("all");
                    setSidebarOpen(false);
                  }}>
                    <Icon component={Profiles} className={styles.assistanticon} viewBox='0 0 22 22'/>
                    <div className={styles.assistantcatname}>Alle</div>
                  </List.Item>
                  <List.Item className={`${styles.assistantlink} ${isselected("favourites")}`} onClick={() => {
                    props.category.setter("favourites");
                    setSidebarOpen(false);
                  }}>
                    <Icon component={Heart} className={styles.assistanticon} viewBox='0 0 22 22'/>
                    <div className={styles.assistantcatname}>Favoriten</div>
                    <div className={styles.assistantcount}>
                      <Badge className={styles.badge} status="default" color="#f2f4f7" count={
                        (props.context.user.services?.favourites)? props.context.user.services.favourites.length: 0}
                      />
                    </div>
                  </List.Item>
                  <List.Item className={`${styles.assistantlink} ${isselected("content")}`} onClick={() => {
                    props.category.setter("content");
                    setSidebarOpen(false);
                  }}>
                    <Icon component={Profiles} className={styles.assistanticon} viewBox='0 0 22 22'/>
                    <div className={styles.assistantcatname}>Content-Erstellung</div>  
                  </List.Item>
                </List>
              </div>
            </div>
            <div className={styles.canclebar}>
              <div className={styles.closesidebar} onClick={() => {
                setSidebarOpen(false)
              }}><CloseOutlined /></div>
            </div>
          </Drawer>
          <Sider
            className={styles.sidebar}
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
  
              <div>
                <Menu className={styles.secondarymenu} theme="dark" defaultSelectedKeys={[getDefaultSelected()]} mode="inline" items={footeritems} />
                <div className={styles.avatarcontainer}>
                  <Popover placement="rightBottom" content={profilemenu} trigger="click">
                    <Avatar
                      size={40}
                      style={{ color: "#474747" }}
                      src={props.context.profile.picture}
                    >
                      {(props.context.user.email)? props.context.user.email.charAt(0):""}
                    </Avatar>
                  </Popover>
                </div>
              </div>
            </div>
          </Sider>
          
          <Layout>
            <Content className={styles.layoutcontent}>
              <div className={styles.childrencontainer}>{props.children}</div>
            </Content>
            <FloatButton
              className='sosbutton'
              icon={<Icon component={Help} className={styles.floaticon} viewBox='0 0 22 22' size={24} />}
              shape='square'
              description={"Hilfe"}
            />
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
            darkDangerItemSelectedColor: "#ffffff",
            darkItemBg: ""
          },
          Slider: {
            trackBg: "#1478FD",
            handleColor: "#1478FD"
          }
        }
      }}>
        <Layout className={styles.layout} hasSider={!(isMobile || window.innerWidth < 992)}>
          <MobileHeader />
          <Sider
            className={styles.sidebar}
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
  
              <div>
                <Menu className={styles.secondarymenu} theme="dark" defaultSelectedKeys={[getDefaultSelected()]} mode="inline" items={footeritems} />
                <div className={styles.avatarcontainer}>
                  <Popover placement="rightBottom" content={profilemenu} trigger="click">
                    <Avatar
                      size={40}
                      style={{ color: "#474747" }}
                      src={props.context.profile.picture}
                    >
                      {(props.context.user.email)? props.context.user.email.charAt(0):""}
                    </Avatar>
                  </Popover>
                </div>
              </div>
            </div>
          </Sider>
          
          <Layout>
            <Content className={styles.layoutcontent}>
              <aside className={styles.homesidebarcontainer}>
                <div className={styles.homesidebar}>
                  <div className={styles.title}>Assistenten</div>
                  <List className={styles.assistantlist} split={false}>
                    <List.Item className={`${styles.assistantlink} ${isselected("all")}`} onClick={() => {
                      props.category.setter("all"); 
                    }}>
                      <Icon component={Profiles} className={styles.assistanticon} viewBox='0 0 22 22'/>
                      <div className={styles.assistantcatname}>Alle</div>
                    </List.Item>
                    <List.Item className={`${styles.assistantlink} ${isselected("favourites")}`} onClick={() => {
                      props.category.setter("favourites"); 
                    }}>
                      <Icon component={Heart} className={styles.assistanticon} viewBox='0 0 22 22'/>
                      <div className={styles.assistantcatname}>Favoriten</div>
                      <div className={styles.assistantcount}>
                        <Badge className={styles.badge} status="default" color="#f2f4f7" count={
                          (props.context.user.services?.favourites)? props.context.user.services.favourites.length: 0}
                        />
                      </div>
                    </List.Item>
                    <List.Item className={`${styles.assistantlink} ${isselected("content")}`} onClick={() => {
                      props.category.setter("content"); 
                    }}>
                      <Icon component={Profiles} className={styles.assistanticon} viewBox='0 0 22 22'/>
                      <div className={styles.assistantcatname}>Content-Erstellung</div>  
                    </List.Item>
                  </List>
                </div>
              </aside>
              <div className={styles.childrencontainer}>{props.children}</div>
            </Content>
            <FloatButton
              className='sosbutton'
              icon={<Icon component={Help} className={styles.floaticon} viewBox='0 0 22 22' size={24} />}
              shape='square'
              description={"Hilfe"}
            />
          </Layout>
          <CookieBanner />
        </Layout>
      </ConfigProvider>
    );
  }
};
export default HomeSidebarLayout;