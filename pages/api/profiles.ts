import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../db';
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
    if(req.method == 'GET'){
        if(req.cookies.login){

            let loginObj = JSON.parse(Buffer.from(req.cookies.login, 'base64').toString('ascii'));

            if(!loginObj.role.capabilities.superadmin){
                try{
                    let profiles = await prisma.profile.findMany({
                        where: {
                            userId: loginObj.id
                        }
                    });
                    const pepper = process.env.PEPPER;

                    profiles.forEach((profile: Profile) => {
                        let encryptedBaseByte = AES.decrypt(profile.settings, profile.salt + pepper);
                        let encryptedBase = encryptedBaseByte.toString(enc.Utf8);
                        let decryptedSettings = profile.settings

                        console.log(decryptedSettings);
                    })

                    return res.status(200).send({ errorcode: 0, message: "OK" });
                }catch(e){
                    console.log(e);
                    return res.status(500).send({ errorcode: 5, message: "Error creating the dataset!" });
                }
            }else{
                return res.status(400).send({ errorcode: 3, message: "Insufficient rights" });
            }
        }else{
            return res.status(400).send({ errorcode: 2, message: "Authentication required!" });
        }
    }else if(req.method == 'POST'){
        if(req.cookies.login){

            let loginObj = JSON.parse(Buffer.from(req.cookies.login, 'base64').toString('ascii'));

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
                        await prisma.profile.create({
                            data: {
                                name: data.name,
                                settings: hash,
                                salt: salt,
                                userId: loginObj.id
                            }
                        });

                        return res.status(200).send({ errorcode: 0, message: "OK" });
                    }catch(e){
                        console.log(e);
                        return res.status(500).send({ errorcode: 5, message: "Error creating the dataset!" });
                    }
                }else{
                    return res.status(400).send({ errorcode: 4, message: "Data missing!" });
                }
            }else{
                return res.status(400).send({ errorcode: 3, message: "Insufficient rights" });
            }
        }else{
            return res.status(400).send({ errorcode: 2, message: "Authentication required!" });
        }
    }else{
        //If the request is anything other than a POST
        return res.status(400).send({ errorcode: 1, message: "The request method is forbidden!" });
    }
}