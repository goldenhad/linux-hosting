import React, { Dispatch, ReactNode, SetStateAction, useEffect, useState } from "react";
import { LogoutOutlined } from "@ant-design/icons";
import Icon, { HistoryOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Avatar, ConfigProvider, Divider, Drawer, FloatButton, Layout, Menu, Popover } from "antd";
import Link from "next/link";
import { useRouter } from "next/router";
const { Header, Content, Footer, Sider } = Layout;
import { User } from "../../firebase/types/User";
import styles from "./editorsidebar.module.scss";
import Home from "../../public/icons/home.svg";
import Nav from "../../public/icons/nav.svg";
import Profiles from "../../public/icons/profiles.svg";
import Help from "../../public/icons/help.svg";
import CookieBanner from "../CookieBanner/CookieBanner";
import { DndContext, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";


type MenuItem = Required<MenuProps>["items"][number];




function Draggable(props) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: props.id
  });
  const style = {
    // Outputs `translate3d(x, y, 0)`
    transform: CSS.Translate.toString(transform)
  };

  return (
    <button ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {props.children}
    </button>
  );
}


/**
 * Provides a layout with a sidebar. The sidebar implements a simple navigation
 * @param props.children Page content
 * @param props.context.user User object of the application
 * @param props.context.login Firebase login object
 * @param props.context.role Role object of the current user
 * @param props.context.profile Profilepicture information
 * @param props.hist Dispatcher used to display the history if we render the mobile header
 * @returns SidebarLayout component
 */
const EditorSidebar = ( props: {
    children: ReactNode,
} ) => {
  const [collapsed, setCollapsed] = useState( false );
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
  const [parent, setParent] = useState(null);



  /**
     * Effect used for responsive sizing of the sidebar
     */
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

  // Links displayd in the sidebar footer
  const footeritems = [];
  

  /**
     * Subcomponent to render a header if the screenwidth is below a fixed amount
     * @returns Header component
     */
  const MobileHeader = () => {
    if(screenwidth <= 1500){
      return(
        <Header className={styles.header}>
          
        </Header>
      );
    }
  }




  // Check the current screenwidth
  if(screenwidth <= 1500){
    // if the screenwidth is below 1500px render the mobile layout of the sidebar
    return (
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
            </div>
            <div className={styles.sidebarbottomcontainer}>
              <div className={styles.avatarcontainer}>
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

            <div className={styles.sidebarbottomcontainer}>
              <div className={styles.avatarcontainer}>
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
        </Layout>
        <CookieBanner />
      </Layout>

    );
  }else{
    // If the width of the screen is above 1500px we render the desktop variant of the component
    return (
      <DndContext onDragEnd={({ over }) => {
        setParent(over ? over.id : null);
      }}>
        <Layout className={styles.layout} hasSider={true}>
          <Sider
            collapsible
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
              <div className={styles.lib}>

              </div>

              <div className={styles.sidebarbottomcontainer}>
                <div className={styles.avatarcontainer}>
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
          </Layout>
          <CookieBanner />
        </Layout>

      </DndContext>

    );
  }
};
export default EditorSidebar;