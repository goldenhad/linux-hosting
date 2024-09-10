import axios, { type CreateAxiosDefaults } from "axios";

const { APIKEY, AGENTID, BASEURL } = window.SITEWARE_CONFIG || {};

const settings: CreateAxiosDefaults = {} as CreateAxiosDefaults;

if(!BASEURL){
  settings.baseURL = process.env.REACT_APP_BASEURL
  settings.headers = {
    "x-api-key": process.env.REACT_APP_APIKEY,
    "x-assistant-id": process.env.REACT_APP_ASSISTANTID
  }
}
export const API = axios.create({
  baseURL: BASEURL,
  headers: {
    "x-api-key": APIKEY,
    "x-assistant-id": AGENTID
  },
  ...settings
})