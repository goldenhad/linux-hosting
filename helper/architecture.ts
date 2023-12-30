/**
 *  Helper file for functions relevant for the whole
 *  architecture.
 *  Functions in this file should be releative generic
 * 
 */

import { TourState, User, basicUser } from "../firebase/types/User";

/**
 * Wrapper function to handle empty strings. Returns a default value
 * if the given string is empty/undefined/false etc.
 * 
 * @param input String to test for validity
 * @returns Either input or an empty string
 */
export function handleEmptyString( input: any ){
  return ( input )? input: "";
}

/**
 * Wrapper function to handle empty arrays. Returns an empty array if 
 * the given array is undefined or false
 * 
 * @param input Array to test for validity 
 * @returns Either the input array or an empty array
 */
export function handleEmptyArray( input: any ){
  return ( input )? input: [];
}

/**
 * Converts a given number to a german currency string
 * @param val The number that should be converted
 * @returns The number in german number format as string
 */
export function convertToCurrency( val: number ){
  const euro = new Intl.NumberFormat( "de-DE", {
    style: "currency",
    currency: "EUR"
  } );

  return euro.format( val );
}

/**
 * Converts a given string array to antd select options
 * @param list String array that should be converted
 * @returns Array of select options
 */
export const listToOptions = ( list: Array<string> ) => {
  const arr = list.map( ( element ) => {
    return {
      value: element.toLowerCase(),
      label: element
    };
  } );
  
  return arr;
}

/**
 * Checks if the given Database User object is not undefined and
 * returns a basicUser representation otherwise.
 * @param user Database User object
 * @returns basicUser representation if user is undefined, otherwise the user is returned
 */
export const handleEmptyUser = ( user: User ) => {
  if( user ){
    return user;
  }else{
    return basicUser;
  }
}

/**
 * Checks the given state of the usertour for definedness. If the
 * given tour object is undefined a default TourState object is returned.
 * Otherwise the given tour object is returned.
 * 
 * @param tour TourState object that should be testet
 * @returns The tour object if it is defined, the default tour state otherwise
 */
export const handleUndefinedTour = ( tour: TourState ) => {
  if( tour ){
    return tour;
  }else{
    return {
      home: true,
      dialog: true,
      monolog: true,
      blog: true,
      usage: true,
      profiles: true,
      company: true
    };
  }
}


export const onlyUpdateIfSet = ( val, ideal ) => {
  if( val != "" ){
    return val;
  }else{
    return ideal;
  }
}

export const normalizeTokens = (token: number) => {
  return parseFloat((token/500).toFixed(2));
}