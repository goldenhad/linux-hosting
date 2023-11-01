import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { handleEmptyArray, handleEmptyString } from '../../../helper/architecture';
const openai = new OpenAI({
    apiKey: process.env.OPENAIAPIKEY
});

type ResponseData = {
    errorcode: number,
    message: String,
}


export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
    if(req.method == "POST"){
        if(req.cookies.login){

            let loginObj = JSON.parse(Buffer.from(req.cookies.login, 'base64').toString('ascii'));

            if(loginObj.username){
                let data = req.body;
                console.log(data);

                if( data ){
                    
                    console.log(data);
                    const prompt = `Ich bin ${data.personal}. Ich habe folgenden E-Mail-Dialog erhalten ${handleEmptyString(data.dialog)}. Schreibe eine Antwort auf den bisherigen Dialog, der dabei folgende Punkte berücksichtigt: "${handleEmptyString(data.continue)}". Schreibe deine Antwort in der ${handleEmptyString(data.address)}-Form. Der allgemeine Stil deiner Antwort sollte dabei ${handleEmptyArray(data.style).toString()} sein. Schätze dein Gegenüber als ${handleEmptyArray(data.order).toString()} ein. Die allgemeine Gemütslage der Nachricht sollte ${handleEmptyArray(data.emotions).toString()} sein. Die Länge der Nachricht sollte ${handleEmptyString(data.length)} sein.`
            
                    let wordcount  = prompt.trim().split(/\s+/).length;
                    let tokens = wordcount * 0.75;
                        
                    return res.status(200).send({ errorcode: 0, message: Math.ceil(tokens).toString()});

                }else{
                    return res.status(400).send({ errorcode: 3, message: "Missing Input!" });
                }

            }else{
                return res.status(400).send({ errorcode: 6, message: "Cookie malformed" });
            }
        }else{
            return res.status(400).send({ errorcode: 2, message: "Authentication required!" });
        }
    }else{
        return res.status(400).send({ errorcode: 1, message: "The request method is forbidden!" });
    }
}
