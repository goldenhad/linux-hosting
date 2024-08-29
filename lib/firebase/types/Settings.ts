
export type Templates = {
    aboutus: string,
    blog: string,
    description: string,
    dialog: string,
    excel: string,
    member: string,
    monolog: string,
    ownaboutus: string,
    services: string,
    singleuser: string,
    webcontent: string,
    translator: string
}

export type Parameters = {
    emotions: Array<string>,
    lengths: Array<string>,
    motives: Array<string>,
    style: Array<string>,
    address: Array<string>
}

export type InvoiceSettings = {
    last_used_number: number,
    number_offset: number,
    prices: Array<string>
}

export type Product = {
    id: number,
    price: number,
    discount: number
}

export type Calculations = {
    tokenProMail: {
        in: number,
        out: number
    },
    costPerToken: {
        in: number,
        out: number
    },
    products: Array<Product>,
    profitPercent: number,
    startCredits: number,
    savedMinutesProMail: number,
    autoDiscountPercent: number,
    coupons: Array<Coupon>,
    assistantcost: Array<AssistantCost>,
    services: ServiceParameters
}

export type EmbeddingParameters = {
    chunkSize: number,
    overlap: number
}

export type ServiceParameters = {
    profitPercent: {
        QaA: number,
        chat: number
    }
}

export type Coupon = {
    code: string,
    credits: number
}

export type AssistantCost = {
    id: string,
    perUnit: number
}