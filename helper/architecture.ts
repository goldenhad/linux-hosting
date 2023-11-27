export function handleEmptyString(input: any){
    return (input)? input: "";
}

export function handleEmptyArray(input: any){
    return (input)? input: [];
}

export function convertToCurrency(val: number){
    let euro = new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
    });

    return euro.format(val);
}
export const listToOptions = (liste: Array<string>) => {
    const arr = liste.map(element => {
      return {
        value: element.toLowerCase(),
        label: element
      };
    });
  
    return arr;
  }
