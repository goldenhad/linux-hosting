import { Button } from "antd";
import React from "react";
import styles from "./fatbutton.module.scss"

const FatButton = ( props: { 
  onClick?: React.MouseEventHandler<HTMLElement>,
  text?: string,
  isSubmitButton?: boolean,
  danger?: boolean,
  disabled?: boolean,
  type?: "link" | "text" | "primary" | "default" | "dashed"
} ) => {


  if(props.isSubmitButton){
    return (
      <div className={styles.buttonrow}>
        <Button type={(props.type)? props.type: "primary"} htmlType='submit' danger={props.danger} >{props.text}</Button>
      </div>
    );
  }else{
    return (
      <div className={styles.buttonrow}>
        <Button type={(props.type)? props.type: "primary"} onClick={props.onClick} danger={props.danger} disabled={props.disabled}>{props.text}</Button>
      </div>
    );
  }

  
}

export default FatButton;
