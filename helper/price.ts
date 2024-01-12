export const mailPriceMapping = [
  5.0,
  15.0,
  50.0,
  99.0,
  250.0,
  465.0,
  999.0
]

export const mailAmountMapping = [
  15,
  50,
  178,
  380,
  1000,
  2150,
  5000
]

export const mailSavingMapping = [
  0,
  0.1,
  0.1573,
  0.2184,
  0.25,
  0.3025,
  0.4006
]

export const mailMarks = {
  0: "15 Mails",
  1: "50 Mails",
  2: "178 Mails",
  3: "380 Mails",
  4: "1000 Mails",
  5: "2150 Mails",
  6: "5000 Mails"
}

export const convertTokensToPrice = (tokens: number) => {
  return parseFloat((tokens/3000 * 0.03 * 6).toFixed(0));
}

export const priceToIndex = (price: number) => {
  return mailPriceMapping.findIndex((value) => {
    return value == price;
  })
}

export const calculateTokens = (tokenstobuy) => {
  return parseFloat((mailPriceMapping[tokenstobuy]/( 0.03 * 6 ) *3000).toFixed(2));
}