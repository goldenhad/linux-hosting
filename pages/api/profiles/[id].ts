import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../db';
import bcrypt from 'bcrypt';
import { connect } from 'http2';
import { Profile } from '@prisma/client';
import {AES, enc}from 'crypto-js';
require('dotenv').config();


//Special type for custom response-error-messages
type ResponseData = {
    errorcode: number,
    message: String,
}



export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {

    //Check if the request is a post request
    if(req.method == 'DELETE'){
        if(req.cookies.login){

            let loginObj = JSON.parse(Buffer.from(req.cookies.login, 'base64').toString('ascii'));
            let id = parseInt(req.query.id as string);

            if(!isNaN(id) && id >= 1){
                if(!loginObj.role.capabilities.superadmin){
                    try{
                        await prisma.profile.delete({
                            where: {
                                id: id,
                                userId: loginObj.id
                            }
                        });
    
                        return res.status(200).send({ errorcode: 0, message: "OK" });
                    }catch(e){
                        console.log(e);
                        return res.status(500).send({ errorcode: 5, message: "Delete failed" });
                    }
                }else{
                    return res.status(400).send({ errorcode: 3, message: "Insufficient rights" });
                }
            }
        }else{
            return res.status(400).send({ errorcode: 2, message: "Authentication required!" });
        }
    }else if(req.method == 'PUT'){
        if(req.cookies.login){

            let loginObj = JSON.parse(Buffer.from(req.cookies.login, 'base64').toString('ascii'));
            let id = parseInt(req.query.id as string);

            if(!isNaN(id) && id >= 1){
                if(!loginObj.role.capabilities.superadmin){
                    let data = req.body;
                    if(data.name && data.settings){
                        const salt = bcrypt.genSaltSync(12);
                        const pepper = process.env.PEPPER;
                        const baseSettings = JSON.stringify( data.settings );
                        const pass = salt + pepper;
                        const hash = AES.encrypt(baseSettings, pass).toString();

                        console.log(data.settings);
                        console.log(salt);
                        console.log(hash);

                        try{
                            await prisma.profile.update({
                                data: {
                                    name: data.name,
                                    settings: hash,
                                    salt: salt,
                                    userId: loginObj.id
                                },
                                where: {
                                    id: id,
                                    userId: loginObj.id
                                }
                            });

                            return res.status(200).send({ errorcode: 0, message: "OK" });
                        }catch(e){
                            console.log(e);
                            return res.status(500).send({ errorcode: 5, message: "Error creating the dataset!" });
                        }
                    }
                }else{
                    return res.status(400).send({ errorcode: 3, message: "Insufficient rights" });
                }
            }
        }else{
            return res.status(400).send({ errorcode: 2, message: "Authentication required!" });
        }
    }else{
        //If the request is anything other than a POST
        return res.status(400).send({ errorcode: 1, message: "The request method is forbidden!" });
    }
}