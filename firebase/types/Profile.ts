import { type } from "os";

export type ProfileSettings = {
    personal: string;
    stil: string;
    emotions: string;
    tags: Array<string>;
}

export type Profile = {
    name:      string
    settings:  ProfileSettings;
}

export const basicProfile = {
    name: "",
    settings: {
        personal: "",
        stil: [],
        tags: [],
    },
    salt: "",
}