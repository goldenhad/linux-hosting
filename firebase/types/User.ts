import { Usage } from "./Company";
import { Profile } from "./Profile";


export type User =  {
    username: string,
    firstname: string,
    lastname: string,
    Company: string,
    Role: string,
    profiles: Array<Profile>,
    usedCredits: Array<Usage>,
}

export const basicUser: User = {
    username: "",
    Company: "",
    firstname: "",
    lastname: "",
    Role: "",
    profiles: [],
    usedCredits: []
}