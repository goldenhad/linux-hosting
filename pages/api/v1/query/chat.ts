import type { NextApiRequest, NextApiResponse } from "next";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import ResponseData = Dispatcher.ResponseData;
import { validateApiKey } from "../../../../helper/api/apiKey";
import { MsgType } from "../../../../components/Assistants/ChatAssistant/ChatAssistant";
import axios from "axios";
import {
  ChatMessage,
  ContextChatEngine,
  Document,
  LLMStartEvent,
  OpenAI,
  QdrantVectorStore,
  VectorStoreIndex
} from "llamaindex";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { extractText } from "llamaindex/llm/utils";
import { firestore } from "../../../../firebase/admin";
import { TokenCalculator } from "../../../../helper/price";
import { Calculations, InvoiceSettings } from "../../../../firebase/types/Settings";
import { Company, Order } from "../../../../firebase/types/Company";
import { stripe } from "../../../../stripe/api";
import { encodingForModel } from "js-tiktoken";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Settings } from "llamaindex/Settings";
import Assistant, { AssistantType, InputBlock } from "../../../../firebase/types/Assistant";


// Define the url where we reach qdrant
const QDRANTURL = `${process.env.QDRANT_ADDRESS}:6333`;
// Define the tokencount object where we store information about the used tokens
const tokenCount = { in:0 , out: 0 };
// Define the token encoding used for token counting
const encoding = encodingForModel("gpt-4-0125-preview");

// Define the llm object used to generate the content
const llm = new OpenAI({
  model: "gpt-4o"
});

/**
 * Callback to run if we query a llm.
 * We use this to calculate the token input into the llm
 */
Settings.callbackManager.on("llm-start", (event: LLMStartEvent) => {
  // Get the messages send to the llm
  const { messages } = event.detail.payload;

  // Count the tokens and save them to the global tokenCount object
  tokenCount.in = messages.reduce((count: number, message: ChatMessage) => {
    // Call the encoder to get the used tokens from the current message
    return count + encoding.encode(extractText(message.content)).length;
  }, 0);
}, { once: true });

/**
 * Callback to run everytime the llm sends us data.
 * We use this callback to incrementally increase the used output token
 */
Settings.callbackManager.on("llm-stream", (event) => {
  // Get the received chunk
  const { chunk } = event.detail.payload;
  // Query the generated content of the chunk
  const { delta } = chunk;
  // Call the encoder to count the used token of the chunk
  tokenCount.out += encoding.encode(extractText(delta)).length;
});


