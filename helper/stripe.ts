import { Stripe, loadStripe } from "@stripe/stripe-js";
// eslint-disable-next-line @typescript-eslint/no-var-requires

let stripePromise: Promise<Stripe | null>;
const getStripe = () => {
  console.log(process.env.NEXT_PUBLIC_STRIPEPUB);
  if(process.env.NEXT_PUBLIC_STRIPEPUB){
    if (!stripePromise) {
      stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPEPUB);
    }
    return stripePromise;
  }
};

export default getStripe;