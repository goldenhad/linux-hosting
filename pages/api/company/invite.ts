import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { prisma } from '../../../db';
import { auth } from '../../../firebase/admin'
import { sendMail } from '../../../helper/emailer';
const bcrypt = require("bcrypt")


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

            if( data.email && data.company && data.firstname && data.lastname ){
                
                try {
                    let text = `Sie wurden eingeladen http://localhost:3000/register?company=${data.company}&firstname=${data.firstname}&firstname=${data.lastname}`;
                    let html = `Sie wurden eingeladen <a href="http://localhost:3000/register?company=${data.company}&firstname=${data.firstname}&firstname=${data.lastname}">Jetzt registrieren!</a>`;
                    await sendMail(data.email, "Sie wurden eingeladen!", text, html);

                }catch(e){
                    return res.status(400).send({ errorcode: 1, message: "The provided Data has the wrong format" });
                }
            
                
                return res.status(200).send({ errorcode: 0, message: "OK" });
            }else{
                return res.status(400).send({ errorcode: 3, message: "Missing Input!" });
            }

        }else{
            return res.status(400).send({ errorcode: 2, message: "Authentication required!" });
        }
    }else{
        return res.status(400).send({ errorcode: 1, message: "The request method is forbidden!" });
    }
}
