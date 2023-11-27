import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { auth } from '../../../firebase/admin'
const fs = require('fs');
const CryptoJS = require("crypto-js");


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

            if(data.content && data.salt){
                try{
                    let encrypted_data = CryptoJS.AES.encrypt(data.content, data.salt + process.env.MAILENC);

                    return res.status(200).send({ errorcode: 0, message: encrypted_data.toString() });
                }catch(e){
                    //console.log(e);
                    return res.status(400).send({ errorcode: 4, message: "Error while encrypting" });
                }
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
