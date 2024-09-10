import React from "react";
import { Root, createRoot } from "react-dom/client";
import App from "./App";

let reactRoot: Root;

window.initChatBot = () => {
  if (reactRoot && reactRoot?.unmount) {
    reactRoot.unmount();
  }
  let rootEle: HTMLElement | null = document.getElementById("___MAIL_BUDDY___");
  if (!rootEle) {
    rootEle = document.createElement("div");
    rootEle.id = "___MAIL_BUDDY___";
    document.body.append(rootEle);
  }
  reactRoot = createRoot(rootEle as HTMLElement);
  reactRoot.render(<App />)
}

const rootEle: HTMLElement | null = document.getElementById("siteware-root");
if (rootEle) {
  reactRoot = createRoot(rootEle as HTMLElement);
  reactRoot.render(<App />)
}else{
  window.initChatBot()
}

if (module.hot) {
  module.hot.accept("./App", () => {

    const NextApp = require("./App").default;
    console.log("Chnages updated")
    // Render the updated component
    reactRoot.render(<NextApp />);
  })
}