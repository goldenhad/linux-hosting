import { Prisma } from "@prisma/client";

export interface Crud{
    create: boolean,
    edit: boolean,
    delete: boolean,
}

export interface Capabilities{
    projects: {
        create: boolean,
        edit: boolean,
        delete: boolean,
        persons: Crud,
        credits: Crud,
    },
    users: Crud,
}