import { Usage } from "./Company";

export type MonologState = {
    profile: string,
    content: string,
    address: string,
    order: string,
    length: string,
}

export type DialogState = {
    profile: string,
    dialog: string,
    continue: string,
    address: string,
    order: string,
    length: string,
}

export type BlogState = {
  profile: string,
  content: string,
  order: string,
  length: string,
}

export type ExcelState = {
  profile: string,
  question: string,
}

type State = {
    dialog: string
    monolog: string
    blog: string
}

type RecommendState = {
    timesUsed: number,
}

export type TourState = {
    home: boolean,
    dialog: boolean,
    monolog: boolean,
    blog: boolean,
    usage: boolean,
    profiles: boolean,
    company: boolean,
    excel: boolean,
    translator: boolean
}

export type History = {
  dialog: string,
  monolog: string,
  dialog_old: string,
  monolog_old: string,
  blog: string,
  excel: string,
}

export type User =  {
    username: string,
    firstname: string,
    lastname: string,
    email: string,
    Company: string,
    Role: string,
    profiles: Array<string>,
    usedCredits: Array<Usage>,
    lastState: State,
    setupDone: boolean,
    salt: string,
    inviteCode: string,
    recommend: RecommendState,
    tour: TourState,
    services:{
      favourites: Array<string>
    }
    history: History
}

export const basicUser: User = {
  username: "",
  Company: "",
  firstname: "",
  lastname: "",
  email: "",
  Role: "",
  profiles: [],
  usedCredits: [],
  salt: "",
  lastState: {
    dialog: "",
    monolog: "",
    blog: ""
  },
  setupDone: false,
  inviteCode: "",
  recommend: {
    timesUsed: 0
  },
  tour: {
    home: false,
    dialog: false,
    monolog: false,
    blog: false,
    usage: false,
    profiles: false,
    company: false,
    excel: false,
    translator: false
  },
  services: {
    favourites: []
  },
  history: {
    dialog: "",
    monolog: "",
    dialog_old: "",
    monolog_old: "",
    blog: "",
    excel: ""
  }
}