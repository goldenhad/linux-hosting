import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../db';
import { handleEmptyString } from '../../../helper/architecture';

//Special type for custom response-error-messages
type ResponseData = {
    errorcode: number,
    message: String,
}



export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {

    //Check if the request is a post request
    if(req.method == "PUT"){
        if(req.cookies.login){

            let loginObj = JSON.parse(Buffer.from(req.cookies.login, 'base64').toString('ascii'));
            let id = parseInt(req.query.id as string);

            if(!isNaN(id) && id >= 1){
                let data = req.body;

                if(loginObj.role ){
                    if(data.amount && data.month && data.year){
                        let amount = parseInt(data.amount);
                        
                        if(!isNaN(amount) && amount){
                            try{
                                let currentUsage = await prisma.tokenUsage.findFirst({where: {month: data.month, year: data.year, projectId: loginObj.project.id}});
    
                                if(currentUsage){
                                    await prisma.tokenUsage.update({
                                        data: {
                                            amount: currentUsage.amount + amount,
                                        },
                                        where: {
                                            id: currentUsage.id
                                        }
                                    });
                                }else{
                                    console.log(loginObj);
                                    await prisma.tokenUsage.create({
                                        data: {
                                            month: data.month,
                                            year: data.year,
                                            amount: amount,
                                            project: {
                                                connect: {
                                                    id: loginObj.project.id
                                                }
                                            }
                                        },
                                    })
                                }
                            }catch(e){
                                console.log(e);
                                return res.status(500).send({ errorcode: 5, message: "Error creating the dataset!" });
                            }
    
                            return res.status(200).send({ errorcode: 0, message: "OK" });
                        }

                    }
    
                    
                }else{
                    return res.status(400).send({ errorcode: 3, message: "Insufficient rights" });
                }
            }else{
                return res.status(400).send({ errorcode: 4, message: "Id malformed!" });
            }

        }else{
            return res.status(400).send({ errorcode: 2, message: "Authentication required!" });
        }
    }else{
        //If the request is anything other than a POST
        return res.status(400).send({ errorcode: 1, message: "The request method is forbidden!" });
    }
}