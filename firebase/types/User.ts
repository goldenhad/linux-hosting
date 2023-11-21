import { Usage } from "./Company";
import { Profile } from "./Profile";


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

export type User =  {
    username: string,
    firstname: string,
    lastname: string,
    Company: string,
    Role: string,
    profiles: Array<string>,
    usedCredits: Array<Usage>,
    lastState: State,
    setupDone: boolean,
    salt: string,
}

export const basicUser: User = {
    username: "",
    Company: "",
    firstname: "",
    lastname: "",
    Role: "",
    profiles: [],
    usedCredits: [],
    salt: "",
    lastState: {
        dialog: "",
        monolog: ""
    },
    setupDone: false,
}