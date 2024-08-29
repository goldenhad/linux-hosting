import axios from "axios";

const { APIKEY, AGENTID } = window.SITEWARE_CONFIG;
export const API = axios.create({
  baseURL: process.env.REACT_APP_URL,
  headers: {
    "x-api-key": APIKEY,
    "x-assistant-id": AGENTID
  }
})