export default async function handler( req: NextApiRequest, res: NextApiResponse<ResponseData> ) {
  if(req.method == "POST"){

    console.log(req.body);

    // Get the expected headers from the request
    const apikey = req.headers["x-api-key"] as string;

    // Get the expected params from the request body
    const aid = req.body.aid;
    const query = req.body.query;
    const messages = req.body.messages;

    // Check if all expected parameters are present
    if(aid && query && messages?.length >= 0){

      // validate the api key
      validateApiKey(apikey).then(async ({ user }) => {
        // If the key is valid...
        // Parse the given messages as json object
        const parsedMessages = JSON.parse(messages);

        const assistantData = await firestore.doc(`/Assistants/${aid}`).get();
        const liveAssistantData = assistantData.data() as Assistant;

        if(liveAssistantData){
          if(liveAssistantData.blocks.length > 0){
            const inputBlock = liveAssistantData.blocks[0] as InputBlock;

            if(inputBlock.type == AssistantType.CHAT){
              // Iterate over the send messages and change the message role to ASSISTANT
              // This step is relevant as GPT interprets ASSISTANT messages as context
              parsedMessages.forEach((msg) => {
                msg.role = MsgType.ASSISTANT;
              })

              // Init the index object
              let index = undefined;

              // Check if the collection is available = if the user supplied a knowledgebase
              try{
                // Query QDRANT for the context of the assistant
                // This request fails if the assistant has no knowledgebase
                await axios.get(`${QDRANTURL}/collections/${aid}`);

                // Construct the vector storage with qdrant
                const vectorStore = new QdrantVectorStore({
                  collectionName: `${aid}`,
                  url: QDRANTURL
                });

                // Set the index to the index given by the constructed vector storage
                index = await VectorStoreIndex.fromVectorStore(vectorStore);
              } catch (e){
                // If any error occurs create an empty document
                const document = new Document({ text: "" });
                // Construct index from empty doc
                index = await VectorStoreIndex.fromDocuments([document]);
              }


              // Set the response headers to streaming content
              res.writeHead(200, {
                Connection: "keep-alive",
                "Content-Encoding": "none",
                "Cache-Control": "no-cache",
                "Content-Type": "text/event-stream"
              });

              // Get the context retriever from the previously constructed index
              const retriever = index.asRetriever();
              // Limit the context window to the k most relevant nodes
              retriever.similarityTopK = 10;

              // Get a ContextChatEngine object with the context retriever, our previously defined llm and the messages in the chat
              const chatEngine = new ContextChatEngine({ retriever, chatModel: llm , chatHistory: parsedMessages });

              // Define the response string
              let resp = "";

              // Query the chat engine for a response
              const response = chatEngine.chat({ message: query, stream: true });

              // If a response was send
              response.then(async (iter) => {
                res.flushHeaders();

                // GPT send an iterable object containing a set of chunks
                // Iterate over the chunks
                for await (const chunk of iter) {
                  // Add the current chunk to the response string
                  resp += chunk.response;

                  // Write the generated chunk to the response stream
                  res.write(`${chunk.response}`);
                  res.flushHeaders();
                }
              }).finally(async () => {
                console.log(encoding.encode(extractText(resp)).length)
                //console.log(`${tokenCount.in} ${tokenCount.out}`)
                console.log(`IN: $${(tokenCount.in / 1_000_000) * 5}`, `OUT: $${(tokenCount.out / 1_000_000) * 15}`);


                /*
                * After the request, calculate the cost and reduce the tokens of the company
                * If activated recharge automatically if the token count falls below zero...
                * */
                const companyData = await firestore.doc(`/Company/${user.Company}`).get();
                const calculationData = await firestore.doc("/Settings/Calculation").get();
                const invoiceData = await firestore.doc("/Settings/Invoices").get();

                // Check if all relevant data is present before calculating the used amount of money
                if(companyData.data() && calculationData.data() && invoiceData.data() && assistantData.data()){
                  // Construct a calculator object to delegate the calculation of the used money
                  const calculator = new TokenCalculator(calculationData.data() as Calculations);
                  const calculation = calculationData.data();
                  const company  = companyData.data() as Company;
                  const invoiceInfo = invoiceData.data() as InvoiceSettings;
                  const assistant: Assistant = assistantData.data() as Assistant;

                  // Get the input block of the assistant
                  const assistantInputBlock = assistant.blocks[0] as InputBlock;

                  // If an assistantinputblock is present
                  if(assistantInputBlock && assistantInputBlock.type != undefined){
                    // Get the cost of the generated message
                    const cost = calculator.cost({ in: tokenCount.in, out: tokenCount.out }, assistantInputBlock.type);

                    // Check if company has defined a plan that is active and exceeds the threshold of the plan
                    if(company.plan && company.plan.state == "active" && company.tokens - cost < company.plan.threshold){
                      // If the threshold was exceeded attempt a recharge
                      // Init the successfull flag
                      let paymentSuccesfull = false;
                      // Init the generated invoice id
                      let invoiceid = "";

                      // Get the cost of the product associated with the companies plan
                      const price = calculation.products[company.plan?.product].price;
                      // Get the stripe customer id of the company
                      const customerId = company.customerId;
                      // Get the payment method defined for the company
                      const method = company.paymentMethods[0].methodId;

                      // Attempt the recharge
                      try{
                        // Create the payment request at stripe
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

                        // Get the invoice id from the create request
                        invoiceid = paymentreq.id;

                        // Mark the recharge as successful
                        paymentSuccesfull = true;
                      }catch(e){
                        console.log(e);
                        // If any error occurs make the recharge as unsuccessful
                        paymentSuccesfull = false;
                      }

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
                        await firestore.doc(`/Company/${user.Company}`).update( {
                          paymentMethods: updatedMethods,
                          orders: currentOrders
                        });

                        company.tokens = updatedTokenValue;

                      }else{
                        const newState = company.paymentMethods[0];
                        newState.lastState = "error"
                        const updatedMethods = [newState]

                        await firestore.doc(`/Company/${user.Company}`).update({ tokens: company.tokens, paymentMethods: updatedMethods });
                      }

                      // Reduce the balance of the company by the cost used by this request
                      company.tokens -= cost;
                      console.log(company.tokens);
                    }else{
                      // Just reduce the cost, the automatic recharge boundary was not triggered
                      company.tokens -= cost;
                    }

                    // Update the tokens of the company
                    try{
                      await firestore.doc(`/Company/${user.Company}`).update(company);
                      // If the request was successful finish the response by returning
                      return res.status(200).send("\n");
                    }catch (e){
                      console.log(e);
                      // If the cost could not be reduced send a server error
                      return res.status(500).send("Cost could not be reduced!");
                    }
                  }else{
                    return res.status( 500 ).send( { errorcode: 7, message: "Assistant configuration invalid!" } );
                  }

                }else{
                  return res.status( 500 ).send( { errorcode: 6, message: "Cost could not be calculated!" } );
                }
              });
            }else{
              return res.status( 400 ).send( { errorcode: 5, message: "The requested Assistant is not a chat assistant" } );
            }
          }else{
            return res.status( 400 ).send( { errorcode: 4, message: "No blocks defined, please revisit the editor!" } );
          }
        }else{
          return res.status( 400 ).send( { errorcode: 3, message: "Assistant not defined!" } );
        }
      }).catch((reason) => {
        console.log(reason);
        return res.status( 400 ).send( reason );
      })
    }else{
      return res.status( 400 ).send( { errorcode: 2, message: "Missing data!" } );
    }
  }else{
    return res.status( 400 ).send( { errorcode: 1, message: "The request method is forbidden!" } );
  }

}