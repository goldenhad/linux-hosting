import type { NextApiRequest, NextApiResponse } from 'next';
require('dotenv').config();

//Special type for custom response-error-messages
type ResponseData = {
    errorcode: number,
    message: String,
}


export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {

    //Check if the request is a post request
    if(req.method == 'GET'){

        if(req.cookies.login){

            let loginObj = JSON.parse(Buffer.from(req.cookies.login, 'base64').toString('ascii'));

            if(loginObj.id){
                let version = process.env.VERSION;
                return res.status(200).send({errorcode: 0, message: version});
            }else{
                //If the needed data is not provided, send a bad request
                return res.status(400).send({ errorcode: 3, message: "Please provide all the neccessary data" });
            }
        }else{
            return res.status(400).send({ errorcode: 2, message: "The request method is forbidden!" });
        }
    }else{
        //If the request is anything other than a POST
        return res.status(400).send({ errorcode: 1, message: "The request method is forbidden!" });
    }
}