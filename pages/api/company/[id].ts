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
    if(req.method == "DELETE"){
        if(req.cookies.login){

            let loginObj = JSON.parse(Buffer.from(req.cookies.login, 'base64').toString('ascii'));

            if(loginObj.role.capabilities.superadmin){
                let id = parseInt(req.query.id as string);

                if(!isNaN(id) && id >= 1){
                    try{
                        await prisma.company.delete({
                            where: {
                                id: id
                            }
                        });
    
                        return res.status(200).send({ errorcode: 0, message: "OK" });
                    }catch(e){
                        console.log(e);
                        return res.status(500).send({ errorcode: 5, message: "Error creating the dataset!" });
                    }
                }else{
                    return res.status(400).send({ errorcode: 4, message: "Id malformed!" });
                }
            }else{
                return res.status(400).send({ errorcode: 3, message: "Insufficient rights" });
            }
        }else{
            return res.status(400).send({ errorcode: 2, message: "Authentication required!" });
        }
    }else if(req.method == "PUT"){
        if(req.cookies.login){

            let loginObj = JSON.parse(Buffer.from(req.cookies.login, 'base64').toString('ascii'));
            let id = parseInt(req.query.id as string);

            if(!isNaN(id) && id >= 1){
                let data = req.body;

                if(loginObj.role.capabilities.superadmin || (loginObj.role.capabilities.canEditOwnProject && loginObj.project.id == id) ){
                    try{
                        await prisma.company.update({
                            data: {
                                name: data.companyname,
                                street: data.companystreet,
                                city: data.companycity,
                                postalcode: data.companypostalcode,
                                country: data.companycountry,
                                settings: {background: data.companybackground}
                            },
                            where: {
                                id: id
                            }
                        });
    
                        return res.status(200).send({ errorcode: 0, message: "OK" });
                    }catch(e){
                        console.log(e);
                        return res.status(500).send({ errorcode: 5, message: "Error creating the dataset!" });
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