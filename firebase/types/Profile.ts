import { type } from "os";

export type ProfileSettings = {
    personal: string;
    salutation: string;
    stil: string;
    order: string;
    emotions: string;
    tags: Array<string>;
}

export type Profile = {
    name:      string
    settings:  ProfileSettings;
    salt:      string
}

export const basicProfile = {
    name: "",
    settings: {
        personal: "",
        salutation: "",
        stil: "",
        order: "",
        emotions: "",
        tags: [],
    },
    salt: "",
}