
export type CompanySettings = {
    background: string;
}

export type Quota = {
    price: number;
    tokens: number;
    features: Array<String>
}

export type Usage = {
    amount: number;
    month: number;
    year: number;
}

export type Company = {
    name: string;
    street: string;
    city: string;
    postalcode: string;
    country: string;
    settings: CompanySettings;
    tokens: number;
}

export const basicCompany = {
    name: "",
    street: "",
    city: "",
    postalcode: "",
    country: "",
    settings: {
        background: "",
    },
    tokens: 0,
}