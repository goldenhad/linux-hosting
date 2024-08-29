import { Calculations, Product } from "../firebase/types/Settings"
import { AssistantType } from "../firebase/types/Assistant";

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

/* export const convertTokensToPrice = (tokens: number, calculations: Calculations) => {
  return parseFloat((tokens/calculations.tokensPerCredit * calculations.costPerToken * calculations.profitPercent/100).toFixed(0));
}

export const priceToIndex = (price: number, calculations: Calculations) => {
  return calculations.products.findIndex((value) => {
    return value == price;
  })
}

export const calculateTokens = (tokenstobuy: number, calculations: Calculations) => {
  return parseFloat((calculations.products[tokenstobuy]/( calculations.costPerToken * calculations.profitPercent/100 ) * calculations.tokensPerCredit).toFixed(2));
} */

export class TokenCalculator{
  parameter: Calculations;

  constructor(calc: Calculations){
    this.parameter = calc;
  }

  indexToTokens(index: number, additionalDiscount?: boolean): number{
    const priceObj = this.parameter.products.find((obj: Product) => {
      return obj.id === index;
    });

    if(priceObj){
      const price = priceObj.price;
      let discount = priceObj.discount;
      if(additionalDiscount){
        discount += this.parameter.autoDiscountPercent;
      }

      const cost = (this.parameter.costPerToken.in)/1000 + (this.parameter.costPerToken.out)/1000;
      const profit = this.parameter.profitPercent/100;

      return parseFloat((price/(cost * profit) * (1 + discount/100)).toFixed(0));
    }else{
      throw Error("Price undefined");
    }
  }

  normalizeTokens(tokens: number): number{
    const nomalizer = 1/(this.parameter.tokenProMail.in + this.parameter.tokenProMail.out);
    return tokens * nomalizer;
  }

  denormalizeTokens(tokens: number): number{
    const nomalizer = (this.parameter.tokenProMail.in + this.parameter.tokenProMail.out);
    return tokens * nomalizer;
  }

  round(numberToRound: number, digits: number): number {
    return parseFloat((numberToRound).toFixed(digits));
  }


  indexToPrice(index: number): number {
    const priceObj = this.parameter.products.find((obj: Product) => {
      return obj.id === index;
    });

    if(priceObj){
      return priceObj.price;
    }else{
      throw Error("Price undefined");
    }
  }

  cost(tokens: { in: number, out: number }, assistantType: AssistantType): number {
    let profit = 0;

    console.log(this.parameter);

    if(assistantType == AssistantType.QAA){
      profit = this.parameter.services.profitPercent.QaA;
    }else if(assistantType == AssistantType.CHAT){
      profit = this.parameter.services.profitPercent.chat;
    }

    console.log("PROFIT: ", profit);

    return ((tokens.in * this.parameter.costPerToken.in) + (tokens.out * this.parameter.costPerToken.out)) * profit/100
  }
}

/**
 * Converts the given number to a string in german currency format
 * @param value Number to convert
 */
export const toGermanCurrencyString = (value: number): string => {
  if(value >= 0.01 || value == 0){
    return value.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
  }else{
    if(value < 0.01){
      return "< 0.01 €";
    }else{
      return `< ${value.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}`;
    }
  }
}