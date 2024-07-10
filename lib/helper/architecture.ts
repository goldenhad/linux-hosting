/**
 *  Helper file for functions relevant for the whole
 *  architecture.
 *  Functions in this file should be releative generic
 * 
 */

import { TourState, User, basicUser } from "../firebase/types/User";
import axios from "axios";
import { Order } from "../firebase/types/Company";
import updateData from "../firebase/data/updateData";
import { toGermanCurrencyString } from "./price";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../db";

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
      company: true,
      excel: true,
      translator: true,
      plain: true
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

export const reduceCost = (companytokens: number, cost: number) => {
  // Reduce the token balance by the used token
  if( companytokens - cost <= 0 ){
    companytokens = 0;
  }else{
    companytokens -= cost
  }
}


export const updateCompanyTokens = async (context, calculator, notificationApi, cost) => {
  const MSGDURATION = 3;
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  if(context.company.plan){
    if(context.company.plan?.state == "active"){
      let paymentSuccesfull = false;
      let invoiceid = "";

      // Check if company has fewer tokens than the threshold
      if(context.company.tokens < context.company.plan.threshold){
        // Try to charge the user with the values defined in the plan
        try{
          const paymentreq = await axios.post("/api/payment/issuepayment", {
            price: context.calculations.products[context.company.plan?.product].price,
            customer: context.company.customerId,
            method: context.company.paymentMethods[0].methodId
          });

          invoiceid = paymentreq.data.message;

          paymentSuccesfull = true;
        }catch{
          paymentSuccesfull = false;
        }


        // If the payment was successfull
        if(paymentSuccesfull){
          // Get the tokens that will be added according to the plan
          const amountToAdd = calculator.indexToPrice(context.company.plan?.product);
          // Add the totkens to the tokens of the company
          const updatedTokenValue = context.company.tokens + amountToAdd;

          // Update paymentmethod
          const newState = context.company.paymentMethods[0];
          newState.lastState = "successfull"
          const updatedMethods = [newState]

          // Create an order for the charged amount
          const currentOrders = context.company.orders;
          const nextInvoiceNumber = context.invoice_data.last_used_number+1;

          const newOrder: Order = {
            id: invoiceid,
            timestamp: Math.floor( Date.now() / 1000 ),
            tokens: amountToAdd,
            amount: context.calculations.products[context.company.plan?.product].price,
            method: "Stripe",
            state: "accepted",
            type: "recharge",
            invoiceId: `SM${context.invoice_data.number_offset + nextInvoiceNumber}`
          }

          // Added the new order to the company orders
          currentOrders.push( newOrder );
          // Update the last used invoice id
          await updateData( "Settings", "Invoices", { last_used_number: nextInvoiceNumber } );

          // Update the tokens of the company
          await updateData("Company", context.user.Company, {
            tokens: updatedTokenValue,
            paymentMethods: updatedMethods,
            orders: currentOrders
          });

          notificationApi.info({
            message: "Automatisches Nachfüllen",
            description: `Dein Credit-Budget wurde automatisch um ${toGermanCurrencyString(amountToAdd)} Tokens aufgefüllt!`,
            duration: MSGDURATION
          });
        }else{
          const newState = context.company.paymentMethods[0];
          newState.lastState = "error"
          const updatedMethods = [newState]

          await updateData("Company", context.user.Company, { tokens: context.company.tokens, paymentMethods: updatedMethods })

          notificationApi.error({
            message: "Automatisches Nafüllen",
            description: "Es ist ein Fehler beim automatischen Auffüllen deines Credit-Budgets aufgetreten.",
            duration: MSGDURATION
          });
        }
      }else{
        // Update the balance of the company
        console.log("Value to update ", context.company.tokens);
        await updateDoc( doc( db, "Company", context.user.Company ), { tokens: context.company.tokens } );
      }

    }else{
      // Update the balance of the company
      await updateDoc( doc( db, "Company", context.user.Company ), { tokens: context.company.tokens } );
    }
  }else{
    // Update the balance of the company
    await updateDoc( doc( db, "Company", context.user.Company ), { tokens: context.company.tokens } );
  }

  // Get the usage of the current month and year from the user
  const userusageidx = context.user.usedCredits.findIndex( ( val ) => {
    return val.month == currentMonth && val.year == currentYear
  } );

  // Check if the user used the tool in the current month and year
  if( userusageidx != -1 ){
    // If so just update the usage with the used tokens
    const usageupdates = context.user.usedCredits;
    usageupdates[userusageidx].amount += cost;
    await updateDoc( doc( db, "User", context.login.uid ), { usedCredits: usageupdates } );
  }else{
    // Otherwise create a new usage object and write it to the user
    const usageupdates = context.user.usedCredits;
    usageupdates.push( { month: currentMonth, year: currentYear, amount: cost } );
    await updateDoc( doc( db, "User", context.login.uid ), { usedCredits: usageupdates } );
  }
}
