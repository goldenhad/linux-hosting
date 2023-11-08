import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { auth } from '../../firebase/admin'
const fs = require('fs');

const openai = new OpenAI({
    apiKey: process.env.OPENAIAPIKEY
});

type ResponseData = {
    errorcode: number,
    message: String,
}


export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
    const token = await auth.verifyIdToken(req.cookies.token);

    if(req.method == "POST"){
        
        if(token){

            let data = req.body;

            if(data.tokens && data.time){
                let timestamp = Math.floor(Date.now() / 1000);

                let logobj = {
                    timestamp: timestamp,
                    tokens: data.tokens,
                    time: data.time
                }

                fs.appendFileSync('prompt_stats.log', JSON.stringify(logobj));

                return res.status(200).send({ errorcode: 0, message: "OK" });

            }else{
                return res.status(400).send({ errorcode: 3, message: "Missing Input!" });
            }

        }else{
            return res.status(400).send({ errorcode: 2, message: "Authentication required!"});
        }
    }else{
        return res.status(400).send({ errorcode: 1, message: "The request method is forbidden!"});
    }
}
