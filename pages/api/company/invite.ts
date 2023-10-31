import type { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '../../../firebase/admin'
import { sendMail } from '../../../helper/emailer';

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
                
                let inviteobj = { company: data.company, email: data.email, firstname: data.firstname, lastname: data.lastname };
                const json = JSON.stringify(inviteobj);
                let invitecode =  Buffer.from(json).toString("base64");

                try {
                    let text = `Sie wurden eingeladen http://localhost:3000/register?invite=${invitecode}`;
                    let html = `Sie wurden eingeladen <a href="http://localhost:3000/register?invite=${invitecode}">Jetzt registrieren!</a>`;
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
