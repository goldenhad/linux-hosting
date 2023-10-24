import { Profile } from "./Profile";


export type User =  {
    username: string,
    firstname: string,
    lastname: string,
    Company: string,
    Role: string,
    profiles: Array<Profile>
}

export const basicUser: User = {
    username: "",
    Company: "",
    firstname: "",
    lastname: "",
    Role: "",
    profiles: []
}