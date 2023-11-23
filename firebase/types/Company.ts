
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

export type Order = {
    id: string,
    timestamp: number,
    tokens: number,
    amount: number,
    method: string,
    state: string,
    invoiceId: string,
}

export type Company = {
    name: string;
    street: string;
    city: string;
    postalcode: string;
    country: string;
    settings: CompanySettings;
    tokens: number;
    unlimited: boolean;
    orders: Array<Order>
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
    unlimited: false,
    orders: []
}