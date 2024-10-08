import type { NextApiRequest, NextApiResponse } from "next";
import {
  ChatMessage,
  ContextChatEngine,
  Document,
  LLMStartEvent,
  QdrantVectorStore,
  VectorStoreIndex,
  OpenAI
} from "llamaindex";
import { encodingForModel } from "js-tiktoken";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Settings } from "llamaindex/Settings";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { extractText } from "llamaindex/llm/utils";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import ResponseData = Dispatcher.ResponseData;
import axios from "axios";
import { MsgType } from "../../../lib/components/Assistants/ChatAssistant/ChatAssistant";
import { firestore } from "../../../lib/firebase/admin";
import { TokenCalculator } from "../../../lib/helper/price";
import { Calculations, InvoiceSettings } from "../../../lib/firebase/types/Settings";
import { Company, Order } from "../../../lib/firebase/types/Company";
import { stripe } from "../../../lib/stripe/api";


const tokenCount = { in:0 , out: 0 };
const encoding = encodingForModel("gpt-4-0125-preview");

Settings.callbackManager.on("llm-start", (event: LLMStartEvent) => {
  const { messages } = event.detail.payload;
  console.log(messages);

  tokenCount.in = messages.reduce((count: number, message: ChatMessage) => {
    return count + encoding.encode(extractText(message.content)).length;
  }, 0);
}, { once: true });


Settings.callbackManager.on("llm-stream", (event) => {
  const { chunk } = event.detail.payload;
  const { delta } = chunk;
  tokenCount.out += encoding.encode(extractText(delta)).length;
});

const llm = new OpenAI({
  // currently is "gpt-4-turbo-2024-04-09"
  model: "gpt-4o-mini"
});

