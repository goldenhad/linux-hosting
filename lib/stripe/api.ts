import Stripe from "stripe";

/**
 * Creat the stripe object used for stripe api requests
 */
export const stripe = new Stripe(process.env.STRIPEPRIV, {
  typescript: true,
  apiVersion: "2023-10-16"
});