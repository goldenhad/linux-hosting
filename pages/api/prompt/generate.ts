import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { prisma } from '../../../db';
const openai = new OpenAI({
    apiKey: process.env.OPENAIAPIKEY
});

type ResponseData = {
    errorcode: number,
    message: String,
    tokens: number
}


export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
    if(req.method == "POST"){
        if(req.cookies.login){

            let loginObj = JSON.parse(Buffer.from(req.cookies.login, 'base64').toString('ascii'));

            if(loginObj.username){
                let data = req.body;

                if(data.personal && data.dialog && data.continue && data.address && data.style && data.order && data.emotions && data.length ){
                    
                    console.log(data);
                    const prompt = `Ich bin ${data.personal}. Ich habe folgenden E-Mail-Dialog erhalten ${data.dialog}. Schreibe eine Antwort auf den bisherigen Dialog, der dabei folgende Punkte berücksichtigt: "${data.continue}". Schreibe deine Antwort in der ${data.address}-Form. Der allgemeine Stil deiner Antwort sollte dabei ${data.style.toString()} sein. Schätze dein Gegenüber als ${data.order.toString()} ein. Die allgemeine Gemütslage der Nachricht sollte ${data.emotions.toString()} sein. Die Länge der Nachricht sollte ${data.length} sein.`
                
                    try{
                        const { data: completions, response: raw } = await openai.chat.completions.create({
                            model: "gpt-4",
                            messages: [
                            { 
                                role: 'user',
                                content: prompt
                            }],
                        }).withResponse();
        
                        if(completions){
                            if(completions.choices.length >= 1){
                                if(completions.choices[0].message){
                                    if(completions.choices[0].message.content){
                
                                        return res.status(200).send({ errorcode: 0, message: completions.choices[0].message.content, tokens: (completions.usage?.total_tokens)? completions.usage?.total_tokens: -1 });
                                    }
                                }
                            }
                        }
                        
                        return res.status(400).send({ errorcode: -1, message: "Error generating answer", tokens: -1});
                    }catch(E){
                        console.log(E);
                        return res.status(400).send({ errorcode: -2, message: "Error generating answer", tokens: -1});
                    }

                }else{
                    return res.status(400).send({ errorcode: 3, message: "Missing Input!", tokens: -1 });
                }

            }else{
                return res.status(400).send({ errorcode: 6, message: "Cookie malformed", tokens: -1 });
            }
        }else{
            return res.status(400).send({ errorcode: 2, message: "Authentication required!", tokens: -1 });
        }
    }else{
        return res.status(400).send({ errorcode: 1, message: "The request method is forbidden!", tokens: -1 });
    }
}
