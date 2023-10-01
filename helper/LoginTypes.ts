import { Company } from "@prisma/client";
import { JsonValue } from "@prisma/client/runtime/library";

export type Login = {
    id: number,
    username: string,
    email: string,
    roleid: number
}

export type CombinedUser = {
    id: number,
    username: string,
    email: string,
    role: Role,
    project: Project
}

export type Project = {
    id: number,
    name: String,
    company: Company
}

//Redefine the product type for the product query
export type Role = {
    id: number,
    name: string,
    capabilities: JsonValue,
}
  
export interface InitialProps {
    Data: any;
    InitialState: CombinedUser;
}