export default async function handler( req: NextApiRequest, res: NextApiResponse<ResponseData> ) {

  if(req.method == "POST"){

    const aid = req.body.aid;
    const companyId = req.body.companyId;

    const QDRANTURL = `${process.env.QDRANT_ADDRESS}:6333`;
    const query = req.body.query;
    const messages = req.body.messages;
    const assistantType = req.body.assistantType;


    if(aid && query && companyId && messages?.length && assistantType != undefined){
      messages.forEach((msg) => {
        msg.role = MsgType.ASSISTANT;
      })

      let index = undefined;

      // Check if the collection is available = if the user supplied a knowledgebase
      try{
        await axios.get(`${QDRANTURL}/collections/${aid}`);
        console.log("collection found!");

        const vectorStore = new QdrantVectorStore({
          collectionName: `${aid}`,
          url: QDRANTURL
        });

        index = await VectorStoreIndex.fromVectorStore(vectorStore);

      } catch (e){
        console.log("Collection not found!");

        const document = new Document({ text: "" });
        index = await VectorStoreIndex.fromDocuments([document]);
      }


      res.writeHead(200, {
        Connection: "keep-alive",
        "Content-Encoding": "none",
        "Cache-Control": "no-cache",
        "Content-Type": "text/event-stream"
      });

      const retriever = index.asRetriever();
      // Limit the context window to the three most relevant nodes
      retriever.similarityTopK = 3;

      const chatEngine = new ContextChatEngine({ retriever, chatModel: llm , chatHistory: messages });

      let resp = "";
      const response = chatEngine.chat({ message: query, stream: true });
      response.then(async (iter) => {
        res.flushHeaders();

        for await (const chunk of iter) {
          resp += chunk.response;


          res.write(`${chunk.response}`);
          res.flushHeaders();
        }
      }).finally(async () => {
        console.log(encoding.encode(extractText(resp)).length)
        console.log(`${tokenCount.in} ${tokenCount.out}`)
        console.log(`IN: $${(tokenCount.in / 1_000_000) * 30}`, `OUT: $${(tokenCount.out / 1_000_000) * 60}`);


        /*
        * After the request, calculate the cost and reduce the tokens of the company
        * If activated recharge automatically if the token count falls below zero...
        * */
        const companyData = await firestore.doc(`/Company/${companyId}`).get();
        const calculationData = await firestore.doc("/Settings/Calculation").get();
        const invoiceData = await firestore.doc("/Settings/Invoices").get();

        if(companyData.data() && calculationData.data() && invoiceData.data()){
          const calculator = new TokenCalculator(calculationData.data() as Calculations);
          const calculation = calculationData.data();
          const company  = companyData.data() as Company;
          const invoiceInfo = invoiceData.data() as InvoiceSettings;


          const cost = calculator.cost({ in: tokenCount.in, out: tokenCount.out }, assistantType);
          console.log("Kosten:", cost);
          if(company.plan && company.plan.state == "active" && company.tokens - cost < company.plan.threshold){
            console.log("Attempting Recharge...");
            let paymentSuccesfull = false;
            let invoiceid = "";

            const price = calculation.products[company.plan?.product].price;
            const customerId = company.customerId;
            const method = company.paymentMethods[0].methodId;

            try{
              const paymentreq = await stripe.paymentIntents.create({
                amount: price * 100,
                confirm: true,
                customer: customerId,
                currency: "eur",
                automatic_payment_methods: {
                  enabled: true
                },
                payment_method: method,
                off_session: true,
                description: "Automatische Nachbuchung Siteware Credits"
              });

              invoiceid = paymentreq.id;

              paymentSuccesfull = true;
            }catch(e){
              console.log(e);
              paymentSuccesfull = false;
            }

            console.log("Payment successfull?", paymentSuccesfull);

            // If the payment was successfull
            if(paymentSuccesfull){
              // Get the tokens that will be added according to the plan
              const amountToAdd = calculator.indexToPrice(company.plan?.product);
              // Add the totkens to the tokens of the company
              const updatedTokenValue = company.tokens + amountToAdd;

              // Update paymentmethod
              const newState = company.paymentMethods[0];
              newState.lastState = "successfull"
              const updatedMethods = [newState]

              // Create an order for the charged amount
              const currentOrders = company.orders;
              const nextInvoiceNumber = invoiceInfo.last_used_number+1;

              const newOrder: Order = {
                id: invoiceid,
                timestamp: Math.floor( Date.now() / 1000 ),
                tokens: amountToAdd,
                amount: calculation.products[company.plan?.product].price,
                method: "Stripe",
                state: "accepted",
                type: "recharge",
                invoiceId: `SM${invoiceInfo.number_offset + nextInvoiceNumber}`
              }

              console.log(invoiceInfo);

              // Added the new order to the company orders
              currentOrders.push( newOrder );
              // Update the last used invoice id
              await firestore.doc("/Settings/Invoices").update( { last_used_number: nextInvoiceNumber } );

              console.log(updatedTokenValue);

              // Update the tokens of the company
              await firestore.doc(`/Company/${companyId}`).update( {
                paymentMethods: updatedMethods,
                orders: currentOrders
              });

              company.tokens = updatedTokenValue;

            }else{
              const newState = company.paymentMethods[0];
              newState.lastState = "error"
              const updatedMethods = [newState]

              await firestore.doc(`/Company/${companyId}`).update({ tokens: company.tokens, paymentMethods: updatedMethods });
            }


            company.tokens -= cost;
            console.log(company.tokens);
          }else{
            // Just reduce the cost, the automatic recharge boundary was not triggered
            company.tokens -= cost;
          }


          try{
            await firestore.doc(`/Company/${companyId}`).update(company);

            return res.status(200).send(`<~${ JSON.stringify({ cost: cost }) }~>`);

          }catch (e){
            console.log(e);
            return res.status(500).send("Cost could not be reduced!");
          }

        }else{
          return res.status( 500 ).send( { errorcode: 3, message: "Cost could not be calculated!" } );
        }
      });
    }else{
      return res.status( 400 ).send( { errorcode: 2, message: "Missing data!" } );
    }
  }else{
    return res.status( 400 ).send( { errorcode: 1, message: "The request method is forbidden!" } );
  }

}