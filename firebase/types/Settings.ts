
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

export type Calculations = {
    creditsProMail: number,
    costPerToken: number,
    products: Array<number>,
    profitPercent: number,
    tokensPerCredit: number,
    normalizer: number,
    startCredits: number
}