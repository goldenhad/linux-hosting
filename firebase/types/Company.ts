
export type CompanySettings = {
    background: string;
}

export type Quota = {
    price: number;
    tokens: number;
    features: Array<string>
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
    type: string
}

export type Plan = {
    product: number,
    timestamp: number,
    state: string,
    threshold: number
}

export type InvitedUser = {
    email: string;
    name: string;
    role: string;
    wasInvited: boolean;
}

export type PaymentMethod = {
    id: string,
    type: string,
    name: string,
    default: boolean,
    methodId: string,
    lastState: "error" | "successfull" | "init"
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
    orders: Array<Order>;
    recommended: boolean;
    invitedUsers: Array<InvitedUser>;
    plan?: Plan;
    customerId?: string;
    paymentMethods: Array<PaymentMethod>
}

export const basicCompany = {
  name: "",
  street: "",
  city: "",
  postalcode: "",
  country: "",
  settings: {
    background: ""
  },
  tokens: 0,
  unlimited: false,
  orders: [],
  recommended: false,
  invitedUsers: []
}