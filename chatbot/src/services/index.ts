import axios from "axios";

const { APIKEY, AGENTID, BASEURL } = window.SITEWARE_CONFIG;
export const API = axios.create({
  baseURL: BASEURL,
  headers: {
    "x-api-key": APIKEY,
    "x-assistant-id": AGENTID
  }
})