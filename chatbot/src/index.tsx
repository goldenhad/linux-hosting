import React from 'react';
import { Root, createRoot } from 'react-dom/client';
import App from './App';

let reactRoot: Root;
window.initChatBot = function (){
    if(reactRoot && reactRoot?.unmount){
        reactRoot.unmount();
    }
    let rootEle: HTMLElement | null = document.getElementById('___MAIL_BUDDY___');
    if(!rootEle){
        rootEle = document.createElement('div');
        rootEle.id = '___MAIL_BUDDY___';
        document.body.append(rootEle);
    }
    reactRoot = createRoot(rootEle as HTMLElement);
    reactRoot.render(<App />)
}
