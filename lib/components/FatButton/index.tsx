import { Button } from "antd";
import React from "react";
import styles from "./fatbutton.module.scss"

/**
 * Siteware business button design
 * @param props.onClick Function to be called if the button is clicked
 * @param props.text Text on the button
 * @param props.isSubmitButton Flag weither this button is used as submit in a form or not
 * @param danger Flag to check if this button is a danger button (red)
 * @param disabled Is this button disabled?
 * @param type Antd type of the button
 * @returns FatButton Component
 */
const FatButton = ( props: { 
  onClick?: React.MouseEventHandler<HTMLElement>,
  text?: string,
  isSubmitButton?: boolean,
  danger?: boolean,
  disabled?: boolean,
  loading?: boolean,
  type?: "link" | "text" | "primary" | "default" | "dashed"
} ) => {

  if(props.isSubmitButton){
    return (
      <div className={styles.buttonrow}>
        <Button type={(props.type)? props.type: "primary"} loading={props.loading} htmlType='submit' danger={props.danger} >{props.text}</Button>
      </div>
    );
  }else{
    return (
      <div className={styles.buttonrow}>
        <Button
          type={(props.type)? props.type: "primary"}
          loading={props.loading}
          onClick={props.onClick}
          danger={props.danger}
          disabled={props.disabled}
        >{props.text}</Button>
      </div>
    );
  }

  
}

export default FatButton;
