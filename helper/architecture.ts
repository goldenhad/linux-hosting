import { TourState, User, basicUser } from "../firebase/types/User";

export function handleEmptyString( input: any ){
  return ( input )? input: "";
}

export function handleEmptyArray( input: any ){
  return ( input )? input: [];
}

export function convertToCurrency( val: number ){
  const euro = new Intl.NumberFormat( "de-DE", {
    style: "currency",
    currency: "EUR"
  } );

  return euro.format( val );
}
export const listToOptions = ( liste: Array<string> ) => {
  const arr = liste.map( ( element ) => {
    return {
      value: element.toLowerCase(),
      label: element
    };
  } );
  
  return arr;
}

export const handleEmptyUser = ( user: User ) => {
  if( user ){
    return user;
  }else{
    return basicUser;
  }
}

export const handleUndefinedTour = ( tour: TourState ) => {
  if( tour ){
    return tour;
  }else{
    return {
      home: false,
      dialog: false,
      monolog: false,
      usage: false,
      profiles: false
    };
  }
}