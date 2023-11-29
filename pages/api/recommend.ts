import type { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '../../firebase/admin'
const CryptoJS = require("crypto-js");
const crypto = require("crypto");

type ResponseData = {
    errorcode: number,
    message: String,
}


export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
    const token = await auth.verifyIdToken(req.cookies.token);

    if(req.method == "POST"){
        
        if(token){

            let data = req.body;

            if( data.from ){
                
                let recommendobj = {
                    from: data.from
                };

                try {
                    const json = JSON.stringify(recommendobj);
                    let recommenddata =  Buffer.from(json).toString("base64");
                    let recommendcode = Buffer.from(CryptoJS.AES.encrypt(recommenddata, process.env.MAILENC).toString()).toString('base64');

                    let baseurl = process.env.BASEURL;

                    let invitelink = `${baseurl}/register?recommend=${recommendcode}`;

                    return res.status(200).send({ errorcode: 0, message: invitelink });

                }catch(e){
                    return res.status(400).send({ errorcode: 1, message: "The provided Data causend an error" });
                }
            
                
                
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
