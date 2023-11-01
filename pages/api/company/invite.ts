import type { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '../../../firebase/admin'
import { sendMail } from '../../../helper/emailer';
import findDocuments from '../../../firebase/data/findDocuments';
import exists from '../../../firebase/auth/userExists';
import userExists from '../../../firebase/auth/userExists';

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
                
                let exists = await userExists(data.email);
                console.log(exists);

                if(!exists){
                    let inviteobj = { company: data.company, email: data.email, firstname: data.firstname, lastname: data.lastname };
                    const json = JSON.stringify(inviteobj);
                    let invitecode =  Buffer.from(json).toString("base64");

                    let baseurl = process.env.BASEURL;

                    try {
                        let text = `Sie wurden eingeladen ${baseurl}/register?invite=${invitecode}`;
                        let html = `Sie wurden eingeladen <a href="${baseurl}/register?invite=${invitecode}">Jetzt registrieren!</a>`;
                        await sendMail(data.email, "Sie wurden eingeladen!", text, html);

                        return res.status(200).send({ errorcode: 0, message: "OK" });

                    }catch(e){
                        return res.status(400).send({ errorcode: 1, message: "The provided Data has the wrong format" });
                    }
                }else{
                    return res.status(400).send({ errorcode: 4, message: "A User with this E-Mail already exists!" });
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
