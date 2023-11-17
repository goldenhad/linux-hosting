import { Usage } from "./Company";
import { Profile } from "./Profile";


type State = {
    dialog: {
        profile: string,
        dialog: string,
        continue: string,
        address: string,
        order: string,
        length: string,
    },
    monolog: {
        profile: string,
        content: string,
        address: string,
        order: string,
        length: string,
    }
}

export type User =  {
    username: string,
    firstname: string,
    lastname: string,
    Company: string,
    Role: string,
    profiles: Array<Profile>,
    usedCredits: Array<Usage>,
    lastState: State,
    setupDone: boolean,
}

export const basicUser: User = {
    username: "",
    Company: "",
    firstname: "",
    lastname: "",
    Role: "",
    profiles: [],
    usedCredits: [],
    lastState: {
        dialog: {
            profile: "",
            dialog: "",
            continue: "",
            address: "",
            order: "",
            length: "",
        },
        monolog: {
            profile: "",
            content: "",
            address: "",
            order: "",
            length: "",
        }
    },
    setupDone: false,
}