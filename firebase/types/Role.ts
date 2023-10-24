
export type Crud = {
    create: boolean;
    edit: boolean;
    delete: boolean;
}

export type Capabilities = {
    projects: Crud;
    persons: Crud;
    credits: Crud;
    users: Crud;
    superadmin: boolean;
}

export type Role = {
    capabilities: Capabilities;
}

export const basicRole = {
    capabilities: {
        project: {create: false, edit: false, delete: false},
        persons: {create: false, edit: false, delete: false},
        credits: {create: false, edit: false, delete: false},
        superadmin: false,
    }
}