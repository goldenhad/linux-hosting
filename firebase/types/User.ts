import { Profile } from "./Profile";


export type User =  {
    username: string,
    Company: string,
    Role: string,
    profiles: Array<Profile>
}

export const basicUser: User = {
    username: "",
    Company: "",
    Role: "",
    profiles: []
}