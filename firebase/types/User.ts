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

type State = {
    dialog: string
    monolog: string
}

type RecommendState = {
    timesUsed: number,
}

export type TourState = {
    home: boolean,
    dialog: boolean,
    monolog: boolean,
    usage: boolean,
    profiles: boolean,
    company: boolean
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
    monolog: ""
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
    usage: false,
    profiles: false,
    company: false
  },
  services: {
    favourites: []
  }
}