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
import All from "../../public/icons/all.svg";
import Chat from "../../public/icons/chat.svg";
import Zap from "../../public/icons/zap.svg";
import CookieBanner from "../CookieBanner/CookieBanner";
import { getProfilePictureUrl } from "../../firebase/drive/upload_file";
//import RecommendBox from "../RecommendBox/RecommendBox";

type MenuItem = Required<MenuProps>["items"][number];


/**
 * Provides a special sidebar layout for our homepage
 * @param props.children Page content
 * @param props.context.user User object of the application
 * @param props.context.login Firebase login object
 * @param props.context.role Role object of the current user
 * @param props.context.profile Profilepicture information
 * @param props.category.value Category selected by the user for the assistants
 * @param props.category.setter Dispatcher responsible for updating the assistant category 
 * @returns Sidebar with assistant category selector
 */
const HomeSidebarLayout = ( props: { 
  children: ReactNode,
  context: {user: User, login, role, profile},
  category: { value: string, setter: Dispatch<SetStateAction<string>>},
  messageApi,
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
  const [ screenwidth, setScreenwidth ] = useState(window.innerWidth);

  /**
   * Effect used for getting the users profile picture 
   */
  useEffect( () => {
    const setProfileImage = async () => {
      if(props.context.login?.uid){
        const url = await getProfilePictureUrl( props.context.login.uid );
        setImageUrl( url );
      }
    }

    setProfileImage();
  }, [props.context.login] );

  
  /**
   * Effect used for responsive sizing of the sidebar
   */
  useEffect(() => {
    if(screenwidth <= 1500){
      setBreakpoint("lg");
      setCollapseWidth(0);
      setCollapsed(true);
    }else{
      setCollapsed(true);
      setBreakpoint(undefined);
      setCollapseWidth(80);
    }
  }, [screenwidth]);

  /**
   * Effect used bind a eventlistener to window resizes,
   * so we can adapt the sidebar size accordingly without a page reload
   */
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

  /**
   * Returns a MenuItem constructed from the given parameters. If the given check-function returns false, we return null
   * if it returns true, we return the MenuItem
   * @param label Visible label of the MenuItem
   * @param key Internal key
   * @param check Guardfunction. If true return item, otherwise return null
   * @param icon Icon dispayed left of the label
   * @param children Children of the MenuItem
   * @returns Either the MenuItem or null
   */
  const getItem = ( label: React.ReactNode, key: React.Key, check: () => boolean, icon?: React.ReactNode, children?: MenuItem[] ): MenuItem => {
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

  /**
   * Links displayed in the sidebar
   */
  const items = [
    getItem( <Link href={"/"} data-linkname={"home"}>Home</Link>, "0", () => {
      return true 
    }, <Icon component={Home} className={styles.sidebariconsvg} viewBox='0 0 22 22'/> ),
    getItem( <Link href={"/profiles"} data-linkname={"profiles"}>Profile</Link>, "3", () => {
      return true 
    }, <Icon component={Profiles} className={styles.sidebariconsvg} viewBox='0 0 22 22'/> ),
    getItem( <Link href={"/usage"} data-linkname={"usage"}>Nutzung</Link>, "2", () => {
      return true
    }, <Icon component={Stats} className={styles.sidebariconsvg} viewBox='0 0 22 22'/> ),
    getItem( <Link href={"/company"} data-linkname={"company"}>Firma</Link>, "1", () => {
      if(props.context.role){
        return props.context.role.isCompany;
      }else{
        return false;
      }
    }, <Icon component={Settings} className={styles.sidebariconsvg} viewBox='0 0 22 22'/> )
  ];

  // Links displayd in the sidebar footer
  const footeritems = [];

  /**
   * Get the key of the currently selected page
   * @returns Selected key of the MenuItem. Returns -1 if the page could't be found in the keylist
   */
  const getDefaultSelected = () => {
    let lastfound = -1;
    
    // List of patterns to distinguish between the pages
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

  /**
   * Subcomponent to render the overlay menu of the user profile
   */
  const profilemenu = (
    <div className={styles.avatarmenu}>
      <Link href={"/account"} data-linkname={"account"} className={styles.accountlink}>
        <div className={styles.profile}>
          <Avatar
            size={40}
            style={{ color: "#474747", backgroundColor: "#F2F4F7" }}
            src={props.context.profile.picture}
          >
            {(props.context.user.email)? props.context.user.email.charAt(0):""}
          </Avatar>
          <div className={styles.profileinfo}>Mein Account</div>
        </div>
      </Link>
      <Divider className={styles.menudivider} />
      <div className={styles.iconlink}>
        <Link href="/logout" data-linkname={"logout"} className={styles.linkwrapper}>
          <LogoutOutlined />
          <div className={styles.iconlinktext}>Ausloggen</div>
        </Link>
      </div>
    </div>
  );
  
  /**
   * Check if the given name is the currently selected category provided to the sidebar
   * @param name Category to test agains
   * @returns Either a styling object to represent the selected cat or an empty string
   */
  const isselected = (name: string) => {
    if(name == props.category.value){
      return styles.selectedcat;
    }else{
      return "";
    }
  }

  /**
   * Subcomponent to return a badge containing the amount of faved assistants
   * @returns Badge with count of faved assistants
   */
  const FavouriteBadge = () => {
    if(props.context.user.services?.favourites) {
      return(
        <Badge className={styles.badge} status="default" color="#f2f4f7" count={props.context.user.services.favourites.length}/>
      );
    }
  }

  /**
   * Subcomponent to render a header if the screenwidth is below a fixed amount
   * @returns Header component
   */
  const MobileHeader = () => {
    if(screenwidth <= 1500){
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

  // Check the current screenwidth
  if(screenwidth <= 1500){
    // if the screenwidth is below 1500px render the mobile layout of the sidebar
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
          },
          Layout: {
            headerBg: "#101828"
          }
        }
      }}>
        <Layout className={styles.layout} hasSider={!(screenwidth <= 1500)}>
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
                      style={(props.context.profile.picture)? { color: "#474747" }: { color: "#474747", backgroundColor: "#F2F4F7" }}
                      src={props.context.profile.picture}
                    >
                      {(props.context.user.email)? props.context.user.email.charAt(0).toUpperCase():""}
                    </Avatar>
                  </Popover>
                </div>
              </div>
            </div>
            <div className={styles.homesidebarcontainer_mobile}>
              <div className={styles.homesidebar}>
                <div className={styles.logo}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={"/logo_w.svg"} alt="Logo" width={100}/>
                </div>
                <div className={styles.title}>Assistenten</div>
                <List className={styles.assistantlist} split={false}>
                  <List.Item className={`${styles.assistantlink} ${isselected("all")}`} data-function={"all"} onClick={() => {
                    props.category.setter("all");
                    setSidebarOpen(false);
                  }}>
                    <Icon component={All} className={styles.assistanticon} viewBox='0 0 22 22'/>
                    <div className={styles.assistantcatname}>Alle</div>
                  </List.Item>
                  <List.Item className={`${styles.assistantlink} ${isselected("favourites")}`} data-function={"fav"} onClick={() => {
                    props.category.setter("favourites");
                    setSidebarOpen(false);
                  }}>
                    <Icon component={Heart} className={styles.assistanticon} viewBox='0 0 22 22'/>
                    <div className={styles.assistantcatname}>Favoriten</div>
                    <div className={styles.assistantcount}>
                      <FavouriteBadge />
                    </div>
                  </List.Item>
                  <List.Item className={`${styles.assistantlink} ${isselected("content")}`} data-function={"content"} onClick={() => {
                    props.category.setter("content");
                    setSidebarOpen(false);
                  }}>
                    <Icon component={Chat} className={styles.assistanticon} viewBox='0 0 22 22'/>
                    <div className={styles.assistantcatname}>Content-Erstellung</div>  
                  </List.Item>
                  <List.Item className={`${styles.assistantlink} ${isselected("productivity")}`} data-function={"productivity"} onClick={() => {
                    props.category.setter("productivity");
                    setSidebarOpen(false);
                  }}>
                    <Icon component={Zap} className={styles.assistanticon} viewBox='0 0 22 22'/>
                    <div className={styles.assistantcatname}>Produktivität</div>  
                  </List.Item>
                  {(props.context.role.canManageUser)?
                    <List.Item className={`${styles.assistantlink} ${isselected("unpublished")}`} data-function={"unpublished"} onClick={() => {
                      props.category.setter("unpublished");
                      setSidebarOpen(false);
                    }}>
                      <Icon component={All} className={styles.assistanticon} viewBox='0 0 22 22'/>
                      <div className={styles.assistantcatname}>Unveröffentlicht</div>
                    </List.Item>: <></>}
                </List>
              </div>
              {/* <RecommendBox user={props.context.user} messageApi={props.messageApi} /> */}
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
                      style={(props.context.profile.picture)? { color: "#474747" }: { color: "#474747", backgroundColor: "#F2F4F7" }}
                      src={props.context.profile.picture}
                    >
                      {(props.context.user.email)? props.context.user.email.charAt(0).toUpperCase():""}
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
    // If the width of the screen is above 1500px we render the desktop variant of the component
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
        <Layout className={styles.layout} hasSider={!(screenwidth <= 1500)}>
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
                      style={(props.context.profile.picture)? { color: "#474747" }: { color: "#474747", backgroundColor: "#F2F4F7" }}
                      src={props.context.profile.picture}
                      data-name={"profilemenu"}
                    >
                      {(props.context.user.email)? props.context.user.email.charAt(0).toUpperCase():""}
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
                  <div className={styles.logo}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={"/siteware-logo-black.svg"} alt="Logo" width={100}/>
                  </div>
                  <div className={styles.title}>Assistenten</div>
                  <List className={styles.assistantlist} split={false}>
                    <List.Item className={`${styles.assistantlink} ${isselected("all")}`} data-function={"all"} onClick={() => {
                      props.category.setter("all"); 
                    }}>
                      <Icon component={All} className={styles.assistanticon} viewBox='0 0 22 22'/>
                      <div className={styles.assistantcatname}>Alle</div>
                    </List.Item>
                    <List.Item className={`${styles.assistantlink} ${isselected("favourites")}`} data-function={"fav"} onClick={() => {
                      props.category.setter("favourites"); 
                    }}>
                      <Icon component={Heart} className={styles.assistanticon} viewBox='0 0 22 22'/>
                      <div className={styles.assistantcatname}>Favoriten</div>
                      <div className={styles.assistantcount}>
                        <FavouriteBadge />
                      </div>
                    </List.Item>
                    <List.Item className={`${styles.assistantlink} ${isselected("content")}`} data-function={"content"} onClick={() => {
                      props.category.setter("content"); 
                    }}>
                      <Icon component={Chat} className={styles.assistanticon} viewBox='0 0 22 22'/>
                      <div className={styles.assistantcatname}>Content-Erstellung</div>  
                    </List.Item>
                    <List.Item className={`${styles.assistantlink} ${isselected("productivity")}`} data-function={"productivity"} onClick={() => {
                      props.category.setter("productivity");
                      setSidebarOpen(false);
                    }}>
                      <Icon component={Zap} className={styles.assistanticon} viewBox='0 0 22 22'/>
                      <div className={styles.assistantcatname}>Produktivität</div>  
                    </List.Item>
                    {(props.context.role.canManageUser)? 
                      <List.Item className={`${styles.assistantlink} ${isselected("unpublished")}`} data-function={"unpublished"} onClick={() => {
                        props.category.setter("unpublished");
                        setSidebarOpen(false);
                      }}>
                        <Icon component={All} className={styles.assistanticon} viewBox='0 0 22 22'/>
                        <div className={styles.assistantcatname}>Unveröffentlicht</div>
                      </List.Item>: <></>}
                  </List>
                </div>
                {/* <RecommendBox user={props.context.user} messageApi={props.messageApi} /> */}
              </aside>
              <div className={styles.childrencontainer}>{}{props.children}</div>
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